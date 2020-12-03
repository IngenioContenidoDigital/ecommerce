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
    let startDate = new Date(moment(inputs.month, 'MMMM YYYY').subtract(1, 'months').startOf('month').format('YYYY/MM/DD')).valueOf();
    let endDate = new Date(moment(inputs.month, 'MMMM YYYY').subtract(1, 'months').endOf('month').add(1, 'days').format('YYYY/MM/DD')).valueOf();
    let state =  await OrderState.findOne({name: 'entregado'});
    let totalPrice = 0;
    let totalCommissionFee = 0;
    let totalCommissionVat = 0;
    let totalRetFte = 0;
    let totalRetIca = 0;
    let orders = await Order.find({
      where: {
        seller: inputs.sellerId,
        currentstatus: state.id,
        updatedAt: { '>': startDate, '<': endDate }
      }
    });
    let totalProducts = await Product.count({
      where: {
        seller: inputs.sellerId,
        createdAt: { '<': endDate }
      }
    });
    let skuPrice = seller.skuPrice || 0;
    let salesCommission = seller.salesCommission || 0;
    let totalSku = (Math.ceil(totalProducts /100)) * skuPrice * 1.19;
    for (const order of orders) {
      let items = await OrderItem.find({order: order.id});
      items.forEach(async item => {
        let commissionFee = item.price * (salesCommission/100);
        totalCommissionFee += commissionFee;
        totalCommissionVat += (commissionFee * 0.19);
        totalRetFte += (commissionFee * 0.04);
        if (address.city.name === 'bogota') {
          totalRetIca += (commissionFee * (9.66/1000));
        }
        totalPrice += item.price;
        ordersItem.push(item);
      });
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
      totalBalance
    });
  }
};
