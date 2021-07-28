module.exports = {
  friendlyName: 'Dashboard orders',
  description: 'Estadistica del dashboard pestaña ventas',
  inputs: {
    profile: {
      type:'string',
      required: true,
    },
    seller: {
      type:'string',
    },
    dateStart: {
      type: 'number',
      required: true,
    },
    dateEnd: {
      type:'number',
      required: true,
    },
  },
  exits: {
    success: {
      description: 'All done.',
    },
  },
  fn: async function (inputs, exits) {
    let totalOrders = 0;
    let totalProducts = 0;
    let totalSales = 0;
    let orders = [];
    let cities = [];
    let citiesCant = [];
    let channels = [];

    if(inputs.profile !== 'superadmin' && inputs.profile !== 'admin'){
      orders = await Order.find({
        where: {
          seller: inputs.seller,
          createdAt: { '>': inputs.dateStart, '<': inputs.dateEnd }
        },
        select: ['totalOrder', 'channel', 'totalOrder', 'conversionRate']
      }).populate('addressDelivery').populate('currentstatus');
    } else {
      orders  =  await Order.find({
        where: {
          createdAt: { '>': inputs.dateStart, '<': inputs.dateEnd }
        },
        select: ['totalOrder', 'channel', 'totalOrder', 'conversionRate']
      }).populate('addressDelivery').populate('currentstatus');
    }

    for(let order of orders){
      if (order.addressDelivery && order.currentstatus.name !== 'cancelado' && order.currentstatus.name !== 'fallido' && order.currentstatus.name !== 'rechazado') {
        const totalOrder = inputs.profile !== 'superadmin' && inputs.profile !== 'admin' ? order.totalOrder : order.totalOrder*order.conversionRate;
        totalOrders += 1;
        totalSales += totalOrder;
        totalProducts += await OrderItem.count({order: order.id});
        var tempKey = order.channel;
        if (!channels.hasOwnProperty(tempKey)) {
          channels[tempKey] = {name: order.channel, quantity: 1};
        } else {
          channels[tempKey].quantity += 1;
        }
        var address = await City.find({
          where: {id: order.addressDelivery.city},
          select: ['name']
        });
        address.forEach(async city => {
          city.quantity = 1;
          cities.push(city);
        });
      }
    }

    channels = Object.keys(channels).map((key) => {
      return channels[key];
    });
    cities.forEach((item) => {
      var tempKey = item.id;
      if (!citiesCant.hasOwnProperty(tempKey)) {
        citiesCant[tempKey] = item;
      } else {
        citiesCant[tempKey].quantity += 1;
      }
    });
    citiesCant = Object.keys(citiesCant).map((key) => {
      return citiesCant[key];
    });
    
    return exits.success({
      totalOrders,
      totalProducts,
      totalSales,
      cities: citiesCant.sort((a, b)=> b.quantity - a.quantity).slice(0, 10),
      channels
    });
  }
};
