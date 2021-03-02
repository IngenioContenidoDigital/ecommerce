module.exports = {
  friendlyName: 'Request',
  description: 'Request mercadolibre.',
  inputs: {
    resource:{
      type:'string',
      required:true
    },
    url: {
      type:'string',
      required:true
    },
    secret:{
      type:'string'
    },
    params:{
      type:'ref',
    },
    method:{
      type:'string',
      isIn:['GET','POST','PUT','DELETE'],
      defaultsTo:'GET'
    },
  },
  exits: {
    success: {
      description: 'All done.',
    },
  },
  fn: async function (inputs,exits) {
    const axios = require('axios');
    const apiUrl = inputs.url;
    inputs.resource = inputs.resource.replace(/^\//, '');
    let params = {};
    let config = {
      headers: {
        Authorization: `Bearer ${inputs.secret}`
      }
    };
    if(inputs.secret === 'auth'){delete config.headers}
    if(inputs.params && inputs.params.responseType){config.responseType = inputs.params.responseType; delete inputs.params.responseType}
    if(inputs.params){params=inputs.params;}
    let response = null;
    try{
      switch(inputs.method){
        case 'POST':
          response = await axios.post(apiUrl+inputs.resource,params,config);
          break;
        case 'PUT':
          response = await axios.put(apiUrl+inputs.resource,params,config);
          break;
        case 'DELETE':
          response = await axios.delete(apiUrl+inputs.resource,config);
          break;
        default:
          response = await axios.get(apiUrl+inputs.resource,config);
          break;
      }
      if(response){
        return exits.success(response.data);
      }else{
        throw new Error('Error en la Petición');
      }
    }catch(err){
      throw new Error(err.response.data ? err.response.data.message : err.message);
    }
  }
};

