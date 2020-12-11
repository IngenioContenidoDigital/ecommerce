module.exports = {
  friendlyName: 'Get Official Store Id from User',
  description: '',
  inputs: {
    integration:{
      type:'ref',
      required:true
    },
    brand:{
      type:'string',
      requiered:'true',
    }
  },
  exits: {
    success: {
      description: 'All done.',
    },
  },
  fn: async function (inputs,exits) {
    try{
      let response = await sails.helpers.channel.mercadolibre.request('users/'+inputs.integration.useridml+'/brands?access_token='+inputs.integration.secret);
      if(response && response.brands.length>0){
        for(let brand of response.brands){
          if(brand.name.toLowerCase()===inputs.brand.toLowerCase()){
            return exits.success(brand.official_store_id);
          }
        }
        return exits.success(response.brands[0].official_store_id);
      }else{
        return exits.success(0);
      }
    }catch(err){
      throw new Error(err.message);
    }    
  }


};

