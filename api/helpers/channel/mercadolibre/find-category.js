module.exports = {
  friendlyName: 'Find category',
  description: 'Find corresponding Mercadolibre Category',
  inputs: {
    categories:{
      type:'string',
      required:true
    }
  },
  exits: {
    success: {
      description: 'All done.',
    },
    noCategory:{
      description: 'No se pudo localizar la categoria en Mercadolibre'
    }
  },
  fn: async function (inputs,exits) {
    const meli = require('mercadolibre-nodejs-sdk');
    
    let mercadolibre = new meli.RestClientApi();
    mercadolibre.resourceGet('sites/MCO/domain_discovery/search?limit=1&q='+encodeURIComponent(inputs.categories), (error, data, response) => {
      if(error || response.length<1){ return exits.noCategory(); }
      return exits.success(response[0].category_id);
    });
  }
};

