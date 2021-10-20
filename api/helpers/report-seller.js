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
    let seller = await Seller.findOne({ id: inputs.sellerId });
    let integrations = await Integrations.find({ seller: inputs.sellerId }).populate('channel');
    integrations = integrations.filter(int => int.channel.type === 'marketplace');
    let address = await Address.findOne({ id: seller.mainAddress }).populate('city').populate('country');
    let dateStart = new Date(moment(inputs.month, 'MMMM YYYY').subtract(1, 'months').startOf('month').format('YYYY/MM/DD')).valueOf();
    let dateEnd = new Date(moment(inputs.month, 'MMMM YYYY').subtract(1, 'months').endOf('month').add(1, 'days').format('YYYY/MM/DD')).valueOf();
    let dateEndSearch = new Date(moment(inputs.month, 'MMMM YYYY').endOf('month').add(1, 'days').format('YYYY/MM/DD')).valueOf();
    let dateStartCommission = new Date(moment(inputs.month, 'MMMM YYYY').subtract(2, 'months').startOf('month').format('YYYY/MM/DD')).valueOf();
    let dateEndCommission = new Date(moment(inputs.month, 'MMMM YYYY').subtract(2, 'months').endOf('month').add(1, 'days').format('YYYY/MM/DD')).valueOf();
    let totalPrice = 0;
    let totalRetFte = 0;
    let totalRetIca = 0;
    let totalSkuInactive = 0;
    let totalSkuActive = 0;
    let fleteTotal = 0;
    let salesPerChannel = [];
    let totalCommission = 0;
    let rteTc = 0;
    let devTotalCommission = 0;
    let devRteIca = 0;
    let rteTcComission = 0;
    let commissionFeeOrdersFailed = 0;
    let totalCommissionNotIva = 0;
    const retIca = seller.retIca && seller.retIca > 0 ? seller.retIca : 9.66;
    const retFte = seller.retFte && seller.retFte > 0 ? seller.retFte/100 : 0.04;
    const ordersCancel = {total: 0, price:0};
    const ordersReturn = {total: 0, price:0};
    const ordersFailed = {total: 0, price:0};
    const ordersReturnComission = {total: 0, price:0};
    const ordersFailedComission = {total: 0, price:0};
    let ordersCommission = [];
    let ordersDelivered = [];
    let orders = [];
    for (const integration of integrations) {
      const sales = await sails.helpers.salesPerChannel(seller.id, integration, dateStart, dateEnd, dateEndSearch, dateStartCommission, dateEndCommission);
      if (sales.totalPrice > 0) {
        salesPerChannel.push({channel: integration.channel.name, sales});
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

    for (const sale of salesPerChannel) {
      totalRetIca += sale.sales.totalRetIca;
      totalRetFte += sale.sales.totalCommission*retFte;
      fleteTotal += sale.sales.fleteTotal;
      totalPrice += sale.sales.totalPrice;
      totalCommission += sale.sales.totalCommissionIva;
      totalCommissionNotIva += sale.sales.totalCommission;
      ordersCancel.total += sale.sales.ordersCancel.total;
      ordersCancel.price += sale.sales.ordersCancel.price;
      ordersReturn.total += sale.sales.ordersReturn.total;
      ordersReturn.price += sale.sales.ordersReturn.price;
      ordersFailed.total += sale.sales.ordersFailed.total;
      ordersFailed.price += sale.sales.ordersFailed.price;
      ordersReturnComission.total += sale.sales.ordersReturnComission.total;
      ordersReturnComission.price += sale.sales.ordersReturnComission.price;
      ordersFailedComission.total += sale.sales.ordersFailedComission.total;
      ordersFailedComission.price += sale.sales.ordersFailedComission.price;
      rteTc += sale.sales.rteTc;
      rteTcComission += sale.sales.rteTcComission;
      devTotalCommission += sale.sales.devTotalCommission;
      devRteIca += sale.sales.devRetIca;
      commissionFeeOrdersFailed += sale.sales.totalDiscountOrders;
      ordersCommission = [...ordersCommission, ...sale.sales.ordersCommission];
      ordersDelivered = [...ordersDelivered, ...sale.sales.resultOrdersDelivered];
      orders = [...orders, ...sale.sales.orders];
    }
    let totalOtherConcepts = totalSku + fleteTotal;
    let resultRetFte = totalSku !== 0 && totalCommission === 0 ? totalRetFte + ((totalOtherConcepts/1.19)*retFte) : totalSku !== 0 ? totalRetFte + (totalOtherConcepts/1.19)*retFte : totalRetFte;
    totalRetIca = totalSku !== 0  && (seller.retIca && seller.retIca > 0) ? totalRetIca + ((totalOtherConcepts/1.19)*(retIca/1000)) : totalRetIca;
    let totalBalance = (totalCommission + totalOtherConcepts) - (rteTcComission + commissionFeeOrdersFailed + resultRetFte + totalRetIca + devRteIca + rteTc);
    return exits.success({
      rteTc,
      rteTcComission,
      seller,
      address,
      totalCommission,
      devTotalCommission,
      devRteIca,
      totalCommissionNotIva,
      totalPrice,
      totalSku,
      totalRetFte: resultRetFte,
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
      ordersCommission,
      ordersDelivered,
      salesPerChannel,
      commissionFeeOrdersFailed,
      orders
    });
  }
};
