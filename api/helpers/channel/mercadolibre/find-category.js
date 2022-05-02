module.exports = {
  friendlyName: 'Find category',
  description: 'Find corresponding Mercadolibre Category',
  inputs: {
    categories:{
      type:'string',
      required:true
    },
    token:{
      type:'string',
      required:true
    },
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
    try{
      let response = await sails.helpers.channel.mercadolibre.request(`sites/MCO/domain_discovery/search?limit=8&q=${encodeURIComponent(inputs.categories)}`, 'https://api.mercadolibre.com/', inputs.token);
      if(response && response.length > 0){
        return exits.success(response);
      } else {
        return exits.noCategory();
      }
    }catch(err){
      return exits.noCategory();
    }
  }
};

