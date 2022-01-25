module.exports = {
  friendlyName: 'Soap',
  description: 'Soap coordinadora.',
  inputs: {
    requestArgs:{
      type:'ref',
      required:true
    },
    method:{
      type:'string',
      required:true
    },
    mode:{
      type:'string',
      required:true
    },
    target:{
      type:'string',
      required:true,
    }
  },
  exits: {
    success: {
      description: 'All done.',
    },
    error:{
      description: 'Error en el Proceso',
    }
  },
  fn: async function (inputs,exits) {
    let soap = require('strong-soap').soap;
    let routes = {
      test:{
        tracking : 'http://sandbox.coordinadora.com/ags/1.5/server.php?wsdl',
        guides: 'http://sandbox.coordinadora.com/agw/ws/guias/1.6/server.php?wsdl'
      },
      prod:{
        tracking : 'https://ws.coordinadora.com/ags/1.5/server.php?wsdl',
        guides: 'http://guias.coordinadora.com/ws/guias/1.6/server.php?wsdl'
      }
    }

    await soap.createClient(routes[inputs.mode][inputs.target], {}, (err, client) =>{
      let method = client[inputs.method];
      if(err){return exits.success({error: err.message});}
      method(inputs.requestArgs, async (err, result)=>{
        if(err){return exits.success({error: err.message});}
        return exits.success(result);
      });
    });
  }
};
