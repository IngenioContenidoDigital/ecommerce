module.exports = {
  friendlyName: 'Dashboard top10',
  description: 'Estadistica del dashboard pestaña top10',
  inputs: {
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
    let orders = [];
    let topProducts = [];
    let products = [];
    let topProductsCant = [];
    let topProductsPrice = [];

    orders = await Order.find({
      where: {
        seller: inputs.seller,
        createdAt: { '>': inputs.dateStart, '<': inputs.dateEnd }
      },
      select: ['totalOrder', 'channel', 'totalOrder']
    }).populate('addressDelivery').populate('currentstatus');

    for(let order of orders){
      if (order.currentstatus.name !== 'cancelado' && order.currentstatus.name !== 'fallido' && order.currentstatus.name !== 'rechazado') {
        var items = await OrderItem.find({order: order.id}).populate('product');
        items.forEach(async item => {
          item.product = await Product.findOne({
            where: {id: item.product.id},
            select: ['name', 'reference']
          }).populate('images');
          item.quantity = 1;
          products.push(item);
        });
      }
    }

    products.forEach((item) => {
      var tempKey = item.product.id;
      if (!topProducts.hasOwnProperty(tempKey)) {
        topProducts[tempKey] = item;
      } else {
        topProducts[tempKey].quantity += 1;
      }
    });
    topProducts = Object.keys(topProducts).map((key) => {
      return topProducts[key];
    });

    if (inputs.profile !== 'superadmin' && inputs.profile !== 'admin') {
      topProductsCant = topProducts.sort((a, b)=> b.quantity - a.quantity).slice(0, 10);
      topProductsPrice = topProductsCant.sort((a, b)=> {
        const priceA = a.price * a.quantity;
        const priceB = b.price * b.quantity;
        return (priceA > priceB) ? -1 : 1;
      }).slice(0, 10);
    }
    return exits.success({
      topProductsCant,
      topProductsPrice,
      lessProducts: [...topProducts].sort((a, b)=> a.quantity - b.quantity).slice(0, 10)
    });
  }
};
