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
    },
  },
  exits: {
    success: {
      description: 'All done.',
    },
  },
  fn: async function (inputs,exits) {
    const axios = require('axios');
    const apiUrl = 'https://api.mercadopago.com';
    const token = 'TEST-484307057093084-092917-cc8fd4560a25aceb590255eec4ea3f6e-824344788';
    let params = {};
    let config = {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
    if(inputs.params){params=inputs.params;}
    let response = null;
    try{
      switch(inputs.method){
        case 'POST':
          response = await axios.post(apiUrl+inputs.resource, params, config);
          break;
        case 'PUT':
          response = await axios.put(apiUrl+inputs.resource, params, config);
          break;
        case 'DELETE':
          response = await axios.delete(apiUrl+inputs.resource, config);
          break;
        default:
          response = await axios.get(apiUrl+inputs.resource, config);
          break;
      }
      if(response){
        return exits.success(response.data);
      }else{
        throw new Error('Error en la Petición');
      }
    }catch(err){
      let cause = '';
      if (err.response && err.response.data.cause && err.response.data.cause.length > 0) {
        for (const caus of err.response.data.cause) {
          cause = cause + ' | ' + caus.description;
        }
      }
      let message = cause || err.response.data.message;
      throw new Error( message ? message : err.message ? err.message : 'Ocurrio un error desconocido');
    }
  }
};
