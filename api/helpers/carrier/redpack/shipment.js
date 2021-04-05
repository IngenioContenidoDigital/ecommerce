  
  const axios  = require('axios');
  const convert = require('xml-js');
module.exports = {
  friendlyName: 'Shipment',
  description: 'Shipment carrier.',
  inputs: {
    order:{
      type:'string',
      required:true,
    }
  },
  exits: {
    success: {
      description: 'Creación de Guia Exitosa',
    },
    error:{
      description: 'Error en el Proceso',
    }
  },
  fn: async function (inputs, exits) {

    let order = await Order.findOne({id:inputs.order})
    .populate('customer')
    .populate('addressDelivery')
    .populate('carrier');

    let seller = await Seller.findOne({id:order.seller}).populate('mainAddress');
    seller.mainAddress = await Address.findOne({id:seller.mainAddress.id}).populate('city').populate('country').populate("region");
    
    let country = await Country.findOne({id:order.addressDelivery.country});
    let city = await City.findOne({id:order.addressDelivery.city});

    let oitems = await OrderItem.find({order:order.id}).populate('product');
    let items = oitems.length;
    let integration = await Integrations.findOne({id: order.integration}).populate('channel');
    
    let deliveryAddress = await Address.findOne({id:order.addressDelivery.id}).populate('city').populate('country').populate('region');
    let seq =  order.carrier.sequential;

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
            <ws:documentacion>
              <ws:PIN>QA 0hor16TnlL+3z9ZagvE6PBo8tyWAIReeC6cLtMjXSXI=</ws:PIN>
              <ws:idUsuario>1853</ws:idUsuario>
              <ws:guias>
              <xsd:consignatario>
                  <xsd:contacto>${order.customer.fullName}</xsd:contacto>
                  <xsd:nombre_Compania>${order.customer.fullName}</xsd:nombre_Compania>
                  <xsd:calle>${order.addressDelivery.addressline1} ${order.addressDelivery.addressline2}</xsd:calle>
                  <xsd:ciudad>${city.name}</xsd:ciudad> 
                  <xsd:colonia_Asentamiento>${city.name}</xsd:colonia_Asentamiento>
                  <xsd:codigoPostal>${order.addressDelivery.zipcode}</xsd:codigoPostal>	
                  <xsd:email>${order.customer.emailAddress}</xsd:email>
                  <xsd:estado>${deliveryAddress.region.name}</xsd:estado>
                  <xsd:pais>${deliveryAddress.country.name}</xsd:pais>
                  <xsd:referenciaUbicacion>${''}</xsd:referenciaUbicacion>
                  <xsd:telefonos>
                  <xsd:telefono>${order.customer.mobile}</xsd:telefono>
                  </xsd:telefonos>
              </xsd:consignatario>
              <xsd:remitente>
                  <xsd:contacto>${seller.name.replace(/[&\/\\#,+()$~%.'":*?<>{}]/g,'')}</xsd:contacto>
                  <xsd:nombre_Compania>${seller.name.replace(/[&\/\\#,+()$~%.'":*?<>{}]/g,'')}</xsd:nombre_Compania>
                  <xsd:calle>${order.addressDelivery.addressline1} ${order.addressDelivery.addressline2}</xsd:calle>
                  <xsd:colonia_Asentamiento>${seller.mainAddress.city.name}</xsd:colonia_Asentamiento>
                  <xsd:ciudad>${seller.mainAddress.city.name}</xsd:ciudad>
                  <xsd:codigoPostal>${seller.mainAddress.zipcode}</xsd:codigoPostal>			
                  <xsd:estado>${seller.mainAddress.region.name}</xsd:estado>
                  <xsd:pais>${seller.mainAddress.country.iso}</xsd:pais>
                  <xsd:referenciaUbicacion>${order.addressDelivery.notes}</xsd:referenciaUbicacion>	
                  <xsd:email>${seller.email}</xsd:email>
                  <xsd:telefonos>
                  <xsd:telefono>${seller.phone}</xsd:telefono>
                  </xsd:telefonos>
              </xsd:remitente>
              <xsd:referencia>${order.reference}</xsd:referencia>
              <xsd:flag>0</xsd:flag>
              <xsd:moneda>117546</xsd:moneda>
              <xsd:numeroDeGuia>${seq}</xsd:numeroDeGuia>
        <xsd:paquetes>
          <xsd:alto>${alto}</xsd:alto>
          <xsd:ancho>${ancho}</xsd:ancho>		
          <xsd:largo>${largo}</xsd:largo>
          <xsd:peso>${peso}</xsd:peso>
          <xsd:consecutivo>0</xsd:consecutivo>
          <xsd:descripcion>test</xsd:descripcion>
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
        <xsd:tipoIdentificacion>
          <xsd:descripcion>0</xsd:descripcion>
          <xsd:id>0</xsd:id>
        </xsd:tipoIdentificacion>
        </ws:guias>
            </ws:documentacion>
        </soapenv:Body>
      </soapenv:Envelope>`;
      let response = await axios.post('https://ws.redpack.com.mx/RedpackAPI_WS/services/RedpackWS?wsdl', body,  { headers: {'Content-Type': 'text/xml', 'Accept': 'application/xml'}});
      let parsed = JSON.parse(convert.xml2json(response.data, {compact: true, spaces: 4}));

      if(response.status == 200 && parsed['soapenv:Envelope']['soapenv:Body']['ns:documentacionResponse']['ns:return']['ax21:resultadoConsumoWS']['ax21:descripcion']['_text'] == 'GENERACIÓN CORRECTA'){
        
        let numeroGuia = parsed['soapenv:Envelope']['soapenv:Body']['ns:documentacionResponse']['ns:return']['ax21:numeroDeGuia']['_text'];
        (seq = seq + 1)
        let embed = parsed['soapenv:Envelope']['soapenv:Body']['ns:documentacionResponse']["ns:return"]["ax21:paquetes"]["ax21:formatoEtiqueta"]["_text"];
        await Order.updateOne({id:inputs.order}).set({tracking:numeroGuia});
        
        let carrierData = await CarrierData.create({
          order : order.id,
          data : embed
        }).fetch();

      await Carrier.updateOne({id : order.carrier.id}).set({ sequential : seq });
        await sails.helpers.carrier.redpack.costs(numeroGuia);

      }else if(parsed['soapenv:Envelope']['soapenv:Body']['ns:documentacionResponse']['ns:return']['ax21:resultadoConsumoWS']['ax21:descripcion']['_text'] == 'LA GUÍA YA ESTÁ DOCUMENTADA'){
        console.log("Esta guia ya se encuentra documentada")
      }else{
        throw new Error("Ocurrio un error generando la guias");
      }
    }

    if(order.channel==='dafiti'){
      let litems = [];
      for(let it of oitems){
        if(!litems.includes(it.externalReference)){
          litems.push(it.externalReference);
        }
      }
      let route = await sails.helpers.channel.dafiti.sign(order.integration, 'SetStatusToPackedByMarketplace',seller.id,['OrderItemIds=['+litems.join(',')+']','DeliveryType=dropship','ShippingProvider=Servientrega']);
      let response = await sails.helpers.request(integration.channel.endpoint,'/?'+route,'POST');
      let result = JSON.parse(response);
      if(result.SuccessResponse){
        let itemsign = await sails.helpers.channel.dafiti.sign(order.integration,'GetOrderItems',order.seller,['OrderId='+order.channelref]);
        let citems = await sails.helpers.request(integration.channel.endpoint,'/?'+itemsign,'GET');
        let rs = JSON.parse(citems);
        let items = {OrderItem:[]};
        if(rs.SuccessResponse.Body.OrderItems.OrderItem.length>1){
          items = rs.SuccessResponse.Body.OrderItems;
        }else{
          items['OrderItem'].push(rs.SuccessResponse.Body.OrderItems.OrderItem);
        }
        let tracking = items.OrderItem[0].TrackingCode;
        await Order.updateOne({id:order.id}).set({tracking:tracking});
        let rts = await sails.helpers.channel.dafiti.sign(order.integration,'SetStatusToReadyToShip',order.seller,['OrderItemIds=['+litems.join(',')+']','DeliveryType=dropship','ShippingProvider=Servientrega','TrackingNumber='+tracking]);
        await sails.helpers.request(integration.channel.endpoint,'/?'+rts,'POST');
      }
    }
    if(order.channel==='linio'){
      let litems = [];
      for(let it of oitems){
        if(!litems.includes(it.externalReference)){
          litems.push(it.externalReference);
        }
      }
      let route = await sails.helpers.channel.linio.sign(order.integration, 'SetStatusToPackedByMarketplace',seller.id,['OrderItemIds=['+litems.join(',')+']','DeliveryType=dropship']);
      let response = await sails.helpers.request(integration.channel.endpoint,'/?'+route,'POST');
      let result = JSON.parse(response);
      if(result.SuccessResponse){
        let itemsign = await sails.helpers.channel.linio.sign(order.integration, 'GetOrderItems',order.seller,['OrderId='+order.channelref]);
        let citems = await sails.helpers.request(integration.channel.endpoint,'/?'+itemsign,'GET');
        let rs = JSON.parse(citems);
        let items = {OrderItem:[]};
        if(rs.SuccessResponse.Body.OrderItems.OrderItem.length>1){
          items = rs.SuccessResponse.Body.OrderItems;
        }else{
          items['OrderItem'].push(rs.SuccessResponse.Body.OrderItems.OrderItem);
        }
        let tracking = items.OrderItem[0].TrackingCode;
        await Order.updateOne({id:order.id}).set({tracking:tracking});
        let rts = await sails.helpers.channel.linio.sign(order.integration, 'SetStatusToReadyToShip',order.seller,['OrderItemIds=['+litems.join(',')+']','DeliveryType=dropship','TrackingNumber='+tracking]);
        await sails.helpers.request(integration.channel.endpoint,'/?'+rts,'POST');
      }
    }

    return exits.success();
  }

};

