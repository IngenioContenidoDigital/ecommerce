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
    try{
      let response = await sails.helpers.channel.mercadolibre.request('shipments/'+inputs.id+'?x-format-new=true&access_token='+inputs.token);      
      if(response){
        return exits.success(response);
      }
    }catch(err){
      return exits.error(err.message);
    }
  }
};

