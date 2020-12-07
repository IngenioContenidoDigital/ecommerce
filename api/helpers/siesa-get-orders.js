const { exists } = require('grunt');
const moment = require('moment');
let soap = require('strong-soap').soap;

module.exports = {
    friendlyName: 'Get siesa orders',
    description: 'Helper usado para obtener ordenes en Siesa',
    inputs: {
      data:{
        type:'ref',
        required:true,
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
        let url = 'http://wscnadarpruebas.siesacloud.com:8043/wsunoee/WSUNOEE.asmx?wsdl';

        let requestArgs={
            'pvstrxmlParametros':
                `<![CDATA[
                    <Consulta>
                        <NombreConexion>UnoEE_Cnadar_Pruebas</NombreConexion>
                        <IdCia>1</IdCia>
                        <IdProveedor>WS</IdProveedor>
                        <IdConsulta>Pedidos</IdConsulta>
                        <Usuario>gtintegration</Usuario>
                        <Clave>gtint2019</Clave>
                        <Parametros>
                            <fechaini>${inputs.data.ini}</fechaini>
                            <fechafin>${inputs.data.end}</fechafin>
                            <idCargue>${inputs.data.oneCommerceStatus || -1}</idCargue>
                            <estado>${inputs.data.status || -1}</estado>
                            <numeroOC>-1</numeroOC>
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
                      let mapper = (order)=>{
                          return {
                              cia : order.cia,
                              co : order.co,
                              estado : order.estado,
                              fecha : order.fecha,
                              numDoc : order.numDoc,
                              oc_referencia : order.oc_referencia,
                              tipoDoc : order.tipoDoc
                          }
                      }
                      
                      return exits.success(result.EjecutarConsultaXMLResult.diffgram ? result.EjecutarConsultaXMLResult.diffgram.NewDataSet.Resultado.map(mapper) : []);
                  }
      
                });
              });
        } catch (e) {
            exits.error(e);
        } 
    }
  };
  
  