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
    }
  },
  exits: {
    success: {
      description: 'All done.',
    },
  },
  fn: async function (inputs,exits) {
    let soap = require('strong-soap').soap;
    let url = 'http://sandbox.coordinadora.com/ags/1.5/server.php?wsdl'; //Pruebas
    //let url = 'https://ws.coordinadora.com/ags/1.5/server.php?wsdl'; //Producción

    soap.createClient(url, {}, (err, client) =>{
      let method = client[inputs.method];
      if(err){throw err.message;}
      method(inputs.requestArgs, async (err, result)=>{
        if(err){throw err.message;}
        //{fleteFijo:result.Cotizador_cotizarResult.flete_fijo,fleteVariable:result.Cotizador_cotizarResult.flete_variable,fleteTotal:result.Cotizador_cotizarResult.flete_total}
        return exits.success(result);
      });
    });
  }


};

