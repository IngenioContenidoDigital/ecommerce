module.exports = {
  friendlyName: 'Customer',
  description: 'Customer payment.',
  inputs: {
    customerInfo:{
      type: 'ref',
      required:true
    }
  },
  exits: {
    success: {
      description: 'All done.',
    },
  },
  fn: async function (inputs,exits) {

    const epayco = await sails.helpers.payment.init();
    epayco.customers.create(inputs.customerInfo)
          .then(customer => { return exits.success(customer);})
          .catch(err => { return exits.error(err);});
  }
};

