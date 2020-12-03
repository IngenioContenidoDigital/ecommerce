const { log } = require("grunt");

module.exports = {
  friendlyName: 'Find category',
  description: 'Find corresponding Mercadolibre Category',
  inputs: {
    ml:{
      type:'ref',
      required:true,
    },
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
    inputs.ml.get('sites/MCO/domain_discovery/search?limit=1&q='+encodeURIComponent(inputs.categories), (error,response) =>{
      if(error || response.length<1){ return exits.noCategory(); }
      return exits.success(response[0].category_id);
    });
  }
};

