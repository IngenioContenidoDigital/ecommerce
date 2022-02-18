module.exports = {
  friendlyName: 'validate plan products',
  description: '',
  inputs: {
    seller:{
      type:'string',
      required:true,
    }
  },
  exits: {
    success: {
      description: 'All done.',
    },
  },
  fn: async function (inputs, exits) {
    let validateProduct = true;
    let subscription = await Subscription.find({seller: inputs.seller, state: 'active'}).sort('createdAt DESC').populate('plan').limit(1);
    if (subscription.length > 0) {
      let countProducts = await Product.count({seller: inputs.seller});
      if (subscription[0].plan.channels.toLowerCase() !== 'ilimitado' && countProducts >= parseInt(subscription[0].plan.products)) {
        validateProduct = false;
      }
    } else {
      validateProduct = false;
    }
    return exits.success(validateProduct);
  }
};
