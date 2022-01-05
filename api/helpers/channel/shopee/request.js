module.exports = {
  friendlyName: 'Request',
  description: 'Request shopee.',
  inputs: {
    resource:{
      type:'string',
      required:true
    },
    url: {
      type:'string',
      required:true
    },
    paramsUrl:{
      type:'ref',
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
    let sign = await sails.helpers.channel.shopee.sign(inputs.resource,inputs.paramsUrl);
    inputs.resource = inputs.resource.replace(/^\//, '');
    let params = {};
    let config = {
    };
    if(inputs.params){params=inputs.params;}
    let response = null;
    try{
      switch(inputs.method){
        case 'POST':
          response = await axios.post(`${apiUrl}${inputs.resource}?${sign}`,params,config);
          break;
        case 'PUT':
          response = await axios.put(apiUrl+inputs.resource,params,config);
          break;
        case 'DELETE':
          response = await axios.delete(apiUrl+inputs.resource,config);
          break;
        default:
          response = await axios.get(`${apiUrl}${inputs.resource}?${sign}`,config);
          break;
      }
      console.log(response);
      if(response){
        return exits.success(response.data);
      }else{
        throw new Error('Error en la Petición');
      }
    }catch(err){
      console.log(err.response);
      let cause = '';
      if (err.response && err.response.data) {
        cause = err.response.data.message;
      }
      throw new Error(err.response && err.response.data ? cause : err.message);
    }
  }
};
