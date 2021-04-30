module.exports = {
  friendlyName: 'Init',
  description: 'Init mercadolibre.',
  inputs: {
    integration:{
      type:'string',
      required:true,
    },
  },
  exits: {
    success: {
      description: 'All done.',
    },
    error:{
      description: 'Error'
    },
  },
  fn: async function (inputs,exits) {
    const meli = require('mercadolibre-nodejs-sdk');
    let integration = await Integrations.findOne({id: inputs.integration});
    let mercadolibre = new meli.OAuth20Api();
    if (integration) {
      let opts = {
        'grantType': "refresh_token", // "authorization_code" | 
        'clientId': integration.user, // String | 
        'clientSecret': integration.key, // String | 
        //'redirectUri': "redirectUri_example", // String | 
        'code': integration.secret, // String | 
        'refreshToken': integration.url // String | 
      };
      mercadolibre.getToken(opts, async (error, data, response) => {
        if(error){ console.log(error); return exits.error(error);}
        let updated = await Integrations.updateOne({id:integration.id}).set({
          url:response.body['refresh_token'],
          secret:response.body['access_token'],
        });
        updated = await Integrations.findOne({id: updated.id}).populate('channel');
        return exits.success(updated);
      });
    } else {
      return exits.error('No existe integracion');
    }
  }


};

