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
    }
  },
  fn: async function (inputs, exits) {
    try {
      let order = await Order.findOne({id:inputs.order})
      .populate('customer')
      .populate('addressDelivery')
      .populate('carrier');

      let seller = await Seller.findOne({id:order.seller}).populate('mainAddress');
      seller.mainAddress = await Address.findOne({id:seller.mainAddress.id}).populate('city');

      let city = await City.findOne({id:order.addressDelivery.city});
      let oitems = await OrderItem.find({order:order.id}).populate('product');
      let integration = await Integrations.findOne({id: order.integration}).populate('channel');

      if(order.channel==='direct' || order.channel==='iridio' || (order.transport && order.transport === 'coordinadora')){

        let recaudo = null;
        if(order.paymentMethod==='COD'){
          let formapago = 1;
          switch(order.paymentOption){
            case 'cash':
              formapago = 1;
              break;
            case 'terminal':
              formapago = 5;
              break;
          }
          recaudo = {
            'Agw_typeGuiaDetalleRecaudo':{
              'referencia':order.id,
              'valor':order.totalOrder,
              'valor_base_iva':order.totalOrder/1.19,
              'valor_iva':(order.totalOrder/1.19)*0.19,
              'formapago':formapago,
            }
          };
        }

        let requestArgs={
          'Guias_generarGuia':{
            'codigo_remision' : null,
            'fecha' : null,
            'id_cliente' : 33152,
            'id_remitente' : 0,
            'nit_remitente' : seller.dni,
            'nombre_remitente' : seller.name.replace(/[&\/\\#,+()$~%.'":*?<>{}]/g,''),
            'direccion_remitente' : seller.mainAddress.addressline1+' '+seller.mainAddress.addressline2,
            'telefono_remitente' : seller.phone,
            'ciudad_remitente' : seller.mainAddress.city.code+'000',
            'nit_destinatario' : order.customer.dni,
            'div_destinatario' : null,
            'nombre_destinatario' : order.customer.fullName,
            'direccion_destinatario' : order.addressDelivery.addressline1+' '+order.addressDelivery.addressline2,
            'ciudad_destinatario' : city.code+'000',
            'telefono_destinatario' : order.customer.mobile,
            'valor_declarado' : (order.totalProducts/1.19)*0.8,
            'codigo_cuenta' : 2,
            'codigo_producto' : 0,
            'nivel_servicio' : 1,
            'linea' : '',
            'contenido' : 'Paquete con '+oitems.length+' Articulo(s)',
            'referencia' : order.reference,
            'observaciones' : order.addressDelivery.notes.slice(0, 99),
            'estado' : 'IMPRESO',
            'detalle' : {
              'Agw_typeGuiaDetalle':[]
            },
            'cuenta_contable' : null,
            'centro_costos' : null,
            'recaudos' : recaudo,
            'margen_izquierdo' : 2,
            'margen_superior' : 2,
            'usuario_vmi' : null,
            'formato_impresion' : null,
            'atributo1_nombre' : null,
            'atributo1_valor' : null,
            'notificaciones' : {
              'Agw_typeNotificaciones':{
                'tipo_medio' : '1',
                'destino_notificacion': ''
              }
            },
            'atributos_retorno' : {
              'nit':null,
              'div':null,
              'nombre':null,
              'direccion':null,
              'codigo_ciudad':null,
              'telefono':null,
            },
            'nro_doc_radicados' : null,
            'nro_sobre' : null,
            'codigo_vendedor' : 0,
            'usuario':'contenidodigital.ws',
            'clave':'e8c5ad7349c80f352b916a5213f95d692813e370300240f947bc28b781e0dd7e',
          }
        };
        let items=[];
        for(let p of oitems){
          if(items.length<1){
            items.push({
              'ubl':'0',
              'alto':(p.product.height).toString(),
              'ancho':(p.product.width).toString(),
              'largo':(p.product.length).toString(),
              'peso':(p.product.weight).toString(),
              'unidades':'1',
              'referencia':null,
              'nombre_empaque':null
            });
          }else{
            let added = false;
            for(let it of items){
              if(it.alto===(p.product.height).toString() && it.ancho===(p.product.width).toString() && it.largo===(p.product.length).toString() && it.peso===(p.product.weight).toString()){
                it.unidades= (parseInt(it.unidades)+1).toString();
                added=true;
              }
            }
            if(!added){
              items.push({
                'ubl':'0',
                'alto':(p.product.height).toString(),
                'ancho':(p.product.width).toString(),
                'largo':(p.product.length).toString(),
                'peso':(p.product.weight).toString(),
                'unidades':'1',
                'referencia':null,
                'nombre_empaque':null
              });
            }
          }
        }
        requestArgs.Guias_generarGuia.detalle.Agw_typeGuiaDetalle=items;
        /**
         *   Guias_generarGuiaInter - Generar Guía de Despacho Internacional
         *   Guias_generarGuia - Generar Guía de Despacho Nacional
         *   Guias_imprimirRotulos - Imprimir Rotulos para Paquetes
         *   Cotizador_cotizar - Cotizar Costo de la guía
         *   Seguimiento_simple - Verificación de Estado de Entrega
         *   Guias_liquidacionGuia - Consultar el Valor de la Guía
         */
        let result = await sails.helpers.carrier.coordinadora.soap(requestArgs,'Guias_generarGuia','prod','guides')
        if(result && !result.error){
          const order = await Order.updateOne({id:inputs.order}).set({tracking:result.return.codigo_remision.$value});
          await sails.helpers.carrier.costs(result.return.codigo_remision.$value);
          if (order.channel === 'mercadolibre' && order.shippingMeli) {
            if (order.modeMeli === 'custom') {
              const payment = {
                shipping: order.shippingMeli,
                status: order.currentstatus,
                mode: 'custom',
                receiverId: order.receiverId,
                tracking: order.tracking
              };
              await sails.helpers.channel.mercadolibre.updateShipment(order.integration, payment);
            } else if (order.modeMeli === 'me1') {
              const payment = {
                shipping: order.shippingMeli,
                status: order.currentstatus,
                mode: 'me1',
                receiverId: order.receiverId,
                tracking: order.tracking
              };
              await sails.helpers.channel.mercadolibre.updateShipment(order.integration, payment);
            }
          }
        } else {
          return exits.success({error: result.error});
        }
      }
      if(order.channel==='dafiti'){
        let litems = [];
        for(let it of oitems){
          if(!litems.includes(it.externalReference)){
            litems.push(it.externalReference);
          }
        }
        if(oitems[0].shippingType && oitems[0].shippingType === 'Cross docking'){
          let route = await sails.helpers.channel.dafiti.sign(order.integration, 'SetStatusToPackedByMarketplace',seller.id,['OrderItemIds=['+litems.join(',')+']','DeliveryType=pickup','ShippingProvider=']);
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
            const orderNumber = items.OrderItem[0].PurchaseOrderNumber;
            await Order.updateOne({id:order.id}).set({tracking:orderNumber});
            let rts = await sails.helpers.channel.dafiti.sign(order.integration,'SetStatusToReadyToShip',order.seller,['OrderItemIds=['+litems.join(',')+']','DeliveryType=pickup','ShippingProvider=','TrackingNumber='+orderNumber]);
            await sails.helpers.request(integration.channel.endpoint,'/?'+rts,'POST');
          }
        } else {
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
          let carrier = await Carrier.findOne({name: items.OrderItem[0] ? items.OrderItem[0].ShipmentProvider.trim().toLowerCase() : ''});
          await Order.updateOne({id:order.id}).set({tracking:tracking,carrier: carrier ? carrier.id : null});
          let rts = await sails.helpers.channel.linio.sign(order.integration, 'SetStatusToReadyToShip',order.seller,['OrderItemIds=['+litems.join(',')+']','DeliveryType=dropship','TrackingNumber='+tracking]);
          await sails.helpers.request(integration.channel.endpoint,'/?'+rts,'POST');
        }
      }
      if(order.channel==='liniomx'){
        let litems = [];
        for(let it of oitems){
          if(!litems.includes(it.externalReference)){
            litems.push(it.externalReference);
          }
        }
        let route = await sails.helpers.channel.liniomx.sign(order.integration, 'SetStatusToPackedByMarketplace',seller.id,['OrderItemIds=['+litems.join(',')+']','DeliveryType=dropship']);
        let response = await sails.helpers.request(integration.channel.endpoint,'/?'+route,'POST');
        let result = JSON.parse(response);
        if(result.SuccessResponse){
          let itemsign = await sails.helpers.channel.liniomx.sign(order.integration, 'GetOrderItems',order.seller,['OrderId='+order.channelref]);
          let citems = await sails.helpers.request(integration.channel.endpoint,'/?'+itemsign,'GET');
          let rs = JSON.parse(citems);
          let items = {OrderItem:[]};
          if(rs.SuccessResponse.Body.OrderItems.OrderItem.length>1){
            items = rs.SuccessResponse.Body.OrderItems;
          }else{
            items['OrderItem'].push(rs.SuccessResponse.Body.OrderItems.OrderItem);
          }
          let tracking = items.OrderItem[0].TrackingCode;
          let carrier = await Carrier.findOne({name: items.OrderItem[0] ? items.OrderItem[0].ShipmentProvider.trim().toLowerCase() : ''});
          await Order.updateOne({id:order.id}).set({tracking:tracking,carrier: carrier ? carrier.id : null});
          let rts = await sails.helpers.channel.liniomx.sign(order.integration, 'SetStatusToReadyToShip',order.seller,['OrderItemIds=['+litems.join(',')+']','DeliveryType=dropship','TrackingNumber='+tracking]);
          await sails.helpers.request(integration.channel.endpoint,'/?'+rts,'POST');
        }
      }
      if(order.channel==='walmart'){
        let axios = require('axios');
        let token = await sails.helpers.channel.walmart.sign(integration);

        let auth = `${integration.user}:${integration.key}`;
        const buferArray = Buffer.from(auth);
        let encodedAuth = buferArray.toString('base64');

        let order_id_array = order.channelref.split('-');
        let purchaseOrderId = order_id_array[0];
        let order_line = order_id_array[1];

        let options = {
          method: 'get',
          url: `${integration.channel.endpoint}/v3/orders?purchaseOrderId=${purchaseOrderId}`,
          headers: {
            accept: 'application/json',
            'WM_MARKET' : 'mx',
            'WM_SEC.ACCESS_TOKEN':token,
            'WM_SVC.NAME' : 'Walmart Marketplace',
            'WM_QOS.CORRELATION_ID': '11111111',
            'Authorization': `Basic ${encodedAuth}`
          }
        };
        let response_order = await axios(options).catch((e) => {error=e; console.log(e);});
        if(response_order){
        //   response_order.data.order[0].shipments=[

          //     {

          //         "shipmentLines": [

          //             {

          //                 "primeLineNo": "2",

          //                 "shipmentLineNo": "1",

          //                 "quantity": {

          //                     "unitOfMeasurement": "EACH",

          //                     "amount": "1"

          //                 }

          //             }

          //         ],

          //         "shipmentNo": "149059311",

          //         "carrier": "MX-FEDX",

          //         "trackingNumber": "936922412400",

          //         "trackingUrl": "https://www.fedex.com/apps/fedextrack/?cntry_code=mx&tab=1&tracknums=936922412400",

          //         "shipmentAdditionalDate": {

          //             "shipmentActualCreatedDate": "2021-02-24T14:14:15.000-06:00",

          //             "expectedShipmentACKDate": "2021-02-26T14:14:15.000-06:00",

          //             "shipmentACKDate": "2021-02-24T20:36:36.000-06:00",

          //             "expectedShipmentShippedDate": "2021-02-26T20:36:36.000-06:00"

          //         }

          //     },

          //     {

          //         "shipmentLines": [
          //             {
          //                 "primeLineNo": "1",
          //                 "shipmentLineNo": "1",
          //                 "quantity": {
          //                     "unitOfMeasurement": "EACH",
          //                     "amount": "1"
          //                 }
          //             }
          //         ],
          //         "shipmentNo": "149059322",
          //         "carrier": "MX-FEDX",
          //         "trackingNumber": "936922412385",
          //         "trackingUrl": "https://www.fedex.com/apps/fedextrack/?cntry_code=mx&tab=1&tracknums=936922412385",
          //         "shipmentAdditionalDate": {
          //             "shipmentActualCreatedDate": "2021-02-24T14:14:17.000-06:00",
          //             "expectedShipmentACKDate": "2021-02-26T14:14:16.000-06:00",
          //             "shipmentACKDate": "2021-02-24T20:36:36.000-06:00",
          //             "expectedShipmentShippedDate": "2021-02-26T20:36:36.000-06:00"
          //         }

          //     }

          // ]
          const result = response_order.data.order[0].shipments.filter(item => item.shipmentLines[0].primeLineNo === order_line);
          let tracking = result[0].trackingNumber;
          await Order.updateOne({id:order.id}).set({tracking:tracking});
        }

      }
      if (order.channel==='shopee') {
        let body = {
          order_sn: order.channelref,
          dropoff: {
            branch_id: 0,
            sender_real_name: '',
            tracking_number: ''
          }
        };
        let result = await sails.helpers.channel.shopee.request('/api/v2/logistics/ship_order',integration.channel.endpoint,[`shop_id=${parseInt(integration.shopid)}`,`access_token=${integration.secret}`],body,'POST');
        if (result && !result.error) {
          let resultTraking = await sails.helpers.channel.shopee.request('/api/v2/logistics/get_tracking_number',integration.channel.endpoint,[`shop_id=${parseInt(integration.shopid)}`,`access_token=${integration.secret}`,`order_sn=${order.channelref}`]);
          if (resultTraking && !resultTraking.error && resultTraking.response.tracking_number) {
            await Order.updateOne({id:order.id}).set({tracking: resultTraking.response.tracking_number});
            let bodyDocument = {
              order_list: [
                {
                  order_sn: order.channelref,
                  package_number: order.paymentId
                }
              ]
            };
            await sails.helpers.channel.shopee.request('/api/v2/logistics/create_shipping_document',integration.channel.endpoint,[`shop_id=${parseInt(integration.shopid)}`,`access_token=${integration.secret}`],bodyDocument,'POST');
          }
        }
      }
      return exits.success();
    } catch (error) {
      return exits.success({error: error.message});
    }
  }

};

