module.exports = {
  friendlyName: 'Find order',
  description: '',
  inputs: {
    resource:{
      type:'string',
      required:true,
    },
    params:{
      type:'ref',
      required:true,
    }
  },
  exits: {
    success: {
      description: 'All done.',
    },
  },
  fn: async function (inputs,exits) {
    const meli = require('mercadolibre-nodejs-sdk');
    
    let mercadolibre = new meli.RestClientApi();
    mercadolibre.resourceGet(inputs.resource, inputs.params, async (err, result) => {
      if(err){throw new Error(err.message);}
      return exits.success(result);
    });
  }
};

