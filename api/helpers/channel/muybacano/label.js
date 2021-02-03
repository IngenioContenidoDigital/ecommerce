module.exports = {
    friendlyName: 'Label',
    description: 'Obtener Rótulo de Despacho',
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
      let url = 'http://sandbox.coordinadora.com/agw/ws/guias/1.6/server.php?wsdl';
      // let url = 'http://guias.coordinadora.com/ws/guias/1.6/server.php?wsdl';
      let tracking=inputs.tracking;
      /******** Tabla Rotulos ********
      *
      * 44 - Generico 6 x 15
      * 55 - Genérico 10 x 10
      * 57 - Generico Tercio de Página
      * 58 - Generico Media Página
      * 59 - Denérico Cuarto de Página
      *
      ******************************/
      let requestArgs={
        'p':{
          'id_rotulo': '55',
          'codigos_remisiones':{tracking},
          'usuario':'nimbus.ws',
          'clave':'36cf8fbee84acf299eb2a5552985930cefa715846d5e3f7ac646d8e159a7b58a',
        }
      };
      let options = {};
      soap.createClient(url, options, (err, client) =>{
        let method = client['Guias_imprimirRotulos'];
        if(err){return exits.success(err);}
        method(requestArgs, async (err, result)=>{
          if(err){return exits.error(err);}
          if(result){
            return exits.success(result.return.rotulos.$value);
          }
        });
      });
    }
  };
  
  