module.exports = {
  friendlyName: 'validate plan',
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
    let validateChannel = true;
    let subscription = await Subscription.find({seller: inputs.seller, state: 'active'}).sort('createdAt DESC').populate('plan').limit(1);
    if (subscription.length > 0) {
      let countIntegration = await Integrations.count({seller: inputs.seller});
      if (countIntegration >= subscription[0].plan.channels) {
        validateChannel = false;
      }
    } else {
      validateChannel = false;
    }
    return exits.success(validateChannel);
  }
};
