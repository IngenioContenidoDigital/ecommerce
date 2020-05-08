module.exports = {
  friendlyName: 'Shipment',
  description: 'Shipment carrier.',
  inputs: {
    order:{
      type:'number',
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
    let url = 'http://sandbox.coordinadora.com/agw/ws/guias/1.6/server.php?wsdl';

    let order = await Order.findOne({id:inputs.order})
    .populate('customer')
    .populate('addressDelivery');

    let seller = await Seller.findOne({id:order.seller}).populate('mainAddress');
    seller.mainAddress = await Address.findOne({id:seller.mainAddress.id}).populate('city');

    let city = await City.findOne({id:order.addressDelivery.city});
    let oitems = await OrderItem.find({order:order.id});
    let items = oitems.length;
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
        'id_cliente' : 29500,
        'id_remitente' : 0,
        'nit_remitente' : null,
        'nombre_remitente' : seller.name,
        'direccion_remitente' : seller.mainAddress.addressline1+' '+seller.mainAddress.addressline2,
        'telefono_remitente' : seller.phone,
        'ciudad_remitente' : seller.mainAddress.city.code+'000',
        'nit_destinatario' : seller.dni,
        'div_destinatario' : 1,
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
        'referencia' : order.id,
        'observaciones' : order.addressDelivery.notes,
        'estado' : 'IMPRESO',
        'detalle' : {
          'Agw_typeGuiaDetalle':{
            'ubl':0,
            'alto':11*items,
            'ancho':21,
            'largo':33,
            'peso':1*items,
            'unidades':items,
            'referencia':null,
            'nombre_empaque':null
          }
        },
        'cuenta_contable' : null,
        'centro_costos' : null,
        'recaudos' : recaudo,
        'margen_izquierdo' : 0,
        'margen_superior' : 0,
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
        'usuario':'sanpolos.ws',
        'clave':'54586c4cc36eb9f7e5f0f5c76f3a027222da685dee0c88110646648ae222baf9',
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
    return exits.success();
  }

};

