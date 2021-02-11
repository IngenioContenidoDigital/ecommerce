module.exports = {
    friendlyName: 'Shipment RedPack',
    description: 'Shipment carrier RedPack.',
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
      seller.mainAddress = await Address.findOne({id:seller.mainAddress.id}).populate('city');
  
      let city = await City.findOne({id:order.addressDelivery.city});
      let oitems = await OrderItem.find({order:order.id}).populate('product');
      let items = oitems.length;
      let integration = await Integrations.findOne({id: order.integration}).populate('channel');
      
      if(order.channel==='direct'){
        let soap = require('strong-soap').soap;
        let url = 'https://ws.redpack.com.mx/RedpackAPI_WS/services/RedpackWS?wsdl';
        
        let requestArgs={
          'envioSinDatos':{
            'PIN' : 'QA gy1AfZeAQdJKIOdl64UDkuy70Ft1123',
            'idUsuario' : '1ECOMM'
          }
        };

        let options = {};

        soap.createClient(url, options, (err, client) =>{
          let method = client['envioSinDatos'];
          if(err){return exits.error(err);}

          method(requestArgs, async (err, result)=>{
            if(err){return exits.error(err);}
            await Order.updateOne({id:inputs.order}).set({tracking:result.return.codigo_remision.$value});
            await sails.helpers.carrier.costs(result.return.codigo_remision.$value);
          });

        });
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
  
  