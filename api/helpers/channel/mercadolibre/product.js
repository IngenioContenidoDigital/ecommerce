module.exports = {
  friendlyName: 'Product',
  description: 'Product mercadolibre.',
  inputs: {
    ml:{
      type:'ref',
      required:true,
    },
    body:{
      type:'ref',
      required:true
    },
    token:{
      type:'string',
      required:true
    },
    action:{
      type:'string'
    },
    mlid:{
      type:'string'
    },
  },
  exits: {
    success: {
      description: 'All done.',
    },
  },
  fn: async function (inputs,exits) {
    if(inputs.action==='Update'){
      inputs.ml.put('items/'+inputs.mlid,inputs.body,{'access_token':inputs.token},(error,result) =>{
        if(error){console.log(error); return exits.error(error);}
        return exits.success(result);
      });
    }else if(inputs.action==='Get'){
      inputs.ml.get('items/'+inputs.mlid,{'access_token':inputs.token},(error,result) =>{
        if(error){console.log(error); return exits.error(error);}
        return exits.success(result);
      });
    }else{
      inputs.ml.post('items',inputs.body,{'access_token':inputs.token},(error,result) =>{
        if(error){console.log(error); return exits.error(error);}
        return exits.success(result);
      });
    }
  }
};

