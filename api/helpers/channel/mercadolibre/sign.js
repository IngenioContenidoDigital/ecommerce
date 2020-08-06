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
    const meli = require('mercadolibre');
    let integration = await Integrations.findOne({channel:'mercadolibre',seller:inputs.seller});
    let mercadolibre = new meli.Meli(integration.user, integration.key, integration.secret,integration.url);
    mercadolibre.refreshAccessToken(async (error,callback)=>{
      if(error){ return exits.error(error);}
      await Integrations.updateOne({id:integration.id}).set({
        url:callback['refresh_token'],
        secret:callback['access_token'],
      });
      return exits.success(mercadolibre);
    });
  }


};

