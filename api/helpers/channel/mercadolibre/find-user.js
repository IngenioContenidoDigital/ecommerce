module.exports = {
  friendlyName: 'Find user',
  description: 'Find Mercadolibre Logged In Usr',
  inputs: {
    token:{
      type:'string',
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
    mercadolibre.resourceGet('users/me', {access_token:inputs.token}, (error, data, response) => {
      if(error){ throw new Error(err.message); }
      return exits.success(response);
    });

  }
};

