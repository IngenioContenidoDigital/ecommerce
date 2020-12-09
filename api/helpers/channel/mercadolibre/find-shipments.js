module.exports = {
  friendlyName: 'Find shipments',
  description: '',
  inputs: {
    token:{
      type:'string',
      required:true
    },
    id:{
      type:'string',
      requiered:true
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
    mercadolibre.resourceGet('shipments/'+inputs.id,{'x-format-new':true,access_token:inputs.token},async (err, result) => {
      if(err){throw new Error(err.message);}
      return exits.success(result);
    })
  }
};

