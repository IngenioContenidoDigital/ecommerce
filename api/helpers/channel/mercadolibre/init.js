module.exports = {
  friendlyName: 'Init',
  description: 'Init mercadolibre.',
  inputs: {
    integration:{
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
    const meli = require('mercadolibre');
    let mercadolibre = new meli.Meli(inputs.integration.user, inputs.integration.key, inputs.integration.secret,inputs.integration.url);
    mercadolibre.refreshAccessToken(async (error,callback)=>{
      if(error){ return exits.error(error);}
      await Integrations.updateOne({id:inputs.integration.id}).set({
        url:callback['refresh_token'],
        secret:callback['access_token'],
      });
      return exits.success(mercadolibre);
    });
  }


};

