module.exports = {
  friendlyName: 'Find order',
  description: '',
  inputs: {
    resource:{
      type:'string',
      required:true,
    },
    token:{
      type:'string',
      required:true,
    }
  },
  exits: {
    success: {
      description: 'All done.',
    },
  },
  fn: async function (inputs,exits) {    
    try{
      let response = await sails.helpers.channel.mercadolibre.request(inputs.resource, inputs.token);      
      if(response){return exits.success(response);}
    }catch(err){
      return exits.error(err.message);
    } 
  }
};

