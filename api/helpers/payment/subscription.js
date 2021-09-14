module.exports = {
  friendlyName: 'Subscription',
  description: 'Subscription payment.',
  inputs: {
    subscriptionInfo:{
      type: 'ref',
      required:true
    },
    method:{
      type:'string',
      required:true
    }
  },
  exits: {
    success: {
      description: 'All done.',
    },
  },
  fn: async function (inputs,exits) {
    const epayco = await sails.helpers.payment.init(inputs.method);
    epayco.subscriptions.create(inputs.subscriptionInfo)
          .then(plan => { return exits.success(plan);})
          .catch(err => { return exits.error(err);});
  }
};
