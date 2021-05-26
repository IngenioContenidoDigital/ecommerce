module.exports = {
  friendlyName: 'Dashboard publish',
  description: 'Estadistica del dashboard pestaña publicaciones',
  inputs: {
    seller: {
      type:'string',
    },
    sid: {
      type:'string'
    }
  },
  exits: {
    success: {
      description: 'All done.',
    },
  },
  fn: async function (inputs, exits) {
    let moment = require('moment');
    const totalProducts = await Product.count({seller: inputs.seller});
    let channels = await Integrations.find({seller: inputs.seller}).populate('channel');
    let productsSeller = await Product.find({
      where: {
        seller: inputs.seller
      },
      select: ['name', 'reference', 'active']
    }).populate('channels', {
      where:{
        iscreated: true
      },
      limit: 1
    }).populate('discount',{
      where:{
        to:{'>=':moment().valueOf()},
        from:{'<=':moment().valueOf()}
      },
      sort: 'createdAt DESC',
      limit: 1
    });
    const productsChannels = productsSeller.filter(product => product.channels.length > 0);
    const productsDiscount = productsSeller.filter(product => product.discount.length > 0);
    channels = channels.filter(inte => inte.channel.type === 'marketplace');
    let productsPublish = Math.ceil((productsChannels.length * 100) / totalProducts);
    sails.sockets.broadcast(inputs.sid, 'datadashboardpublish', {
      productsPublish,
      productsDiscount: productsDiscount.length,
      channels: channels.length,
    });
    return exits.success();
  }
};
