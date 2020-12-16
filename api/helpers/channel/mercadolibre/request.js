module.exports = {
  friendlyName: 'Request',
  description: 'Request mercadolibre.',
  inputs: {
    resource:{
      type:'string',
      required:true
    },
    params:{
      type:'ref',
    },
    method:{
      type:'string',
      isIn:['GET','POST','PUT','DELETE'],
      defaultsTo:'GET'
    }
  },
  exits: {
    success: {
      description: 'All done.',
    },
  },
  fn: async function (inputs,exits) {
    const axios = require("axios");
    const apiUrl = 'https://api.mercadolibre.com/'
    inputs.resource = inputs.resource.replace(/^\//, "");    
    let response = null;
    try{
      switch(inputs.method){
        case 'POST':
          response = await axios.post(apiUrl+inputs.resource,inputs.params);
          break;
        case 'PUT':
          response = await axios.put(apiUrl+inputs.resource,inputs.params);
          break;
        case 'DELETE':
          response = await axios.delete(apiUrl+inputs.resource);
          break;
        default:
          /*let params = null;
          if(inputs.params){
            params.params=inputs.params;
          }*/
          response = await axios.get(apiUrl+inputs.resource,inputs.params);
          break;
      }
      if(response){
        return exits.success(response.data);
      }else{
        throw new Error('Error en la Petición');
      }
    }catch(err){
      throw new Error(err.message);
    }
  }
};

