module.exports = {
  friendlyName: 'Tokenize',
  description: 'Tokenize something.',
  inputs: {
    creditInfo:{
      type: 'ref',
      required:true
    },
    method:{
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
    const epayco = await sails.helpers.payment.init(inputs.method);

    epayco.token.create(inputs.creditInfo)
        .then(token => { return exits.success(token);})
        .catch(err =>{ return exits.error(err);});
  }
};

