module.exports = {
  friendlyName: 'Imprimir Guia',
  description: 'Guia carrier.',
  inputs: {
    tracking:{
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
    //let url = 'http://sandbox.coordinadora.com/agw/ws/guias/1.6/server.php?wsdl';
    let url = 'http://guias.coordinadora.com/ws/guias/1.6/server.php?wsdl';
    let requestArgs={
      'p':{
        'codigo_remision': inputs.tracking,
        'margen_izquierdo':0,
        'margen_superior':0,
        'formato_impresion':null,
        'usuario':'contenidodigital.ws',
        'clave':'e8c5ad7349c80f352b916a5213f95d692813e370300240f947bc28b781e0dd7e',
      }
    };
    let options = {};
    soap.createClient(url, options, (err, client) =>{
      let method = client['Guias_reimprimirGuia'];
      if(err){return exits.error(err);}
      method(requestArgs, async (err, result)=>{
        if(err){return exits.error(err);}
        if(result){
          return exits.success(result.return.pdf.$value);
        }
      });
    });

  }
};

