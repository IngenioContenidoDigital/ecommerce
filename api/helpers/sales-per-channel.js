module.exports = {
  friendlyName: 'Sales per channel',
  description: 'Ventas por canal',
  inputs: {
    sellerId: {
      type:'string',
      required: true
    },
    integration: {
      type:'ref',
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
    let ordersCommission = [];
    let ordersItemsDelivered = [];
    let ordersItemsCommission = [];
    let ordersItems = [];
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
    const ordersDelivered = {total: 0, price:0};
    const ordersReturnComission = {total: 0, price:0};
    const ordersFailedComission = {total: 0, price:0};
    const retIca = seller.retIca && seller.retIca > 0 ? seller.retIca : 9.66;
    let commissionChannel = await CommissionChannel.findOne({seller: inputs.sellerId, channel: inputs.integration.channel.id });
    let orders = await Order.find({
      where: {
        seller: inputs.sellerId,
        integration: inputs.integration.id,
        createdAt: { '>': inputs.dateStart }
      }
    }).populate('currentstatus').populate('customer');
    let status = await OrderState.findOne({name: 'entregado'});

    if (commissionChannel && commissionChannel.collect) {
      let packed= await OrderState.find({
        where:{name:['fallido','retornado']},
        select:['id']
      });
      for(let s of packed){if(!statesIds.includes(s.id)){statesIds.push(s.id);}}
      ordersCommission = await Order.find({
        where: {
          seller: inputs.sellerId,
          integration: inputs.integration.id,
          createdAt: { '>': inputs.dateStartCommission},
          updatedAt: {'>': inputs.dateStart}
        }
      }).populate('currentstatus').populate('customer');
    }
    let ordersDelv = await Order.find({
      where: {
        seller: inputs.sellerId,
        integration: inputs.integration.id,
        updatedAt: {'>': inputs.dateStart}
      }
    }).populate('currentstatus').populate('customer');
    for (const order of ordersDelv) {
      let items = await OrderItem.find({order: order.id, currentstatus: status.id, updatedAt: { '>': inputs.dateStart, '<': inputs.dateEnd }}).populate('currentstatus').populate('order');
      for (const item of items) {
        ordersItemsDelivered.push(item);
        ordersDelivered.total += 1;
        ordersDelivered.price += item.price;
      }
    }
    for (const order of ordersCommission) {
      let items = await OrderItem.find({
        order: order.id,
        currentstatus: statesIds,
        createdAt: { '>': inputs.dateStartCommission, '<': inputs.dateEndCommission },
        updatedAt: {'>': inputs.dateStart, '<': inputs.dateEnd}
      }).populate('currentstatus').populate('order');
      for (const item of items) {
        ordersItemsCommission.push(item);
        const salesCommission = item.commission || 0;
        const commissionFee = item.price * (salesCommission/100);
        commissionFeeOrdersFailed += commissionFee * 1.19;
        if (order.paymentMethod === 'PayuCcPayment') {
          totalTcComission += item.price / 1.19;
        }
        if (address.city.name === 'bogota' || (seller.retIca && seller.retIca > 0)) {
          totalRetIcaCommission += (commissionFee * (retIca/1000));
        }
        if(item.currentstatus.name === 'fallido'){
          ordersFailedComission.total += 1;
          ordersFailedComission.price += item.price;
        }else if(item.currentstatus.name === 'retornado'){
          ordersReturnComission.total += 1;
          ordersReturnComission.price += item.price;
        }
      }
    }

    for (const order of orders) {
      let items = await OrderItem.find({order: order.id, createdAt: { '>': inputs.dateStart, '<': inputs.dateEnd }}).populate('currentstatus').populate('order');
      for (const item of items) {
        ordersItems.push(item);
        if (item.currentstatus.name === 'aceptado' || item.currentstatus.name === 'enviado'
            || item.currentstatus.name === 'empacado' || item.currentstatus.name === 'en procesamiento'
            || item.currentstatus.name === 'entregado'){
          fleteTotal += parseFloat(order.fleteTotal);
          const salesCommission = item.commission || 0;
          let commissionFee = item.price * (salesCommission/100);
          totalCommissionFee += commissionFee * 1.19;
          if (order.paymentMethod === 'PayuCcPayment' && commissionChannel && commissionChannel.collect) {
            totalCc += item.price / 1.19;
          }
          if (address.city.name === 'bogota' || (seller.retIca && seller.retIca > 0)) {
            totalRetIca += (commissionFee * (retIca/1000));
          }
          totalPrice += item.price;
        }else if(item.currentstatus.name === 'cancelado'){
          ordersCancel.total += 1;
          ordersCancel.price += item.price;
        }else if(item.currentstatus.name === 'fallido'){
          ordersFailed.total += 1;
          ordersFailed.price += item.price;
        }else if(item.currentstatus.name === 'retornado'){
          ordersReturn.total += 1;
          ordersReturn.price += item.price;
        }
      }
    }
    const rteIca = (totalCc * 0.19);
    const rteIcaCommssion = (totalTcComission * 0.19);
    let rteTc = (totalCc * 0.015) + (rteIca * 0.15) + (totalCc * 0.00414);
    let rteTcComission = (totalTcComission * 0.015) + (rteIcaCommssion*0.15) + (totalTcComission * 0.00414);
    const vrBase = (commissionFeeOrdersFailed / 1.19);
    return exits.success({
      rteTc,
      rteTcComission,
      totalPrice,
      totalRetIca: totalRetIca - totalRetIcaCommission,
      totalCommissionIva: totalCommissionFee,
      totalCommission: (totalCommissionFee/1.19) - vrBase,
      ordersCancel,
      ordersReturn,
      ordersFailed,
      ordersDelivered,
      fleteTotal,
      ordersFailedComission,
      ordersReturnComission,
      totalDiscountOrders: commissionFeeOrdersFailed,
      orders: ordersItems,
      ordersCommission: ordersItemsCommission,
      resultOrdersDelivered: ordersItemsDelivered
    });
  }
};
