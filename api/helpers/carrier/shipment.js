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
    let soap = require('strong-soap').soap;
    //let url = 'http://sandbox.coordinadora.com/agw/ws/guias/1.6/server.php?wsdl';
    let url = 'http://guias.coordinadora.com/ws/guias/1.6/server.php?wsdl';

    let order = await Order.findOne({id:inputs.order})
    .populate('customer')
    .populate('addressDelivery')
    .populate('carrier');

    let seller = await Seller.findOne({id:order.seller}).populate('mainAddress');
    seller.mainAddress = await Address.findOne({id:seller.mainAddress.id}).populate('city');

    let city = await City.findOne({id:order.addressDelivery.city});
    let oitems = await OrderItem.find({order:order.id}).populate('product');
    let items = oitems.length;

    if(order.carrier.name==='coordinadora'){
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
          'contenido' : 'Paquete con '+items+' Articulo(s)',
          'referencia' : order.reference,
          'observaciones' : order.addressDelivery.notes,
          'estado' : 'IMPRESO',
          'detalle' : {
            'Agw_typeGuiaDetalle':{
              'ubl':0,
              'alto':alto,
              'ancho':ancho,
              'largo':largo,
              'peso':peso < 1 ? 1 : peso,
              'unidades':items,
              'referencia':null,
              'nombre_empaque':null
            }
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

      /**
     *   Guias_generarGuiaInter - Generar Guía de Despacho Internacional
     *   Guias_generarGuia - Generar Guía de Despacho Nacional
     *   Guias_imprimirRotulos - Imprimir Rotulos para Paquetes
     *   Cotizador_cotizar - Cotizar Costo de la guía
     *   Seguimiento_simple - Verificación de Estado de Entrega
     *   Guias_liquidacionGuia - Consultar el Valor de la Guía
     */
      let options = {};
      soap.createClient(url, options, (err, client) =>{
        let method = client['Guias_generarGuia'];
        if(err){return exits.error(err);}
        method(requestArgs, async (err, result)=>{
          if(err){return exits.error(err);}
          await Order.updateOne({id:inputs.order}).set({tracking:result.return.codigo_remision.$value});
          await sails.helpers.carrier.costs(result.return.codigo_remision.$value);
        });
      });
    }
    if(order.carrier.name==='servientrega' && order.channel==='dafiti'){
      let litems = [];
      for(let it of oitems){
        if(!litems.includes(it.externalReference)){
          litems.push(it.externalReference);
        }
      }
      let route = await sails.helpers.channel.dafiti.sign('SetStatusToPackedByMarketplace',seller.id,['OrderItemIds=['+litems.join(',')+']','DeliveryType=dropship','ShippingProvider=Servientrega']);
      let response = await sails.helpers.request('https://sellercenter-api.dafiti.com.co','/?'+route,'POST');
      let result = JSON.parse(response);
      if(result.SuccessResponse){
        let itemsign = await sails.helpers.channel.dafiti.sign('GetOrderItems',order.seller,['OrderId='+order.channelref]);
        let citems = await sails.helpers.request('https://sellercenter-api.dafiti.com.co','/?'+itemsign,'GET');
        let rs = JSON.parse(citems);
        let items = {OrderItem:[]};
        if(rs.SuccessResponse.Body.OrderItems.OrderItem.length>1){
          items = rs.SuccessResponse.Body.OrderItems;
        }else{
          items['OrderItem'].push(rs.SuccessResponse.Body.OrderItems.OrderItem);
        }
        let tracking = items.OrderItem[0].TrackingCode;
        await Order.updateOne({id:order.id}).set({tracking:tracking});
        let rts = await sails.helpers.channel.dafiti.sign('SetStatusToReadyToShip',order.seller,['OrderItemIds=['+litems.join(',')+']','DeliveryType=dropship','ShippingProvider=Servientrega','TrackingNumber='+tracking]);
        await sails.helpers.request('https://sellercenter-api.dafiti.com.co','/?'+rts,'POST');
      }
    }

    return exits.success();
  }

};

