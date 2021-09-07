module.exports = {
  friendlyName: 'Plan',
  description: 'Plan payment.',
  inputs: {
    planInfo:{
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
    epayco.plans.create(inputs.planInfo)
          .then(plan => { return exits.success(plan);})
          .catch(err => { return exits.error(err);});
  }
};
