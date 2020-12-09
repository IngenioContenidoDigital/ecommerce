module.exports = {
  friendlyName: 'Init',
  description: 'Init mercadolibre.',
  inputs: {
    seller:{
      type:'string',
      required:true,
    },
  },
  exits: {
    success: {
      description: 'All done.',
    },
  },
  fn: async function (inputs,exits) {
    const meli = require('mercadolibre-nodejs-sdk');
    let integration = await Integrations.findOne({channel:'mercadolibre',seller:inputs.seller});
    let mercadolibre = new meli.OAuth20Api();

    let opts = {
      'grantType': "refresh_token", // "authorization_code" | 
      'clientId': integration.user, // String | 
      'clientSecret': integration.key, // String | 
      //'redirectUri': "redirectUri_example", // String | 
      'code': integration.secret, // String | 
      'refreshToken': integration.url // String | 
    };
    mercadolibre.getToken(opts, async (error, data, response) => {
      if(error){ return exits.error(error);}
      let updated = await Integrations.updateOne({id:integration.id}).set({
        url:response['refresh_token'],
        secret:response['access_token'],
      });
      return exits.success(updated);
    });


  }


};

