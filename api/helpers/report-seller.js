module.exports = {
  friendlyName: 'Report seller',
  description: 'Estadistica para el informe del seller',
  inputs: {
    sellerId: {
      type:'string',
      required: true
    },
    month: {
      type:'string',
      required: true
    }
  },
  exits: {
    success: {
      description: 'All done.',
    },
  },
  fn: async function (inputs, exits) {
    const moment = require('moment');
    moment.locale('es');
    let ordersItem = [];
    let seller = await Seller.findOne({ id: inputs.sellerId });
    let address = await Address.findOne({ id: seller.mainAddress }).populate('city').populate('country');
    let dateStart = new Date(moment(inputs.month, 'MMMM YYYY').subtract(1, 'months').startOf('month').format('YYYY/MM/DD')).valueOf();
    let dateEnd = new Date(moment(inputs.month, 'MMMM YYYY').subtract(1, 'months').endOf('month').add(1, 'days').format('YYYY/MM/DD')).valueOf();
    let dateStartCommission = new Date(moment(inputs.month, 'MMMM YYYY').subtract(2, 'months').startOf('month').format('YYYY/MM/DD')).valueOf();
    let dateEndCommission = new Date(moment(inputs.month, 'MMMM YYYY').subtract(2, 'months').endOf('month').add(1, 'days').format('YYYY/MM/DD')).valueOf();
    let totalPrice = 0;
    let totalCommissionFee = 0;
    let totalCommissionVat = 0;
    let totalRetFte = 0;
    let totalRetIca = 0;
    let totalSkuInactive = 0;
    let totalSkuActive = 0;
    let statesIds = [];
    let packed= await OrderState.find({
      where:{name:['fallido','retornado']},
      select:['id']
    });
    for(let s of packed){if(!statesIds.includes(s.id)){statesIds.push(s.id);}}
    let orders = await Order.find({
      where: {
        seller: inputs.sellerId,
        createdAt: { '>': dateStart, '<': dateEnd }
      }
    }).populate('currentstatus');

    let ordersCommission = await Order.find({
      where: {
        seller: inputs.sellerId,
        currentstatus: statesIds,
        createdAt: { '>': dateStartCommission, '<': dateEndCommission },
        updatedAt: {'>': dateStart, '<': dateEnd}
      }
    }).populate('currentstatus').populate('customer');
    let commissionFeeOrdersFailed = 0;
    let commissionVatOrdersFailed = 0;
    let totalRetFteCommission = 0;
    let totalRetIcaCommission = 0;
    const ordersReturnComission = {total: 0, price:0};
    const ordersFailedComission = {total: 0, price:0};
    for (const order of ordersCommission) {
      let items = await OrderItem.find({order: order.id});
      for (const item of items) {
        const salesCommission = item.commission || 0;
        const commissionFee = item.price * (salesCommission/100);
        commissionFeeOrdersFailed += commissionFee;
        commissionVatOrdersFailed += (commissionFee * 0.19);
        totalRetFteCommission += (commissionFee * 0.04);
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
    totalSkuInactive = await Product.count({
      where: {
        seller: inputs.sellerId,
        createdAt: { '<': dateEnd },
        active: false
      }
    });
    totalSkuActive = await Product.count({
      where: {
        seller: inputs.sellerId,
        createdAt: { '<': dateEnd },
        active: true
      }
    });
    let totalProducts = seller.activeSku ? await Product.count({
      where: {
        seller: inputs.sellerId,
        createdAt: { '<': dateEnd },
        active: true
      }
    }) : await Product.count({
      where: {
        seller: inputs.sellerId,
        createdAt: { '<': dateEnd }
      }
    });
    let skuPrice = seller.skuPrice;
    let reportSkuPrice = await ReportSkuPrice.findOne({seller: seller.id, month: inputs.month});
    if (reportSkuPrice) {
      skuPrice = reportSkuPrice.price;
      totalProducts = reportSkuPrice.totalProducts;
    } else {
      reportSkuPrice = await ReportSkuPrice.create({month: inputs.month,seller: seller.id,price: skuPrice, totalProducts: totalProducts}).fetch();
      skuPrice = reportSkuPrice.price;
      totalProducts = reportSkuPrice.totalProducts;
    }
    let totalSku = totalProducts ? (Math.ceil(totalProducts /100)) * skuPrice * 1.19 : 0;
    const ordersCancel = {total: 0, price:0};
    const ordersReturn = {total: 0, price:0};
    const ordersFailed = {total: 0, price:0};
    let fleteTotal = 0;
    for (const order of orders) {
      if (order.currentstatus.name === 'aceptado' || order.currentstatus.name === 'enviado'
          || order.currentstatus.name === 'empacado' || order.currentstatus.name === 'en procesamiento'
          || order.currentstatus.name === 'entregado'){
        let items = await OrderItem.find({order: order.id});
        fleteTotal += parseFloat(order.fleteTotal);
        for (const item of items) {
          const salesCommission = item.commission || 0;
          let commissionFee = item.price * (salesCommission/100);
          totalCommissionFee += commissionFee;
          totalCommissionVat += (commissionFee * 0.19);
          totalRetFte += (commissionFee * 0.04);
          if (address.city.name === 'bogota') {
            totalRetIca += (commissionFee * (9.66/1000));
          }
          totalPrice += item.price;
          ordersItem.push(item);
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
    totalRetIca = totalRetIca - totalRetIcaCommission;
    totalRetFte = totalRetFte - totalRetFteCommission;
    let totalCommission = (totalCommissionFee + totalCommissionVat) - (commissionFeeOrdersFailed + commissionVatOrdersFailed);
    let totalOtherConcepts = totalSku + fleteTotal;
    totalRetFte = totalSku !== 0 ? totalRetFte + (totalSku >= 142000 ? (totalOtherConcepts/1.19)*0.04 : 0) : totalRetFte;
    totalRetIca = totalSku !== 0  && address.city.name === 'bogota' ? totalRetIca + (totalSku >= 142000 ? (totalOtherConcepts/1.19)*(9.66/1000) : 0) : totalRetIca;
    let totalBalance = totalCommission + totalOtherConcepts - (totalRetFte + totalRetIca);
    return exits.success({
      seller,
      address,
      totalPrice,
      totalCommission,
      totalSku,
      totalRetFte,
      totalRetIca,
      totalBalance,
      totalSkuInactive,
      totalSkuActive,
      ordersCancel,
      ordersReturn,
      ordersFailed,
      fleteTotal,
      ordersFailedComission,
      ordersReturnComission,
      ordersCommission
    });
  }
};
