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
    const meli = require('mercadolibre');
    let mercadolibre = new meli.Meli(inputs.integration.user, inputs.integration.key, inputs.integration.secret,inputs.integration.url);
    mercadolibre.get('users/me',{access_token:inputs.integration.secret}, (err, result) =>{
        if(err){console.log(err);return exits.error(err);}
        if(result['user_type']==='brand'){
          mercadolibre.get('users/'+result.id+'/brands',{access_token:inputs.integration.secret}, (err, result) =>{
            if(err){console.log(err);return exits.error(err);}
            return exits.success(result.brands[0].official_store_id);
          });
        }else{
          return exits.success(0);
        }
      });
  }


};

