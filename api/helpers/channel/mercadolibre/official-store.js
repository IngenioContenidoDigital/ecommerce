module.exports = {
  friendlyName: 'Get Official Store Id from User',
  description: '',
  inputs: {
    integration:{
      type:'ref',
      required:true
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
    let result = await sails.helpers.channel.mercadolibre.findUser(inputs.integration.secret);
    if(result['user_type']==='brand'){
      mercadolibre.resourceGet('users/'+result.id+'/brands',{access_token:inputs.integration.secret}, (err, result) =>{
        if(err){console.log(err);return exits.error(err);}
        return exits.success(result.brands[0].official_store_id);
      });
    }else{
      return exits.success(0);
    }
  }


};

