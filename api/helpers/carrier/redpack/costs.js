  const axios  = require('axios');
  const convert = require('xml-js');

module.exports = {
  friendlyName: 'Shipping Costs',
  description: 'Get shipping costs from traking number',
  inputs: {
    tracking:{
      type:'string'
    }
  },
  exits: {
    success: {
      description: 'All done.',
    },
  },

  fn: async function (inputs, exits) {
    let order = await Order.findOne({tracking:inputs.tracking})
    .populate('customer')
    .populate('addressDelivery')
    .populate('carrier');

    let seller = await Seller.findOne({id:order.seller}).populate('mainAddress');
    seller.mainAddress = await Address.findOne({id:seller.mainAddress.id}).populate('city').populate('country').populate("region");
    let oitems = await OrderItem.find({order:order.id}).populate('product');

    if(order.channel==='direct'){
      let url = 'https://ws.redpack.com.mx/RedpackAPI_WS/services/RedpackWS?wsdl';
      let alto = 0;
      let largo = 0;
      let ancho = 0;
      let peso = 0;

      for(let p in oitems){
        if(p < 1 || p ==='0'){
          largo=oitems[0].product.length;
          ancho=oitems[0].product.width;
        }
        alto+=oitems[p].product.height;
        peso+=oitems[p].product.weight;
      }

      let body = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ws="http://ws.redpack.com" xmlns:xsd="http://vo.redpack.com/xsd">
        <soapenv:Header/>
        <soapenv:Body>
            <ws:cotizacionNacional>
              <ws:PIN>QA 0hor16TnlL+3z9ZagvE6PBo8tyWAIReeC6cLtMjXSXI=</ws:PIN>
              <ws:idUsuario>1853</ws:idUsuario>
                <ws:guias>
                <xsd:consignatario>
                    <xsd:codigoPostal>${order.addressDelivery.zipcode}</xsd:codigoPostal>	
                </xsd:consignatario>
                <xsd:remitente>
                  <xsd:codigoPostal>${seller.mainAddress.zipcode}</xsd:codigoPostal>			
                </xsd:remitente>
                <xsd:paquetes>
                  <xsd:alto>${alto}</xsd:alto>
                  <xsd:ancho>${ancho}</xsd:ancho>		
                  <xsd:largo>${largo}</xsd:largo>
                  <xsd:peso>${peso}</xsd:peso>
                </xsd:paquetes>
                <xsd:tipoEntrega>
                  <xsd:id>2</xsd:id>
                </xsd:tipoEntrega>
                <xsd:tipoEnvio>
                  <xsd:id>1</xsd:id>
                  </xsd:tipoEnvio>
                <xsd:tipoServicio>
                  <xsd:id>2</xsd:id>
                </xsd:tipoServicio>
                </ws:guias>
              </ws:cotizacionNacional>
              </soapenv:Body>
      </soapenv:Envelope>`;

      let response = await axios.post(url, body,  { headers: {'Content-Type': 'text/xml', 'Accept': 'application/xml'}});
      let parsed = JSON.parse(convert.xml2json(response.data, {compact: true, spaces: 4}));

      if(response.status == 200 && parsed['soapenv:Envelope']['soapenv:Body']['ns:cotizacionNacionalResponse']["ns:return"]["ax21:resultadoConsumoWS"]["ax21:descripcion"]._text == 'GENERACIÓN CORRECTA'){
        let costo_base  = parsed['soapenv:Envelope']['soapenv:Body']['ns:cotizacionNacionalResponse']["ns:return"]["ax21:cotizaciones"][0]["ax21:detallesCotizacion"][1]["ax21:costoBase"]._text;
        let costo_total  = parsed['soapenv:Envelope']['soapenv:Body']['ns:cotizacionNacionalResponse']["ns:return"]["ax21:cotizaciones"][0]["ax21:detallesCotizacion"][3]["ax21:costoBase"]._text
        await Order.updateOne({id:order.id}).set({fleteFijo:parseInt(costo_base), fleteTotal:parseInt(costo_total)});
      }else{
        throw new Error("Ocurrio un error consultando el costo de envio");
      }
    }
  }
};

