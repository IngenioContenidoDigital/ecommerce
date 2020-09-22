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
  },
  fn: async function (inputs,exits) {
    inputs.ml.get('sites/MCO/domain_discovery/search?limit=1&q='+encodeURIComponent(inputs.categories), (error,response) =>{
      if(error){return exits.error(error);}
      if (response.length > 0) {
        return exits.success(response[0].category_id);
      } else {
        return exits.error('Categoria no Localizada');
      }
    });
  }
};

