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
    let mercadolibre = new meli.CategoriesApi();
    mercadolibre.sitesSiteIdDomainDiscoverySearchGet('MLM', encodeURIComponent(inputs.categories), 10, (error, data, response) => {
      if(error || response.body.length<1){ return exits.noCategory(); }
      return exits.success(response.body);
    });
  }
};

