module.exports = {
  friendlyName: 'Get item siesa',
  description: 'Helper usado para obtener un item de siesa',
  inputs: {
    ean:{
      type:'string',
      required:true
    }
  },
  exits: {
    success: {
      description: 'All done.',
    },
    error: {
      description: 'Ocurrio un error al procesar la solicitud.',
    },
  },
  fn: async function (inputs, exits) {
    let soap = require('strong-soap').soap;
    let url = 'http://wscnadar.siesacloud.com:8043/wsunoee/WSUNOEE.asmx?wsdl';
    let requestArgs={
      pvstrxmlParametros:
        `<![CDATA[
          <Consulta>
            <NombreConexion>UnoEE_Cnadar_Real</NombreConexion>
            <IdCia>1</IdCia>
            <IdProveedor>WS</IdProveedor>
            <IdConsulta>Items</IdConsulta>
            <Usuario>gtintegration</Usuario>
            <Clave>gtint2019</Clave>
            <Parametros>
              <idItem>-1</idItem>
              <referencia>-1</referencia>
              <ean>${inputs.ean}</ean>
            </Parametros>
          </Consulta>
        ]]>`
    };
    let options = {};
    try {
      soap.createClient(url, options, (err, client) =>{
        let method = client['EjecutarConsultaXML'];
        if(err){return exits.error(err);}
        method(requestArgs, async (err, result)=>{
          if(err){return exits.error(err);}
          if(result){
            return exits.success(result.EjecutarConsultaXMLResult.diffgram ? result.EjecutarConsultaXMLResult.diffgram.NewDataSet.Resultado['U.Inventario'] : 'UND');
          }
        });
      });
    } catch (e) {
      exits.error(e);
    }
  }
};
