module.exports = {
  friendlyName: 'Orders',
  description: 'Orders shopee.',
  inputs: {
    integration:{
      type:'ref',
      required:true
    },
    seller:{
      type:'string',
      required:true
    },
    orderId: {
      type: 'string',
      required: true
    },
  },
  exits: {
    success: {
      description: 'All done.',
    },
    error:{
      description: 'Error'
    },
  },
  fn: async function (inputs,exits) {
    let profile = await Profile.findOne({name:'customer'});
    let moment = require('moment');
    let data;

    let response = await sails.helpers.channel.shopee.request('/api/v2/order/get_order_detail',inputs.integration.channel.endpoint,[`shop_id=${parseInt(inputs.integration.shopid)}`,`access_token=${inputs.integration.secret}`,`order_sn_list=${inputs.orderId}`,`response_optional_fields=payment_method,recipient_address,item_list,buyer_username,buyer_user_id,shipping_carrier,package_list`]);
    if (response && !response.error) {
      for(let order of response.response.order_list){
        let oexists = await Order.findOne({channel: 'shopee', channelref: order.order_sn, seller: inputs.seller, integration: inputs.integration.id});
        data = {channel: 'shopee', channelref: order.order_sn, seller: inputs.seller};
        if(order.order_status === 'UNPAID'){
          let city = await City.find({name: order.recipient_address.city.toLowerCase().trim()}).populate('region');
          if(city.length > 0 && oexists === undefined){
            let email = `${order.buyer_username}@shopee.com`;
            let user = await User.findOrCreate({emailAddress: email},{
              emailAddress: email,
              emailStatus: 'confirmed',
              password: await sails.helpers.passwords.hashPassword(order.buyer_username),
              fullName: order.recipient_address.name,
              dniType: 'CC',
              dni: '',
              mobilecountry: city[0].region.country,
              mobile: order.recipient_address.phone ? parseInt(order.recipient_address.phone) : 0,
              mobileStatus:'unconfirmed',
              profile:profile.id
            });

            let address = await Address.findOrCreate({addressline1:order.recipient_address.full_address.trim().toLowerCase()},{
              name: order.recipient_address.full_address.trim().toLowerCase(),
              addressline1: order.recipient_address.full_address.trim().toLowerCase(),
              addressline2: '',
              country: city[0].region.country,
              region: city[0].region.id,
              city: city[0].id,
              notes: '',
              zipcode: order.recipient_address.zipcode ? order.recipient_address.zipcode : '',
              user: user.id,
            });

            let payment = {
              data:{
                estado: 'Aceptada',
                channel: 'shopee',
                channelref: order.order_sn,
                integration: inputs.integration.id,
                ref_payco: order.package_list[0].package_number
              }
            };
            let cart = await Cart.create().fetch();
            for(let item of order.item_list){
              let productvariation = await ProductVariation.find({
                where: {
                  seller: inputs.seller,
                  or : [
                    { id: item.model_sku }
                  ]
                }
              });
              if(productvariation.length > 0){
                await CartProduct.create({
                  cart:cart.id,
                  product:productvariation[0].product,
                  productvariation:productvariation[0].id,
                  totalDiscount:0,
                  totalPrice:parseFloat(item.model_original_price),
                  externalReference:item.order_item_id,
                  shippingType: ''
                });
              }
            }
            if((await CartProduct.count({cart:cart.id})) > 0){
              let corders = await sails.helpers.order({address:address,user:user,cart:cart,method:order.payment_method,payment:payment,carrier:''});
              await Order.updateOne({id:corders[0].id}).set({createdAt:parseInt(moment(order.create_time).valueOf())});
            }
          }
        } else {
          if(oexists !== undefined){
            let currentStatus = await sails.helpers.orderState(order.order_status);
            await sails.helpers.notification(oexists, currentStatus);
            await Order.updateOne({id:oexists.id}).set({updatedAt:parseInt(moment(order.update_time).valueOf()),currentstatus:currentStatus});
            let oitems = await OrderItem.find({order:oexists.id});
            for(let it of oitems){
              await OrderItem.updateOne({id: it.id}).set({currentstatus: currentStatus,updatedAt:parseInt(moment(order.update_time).valueOf())});
            }
            await OrderHistory.create({
              order:oexists.id,
              state:currentStatus
            });
          }
        }
      }
      return exits.success(data);
    } else {
      return exits.error('Sin Ordenes para procesar');
    }
  }
};
