module.exports = {
  friendlyName: 'Sales per channel',
  description: 'Ventas por canal',
  inputs: {
    sellerId: {
      type:'string',
      required: true
    },
    integration: {
      type:'string',
      required: true
    },
    dateStart: {
      type: 'number',
      required: true
    },
    dateEnd: {
      type:'number',
      required: true
    },
    dateStartCommission: {
      type: 'number',
      required: true
    },
    dateEndCommission: {
      type:'number',
      required: true
    }
  },
  exits: {
    success: {
      description: 'All done.',
    },
  },
  fn: async function (inputs, exits) {
    let seller = await Seller.findOne({ id: inputs.sellerId });
    let address = await Address.findOne({ id: seller.mainAddress }).populate('city').populate('country');
    let statesIds = [];
    let totalCommissionFee = 0;
    let totalRetIca = 0;
    let fleteTotal = 0;
    let totalPrice = 0;
    let totalCc = 0;
    let totalTcComission = 0;
    let totalRetIcaCommission = 0;
    let commissionFeeOrdersFailed = 0;
    const ordersCancel = {total: 0, price:0};
    const ordersReturn = {total: 0, price:0};
    const ordersFailed = {total: 0, price:0};
    const ordersReturnComission = {total: 0, price:0};
    const ordersFailedComission = {total: 0, price:0};

    let orders = await Order.find({
      where: {
        seller: inputs.sellerId,
        integration: inputs.integration,
        createdAt: { '>': inputs.dateStart, '<': inputs.dateEnd }
      }
    }).populate('currentstatus');
    let packed= await OrderState.find({
      where:{name:['fallido','retornado']},
      select:['id']
    });
    for(let s of packed){if(!statesIds.includes(s.id)){statesIds.push(s.id);}}

    let ordersCommission = await Order.find({
      where: {
        seller: inputs.sellerId,
        currentstatus: statesIds,
        integration: inputs.integration,
        createdAt: { '>': inputs.dateStartCommission, '<': inputs.dateEndCommission },
        updatedAt: {'>': inputs.dateStart, '<': inputs.dateEnd}
      }
    }).populate('currentstatus').populate('customer');
    for (const order of ordersCommission) {
      let items = await OrderItem.find({order: order.id});
      for (const item of items) {
        const salesCommission = item.commission || 0;
        const commissionFee = item.price * (salesCommission/100);
        commissionFeeOrdersFailed += commissionFee * 1.19;
        if (order.paymentMethod === 'PayuCcPayment' && order.channel === 'dafiti') {
          totalTcComission += item.price / 1.19;
        }
        if (address.city.name === 'bogota') {
          totalRetIcaCommission += (commissionFee * (9.66/1000));
        }
      }
      if(order.currentstatus.name === 'fallido'){
        ordersFailedComission.total += 1;
        ordersFailedComission.price += order.totalOrder;
      }else if(order.currentstatus.name === 'retornado'){
        ordersReturnComission.total += 1;
        ordersReturnComission.price += order.totalOrder;
      }
    }
    for (const order of orders) {
      if (order.currentstatus.name === 'aceptado' || order.currentstatus.name === 'enviado'
          || order.currentstatus.name === 'empacado' || order.currentstatus.name === 'en procesamiento'
          || order.currentstatus.name === 'entregado'){
        let items = await OrderItem.find({order: order.id});
        fleteTotal += parseFloat(order.fleteTotal);
        for (const item of items) {
          const salesCommission = item.commission || 0;
          let commissionFee = item.price * (salesCommission/100);
          totalCommissionFee += commissionFee * 1.19;
          if (order.paymentMethod === 'PayuCcPayment' && order.channel === 'dafiti') {
            totalCc += item.price / 1.19;
          }
          if (address.city.name === 'bogota') {
            totalRetIca += (commissionFee * (9.66/1000));
          }
          totalPrice += item.price;
        }
      }else if(order.currentstatus.name === 'cancelado'){
        ordersCancel.total += 1;
        ordersCancel.price += order.totalOrder;
      }else if(order.currentstatus.name === 'fallido'){
        ordersFailed.total += 1;
        ordersFailed.price += order.totalOrder;
      }else if(order.currentstatus.name === 'retornado'){
        ordersReturn.total += 1;
        ordersReturn.price += order.totalOrder;
      }
    }
    const rteIca = (totalCc * 0.19);
    let rteTc = (totalCc * 0.015) + (rteIca * 0.15) + (totalCc * 0.00414);

    const vrBase = (commissionFeeOrdersFailed / 1.19);
    const totalDiscountOrders = commissionFeeOrdersFailed + (totalTcComission * 0.015) + ((totalTcComission * 0.19)*0.15) - (vrBase * 0.04) - totalRetIcaCommission;
    return exits.success({
      rteTc,
      totalPrice,
      totalRetIca,
      totalCommissionIva: totalCommissionFee,
      totalCommission: totalCommissionFee/1.19,
      ordersCancel,
      ordersReturn,
      ordersFailed,
      fleteTotal,
      ordersFailedComission,
      ordersReturnComission,
      ordersCommission,
      totalDiscountOrders
    });
  }
};
