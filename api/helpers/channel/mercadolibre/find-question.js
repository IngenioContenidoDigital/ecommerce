module.exports = {
  friendlyName: 'Find question',
  description: 'Find question Mercadolibre',
  inputs: {
    seller: {
      type:'string',
      required:true
    },
    secret: {
      type: 'string',
      required: true
    },
    resource: {
      type: 'string',
      required: true
    },
  },
  exits: {
    success: {
      description: 'All done.',
    },
  },
  fn: async function (inputs, exits) {
    let integration = await sails.helpers.channel.mercadolibre.sign(inputs.seller);
    const meli = require('mercadolibre-nodejs-sdk');
    
    let mercadolibre = new meli.RestClientApi();
    mercadolibre.resourceGet(inputs.resource, integration.secret, (error, response) =>{
      if(error){return exits.error(error);}
      return exits.success(response);
    });
  }
};
