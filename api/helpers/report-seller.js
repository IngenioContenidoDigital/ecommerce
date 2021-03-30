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
    let totalPrice = 0;
    let totalCommissionFee = 0;
    let totalCommissionVat = 0;
    let totalRetFte = 0;
    let totalRetIca = 0;
    let totalSkuInactive = 0;
    let totalSkuActive = 0;
    let orders = await Order.find({
      where: {
        seller: inputs.sellerId,
        updatedAt: { '>': dateStart, '<': dateEnd }
      }
    }).populate('currentstatus');

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
    for (const order of orders) {
      if (order.currentstatus.name === 'entregado'){
        let items = await OrderItem.find({order: order.id});
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
    totalRetFte = totalSku !== 0 ? totalRetFte + (totalSku >= 142000 ? (totalSku/1.19)*0.04 : 0) : totalRetFte;
    let totalBalance = (totalCommissionFee + totalCommissionVat + totalSku) - (totalRetFte + totalRetIca);
    return exits.success({
      seller,
      address,
      totalPrice,
      totalCommission: totalCommissionFee + totalCommissionVat,
      totalSku,
      totalRetFte,
      totalRetIca,
      totalBalance,
      totalSkuInactive,
      totalSkuActive,
      ordersCancel,
      ordersReturn,
      ordersFailed
    });
  }
};
