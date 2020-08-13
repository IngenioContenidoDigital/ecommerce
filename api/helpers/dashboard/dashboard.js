module.exports = {
  friendlyName: 'Dashboard',
  description: 'Helper usado para retonar la estadistica del dashboard',
  inputs: {
    profile: {
      type:'string',
      required: true,
    },
    dateStart: {
      type: 'number',
      required: true,
    },
    dateEnd: {
      type:'number',
      required: true,
    }
  },
  exits: {
    success: {
      description: 'All done.',
    },
  },
  fn: async function (inputs, exits) {
    let totalOrders = 0;
    let totalOrdersCancel = 0;
    let totalOrdersReturned = 0;
    let totalProducts = 0;
    let totalSales = 0;
    let totalInventory = 0;
    let orders = [];
    let products = [];
    let topProducts = [];
    let cities = [];
    let citiesCant = [];
    let channels = [];
    let productsInventory = [];
    let productsUnd = [];

    if(inputs.profile !== 'superadmin'){
      orders  =  await Order.find({
        seller: req.session.user.seller,
        createdAt: { '>': inputs.dateStart, '<': inputs.dateEnd }
      }).populate('addressDelivery').populate('currentstatus');

      let productsSeller = await Product.find({seller: req.session.user.seller}).populate('images');
      for(let product of productsSeller){
        const totalCant = await ProductVariation.sum('quantity').where({product: product.id});
        const inventory = await ProductVariation.find({product: product.id});
        if (totalCant > 0 && totalCant < 5) {
          productsUnd.push(product);
        }
        if (inventory.length === 0) {
          productsInventory.push(product);
        }
        totalInventory += totalCant;
      }
    } else {
      orders  =  await Order.find({
        createdAt: { '>': inputs.dateStart, '<': inputs.dateEnd }
      })
      .populate('addressDelivery')
      .populate('currentstatus');
      totalInventory = await ProductVariation.sum('quantity');
      let productsSeller = await Product.find({}).populate('images');
      for(let product of productsSeller){
        const totalCant = await ProductVariation.sum('quantity').where({product: product.id});
        const inventory = await ProductVariation.find({product: product.id});
        if (totalCant < 5) {
          productsUnd.push(product);
        }
        if (inventory.length === 0) {
          productsInventory.push(product);
        }
        totalInventory += totalCant;
      }
    }

    for(let order of orders){
      if(order.currentstatus.name === 'retornado') {
        totalOrdersReturned += 1;
      }
      if(order.currentstatus.name === 'cancelado') {
        totalOrdersCancel += 1;
      }
      if (order.currentstatus.name !== 'cancelado' && order.currentstatus.name !== 'fallido' && order.currentstatus.name !== 'rechazado') {
        totalOrders += 1;
        var tempKey = order.channel;
        if (!channels.hasOwnProperty(tempKey)) {
          channels[tempKey] = {name: order.channel, quantity: 1};
        } else {
          channels[tempKey].quantity += 1;
        }
        totalSales += order.totalOrder;
        totalProducts += await OrderItem.count({order: order.id});
        var address = await City.find({
          where: {id: order.addressDelivery.city},
          select: ['name']
        });
        address.forEach(async city => {
          city.quantity = 1;
          cities.push(city);
        });
        var items = await OrderItem.find({order: order.id}).populate('product');
        items.forEach(async item => {
          item.product = await Product.findOne({id: item.product.id}).populate('images');
          item.quantity = 1;
          products.push(item);
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

    return exits.success({
      totalOrdersCancel: totalOrdersCancel,
      totalOrdersReturned: totalOrdersReturned,
      totalOrders: totalOrders,
      totalProducts: totalProducts,
      totalSales: totalSales,
      topProductsCant: topProducts.sort((a, b)=> b.quantity - a.quantity).slice(0, 10),
      topProductsPrice: topProducts.sort((a, b)=> b.product.price - a.product.price).slice(0, 10),
      cities: citiesCant.sort((a, b)=> b.quantity - a.quantity).slice(0, 10),
      channels: channels,
      totalInventory: totalInventory,
      lessProducts: topProducts.sort((a, b)=> a.quantity - b.quantity),
      productsInventory: productsInventory,
      productsUnd: productsUnd,
    });
  }
};
