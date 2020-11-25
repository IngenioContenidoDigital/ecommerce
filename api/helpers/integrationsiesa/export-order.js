module.exports = {
  friendlyName: 'Export Order',
  description: 'Export order to SIESA.',
  inputs: {
    params:{
      type:'ref',
      required:true
    }
  },
  exits: {
    success: {
      description: 'All done.',
    },
  },
  fn: async function (inputs, exits) {
    let moment = require('moment');
    let soap = require('strong-soap').soap;
    let order = await Order.findOne(inputs.params).populate('customer').populate('currentstatus').populate('addressDelivery');
    let url = 'http://190.0.46.6:14999/ServiciosWeb/wsGenerarPlano.asmx?wsdl';
    if (order) {
      let address = await Address.findOne({id: order.addressDelivery.id}).populate('city').populate('region');
      let items = await OrderItem.find({order: order.id}).populate('product').populate('productvariation');
      let resultCustomer = await sails.helpers.integrationsiesa.exportClient(order.customer, address);
      if (resultCustomer.ImportarDatosXMLResult === 'Importacion exitosa') {
        let Movto = '';
        let i = 0;
        let deliveryDate = moment().add(5, 'days').format('YYYYMMDD');
        let idSucursal = address.region.name === 'san andrés y providencia' ? '002' : '001';
        let nameAddress = address.region.name + ' ' + address.city.name;
        let noteAddress = nameAddress.toLowerCase().trim().split(' ').map( v => v[0].toUpperCase() + v.substr(1) ).join(' ');
        let resultItems = [];
        items.forEach((ite) => {
          var tempKey = ite.productvariation.id;
          if (!resultItems.hasOwnProperty(tempKey)) {
            ite.quantity = 1;
            resultItems[tempKey] = ite;
          } else {
            resultItems[tempKey].quantity += 1;
          }
        });
        Object.keys(resultItems).map((key) => {
          const item = resultItems[key];
          const priceIva = parseInt(item.originalPrice - (item.originalPrice/1.19));
          const unitPrice = address.region.iva ? Math.ceil((item.originalPrice - item.discount) - priceIva) : Math.ceil(item.originalPrice - item.discount);
          const movtoItem = `<Movto_Pedidos_Comercial>              
              <f431_id_tipo_docto>EMV</f431_id_tipo_docto>
              <f431_consec_docto>1</f431_consec_docto>
              <f431_nro_registro>${i+1}</f431_nro_registro>
              <f431_referencia_item></f431_referencia_item>
              <f431_codigo_barras>${item.productvariation.ean13}</f431_codigo_barras>
              <f431_id_ext1_detalle></f431_id_ext1_detalle>
              <f431_id_ext2_detalle></f431_id_ext2_detalle>
              <f431_id_un_movto></f431_id_un_movto>
              <f431_fecha_entrega>${deliveryDate}</f431_fecha_entrega>
              <f431_num_dias_entrega>5</f431_num_dias_entrega>
              <f431_id_unidad_medida>UND</f431_id_unidad_medida>
              <f431_cant_pedida_base>${item.quantity}</f431_cant_pedida_base>
              <f431_precio_unitario>${unitPrice}</f431_precio_unitario>
            </Movto_Pedidos_Comercial>`;
          const tax = address.region.iva ? '' : `
            <Impuestos>
              <F430_CONSEC_DOCTO>1</F430_CONSEC_DOCTO>
              <F431_NRO_REGISTRO>${i+1}</F431_NRO_REGISTRO>
              <F433_ID_LLAVE_IMPUESTO>IV02</F433_ID_LLAVE_IMPUESTO>
              <F433_VLR_UNI>${priceIva}</F433_VLR_UNI>
            </Impuestos>
          `;
          Movto = Movto + movtoItem + tax;
          i += 1;
        });
        let requestArgs={
          idDocumento: 80032,
          strNombreDocumento: 'Pedidos',
          idCompania: 2,
          strCompania: '1',
          strUsuario: 'gt',
          strClave: 'gt',
          strFuenteDatos:
            `<![CDATA[
              <MyDataSet>
                <Pedidos>
                  <f430_id_tipo_docto>EMV</f430_id_tipo_docto>
                  <f430_consec_docto>1</f430_consec_docto>
                  <f430_id_fecha>${moment().format('YYYYMMDD')}</f430_id_fecha>
                  <f430_id_tercero_fact>8888</f430_id_tercero_fact>
                  <f430_id_sucursal_fact>${idSucursal}</f430_id_sucursal_fact>
                  <f430_id_tercero_rem>8888</f430_id_tercero_rem>
                  <f430_id_sucursal_rem>${idSucursal}</f430_id_sucursal_rem>
                  <f430_id_co_fact>147</f430_id_co_fact>
                  <f430_fecha_entrega>${deliveryDate}</f430_fecha_entrega>
                  <f430_num_dias_entrega>5</f430_num_dias_entrega>
                  <f430_num_docto_referencia>${order.reference}</f430_num_docto_referencia>
                  <f430_referencia></f430_referencia>
                  <f430_id_cond_pago>000</f430_id_cond_pago>
                  <f430_notas>${noteAddress + ' | '+ address.addressline1 + ', ' + address.notes + ' | Metodo de pago: ' + order.paymentMethod + ' | ' + order.channelref + ' ('+ order.reference + ')'}</f430_notas>
                  <f430_id_cli_contado>${order.customer.dni}</f430_id_cli_contado>
                  <f430_id_tercero_vendedor>800130985</f430_id_tercero_vendedor>
                </Pedidos>
                ${Movto}
              </MyDataSet>
            ]]>`,
          Path: 'E:'
        };
        let options = { endpoint: 'http://190.0.46.6:14999/ServiciosWeb/wsGenerarPlano.asmx'};
        soap.createClient(url, options, (err, client) =>{
          let method = client['ImportarDatosXML'];
          if(err){return exits.error(err);}
          method(requestArgs, async (err, result)=>{
            if(err){return exits.error(err);}
            if(result.ImportarDatosXMLResult === 'Importacion exitosa'){
              await sails.helpers.integrationsiesa.updateCargue(order.reference, 'Aceptado');
              return exits.success(result);
            }else {
              return exits.error('No se pudo crear el pedido');
            }
          });
        });
      } else {
        return exits.error(resultCustomer.ImportarDatosXMLResult);
      }
    } else {
      return exits.error('La orden no fue encontrada');
    }
  }
};
