module.exports = {
  friendlyName: 'Orders',
  description: 'Orders mercadolibre mexico.',
  inputs: {
    integration:{
      type:'string',
      required:true
    },
    resource: {
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
    let integration = await sails.helpers.channel.mercadolibremx.sign(inputs.integration);

    let profile = await Profile.findOne({name:'customer'});
    let moment = require('moment');

    let result = await sails.helpers.channel.mercadolibremx.findUser(integration.secret).catch(err =>{return exits.error(err.message);});
    if(result.id){
      let order = await sails.helpers.channel.mercadolibremx.findOrder(inputs.resource, integration.secret, integration.channel.endpoint).catch(err =>{return exits.error(err.message);});
      if(order){
        try{
          let oexists = await Order.find({channel:'mercadolibremx', channelref:order.id, integration: integration.id});
          if(oexists.length === 0 && order.status==='paid'){
            if(order.shipping.id){
              let shipping = await sails.helpers.channel.mercadolibremx.findShipments(integration.secret,order.shipping.id,integration.channel.endpoint).catch(err=>{
                return exits.error(err.message);
              });
              let existShipping = await Order.find({channel:'mercadolibremx', tracking: order.shipping.id, integration: integration.id});
              if (existShipping.length === 0) {
                let cityname = shipping['receiver_address'].city.name;
                let state = shipping['receiver_address'].state.name;
                if(state==='Distrito Federal'){state='ciudad de méxico';}

                let region = await Region.find({name:state.toLowerCase().trim()});
                let city = await City.find({name:cityname.toLowerCase().trim(), region: region ? region.id : '' }).populate('region');

                if(city && oexists.length === 0){
                  let user = await User.findOrCreate({emailAddress:order.buyer.email},{
                    emailAddress:order.buyer.email,
                    emailStatus:'confirmed',
                    password:await sails.helpers.passwords.hashPassword(order.buyer.id),
                    fullName:order.buyer['first_name']+' '+order.buyer['last_name'],
                    dniType:order.buyer.billing_info && order.buyer['billing_info']['doc_number'] ? 'CC' : 'MLID',
                    dni: order.buyer.billing_info && order.buyer['billing_info']['doc_number'] ? order.buyer['billing_info']['doc_number'].toString() : order.buyer.id.toString(),
                    mobilecountry:city[0].region.country,
                    mobile:0,
                    mobileStatus:'unconfirmed',
                    profile:profile.id
                  });
                  let address = await Address.findOrCreate({addressline1:shipping['receiver_address']['address_line'].toLowerCase().trim()},{
                    name:shipping['receiver_address']['address_line'].trim().toLowerCase(),
                    addressline1:shipping['receiver_address']['address_line'].trim().toLowerCase(),
                    addressline2:shipping['receiver_address']['comment'] ? shipping['receiver_address']['comment'].trim().toLowerCase() : '',
                    country:city[0].region.country,
                    region:city[0].region.id,
                    city:city[0].id,
                    notes:shipping['receiver_address']['comment'] ? shipping['receiver_address']['comment'].trim().toLowerCase() : '',
                    zipcode:shipping['receiver_address']['zip_code'] ? shipping['receiver_address']['zip_code'] : '',
                    user:user.id,
                  });
                  let payment = {
                    data:{
                      estado:'Aceptado',
                      channel:'mercadolibremx',
                      channelref:order.id,
                      integration:integration.id
                    }
                  };

                  payment.data['ref_payco'] = order.id;
                  let cart = await Cart.create().fetch();
                  for(let item of order['order_items']){
                    try{
                      let productvariation;
                      if(item.item['seller_sku']){
                        productvariation = await ProductVariation.findOne({id:item.item['seller_sku']});
                      }else{
                        let pr = await ProductChannel.findOne({channelid:item.item.id});
                        if (pr) {
                          pr = await Product.findOne({id:pr.product}).populate('variations');
                          productvariation = pr.variations[0];
                        }
                      }
                      if(productvariation){
                        for (let i = 1; i <= item.quantity; i++) {
                          await CartProduct.create({
                            cart:cart.id,
                            product:productvariation.product,
                            productvariation:productvariation.id,
                            totalDiscount:parseFloat(0),
                            totalPrice:parseFloat(item['full_unit_price']),
                            externalReference:item.item['variation_id'] ? item.item['variation_id'] : ''
                          });
                        }
                      }
                    }catch(err){
                      return exits.error(err.message);
                    }
                  }
                  if((await CartProduct.count({cart:cart.id}))>0){
                    let carrier = shipping['tracking_method'] ? shipping['tracking_method'].split(' ') : '';
                    let tracking = shipping.mode === 'custom' || shipping.mode === 'not_specified' ? '' : shipping.id;
                    let corders = await sails.helpers.order({address:address,user:user,cart:cart,method:order.payments[0].payment_method_id,payment:payment,carrier:carrier[0]});
                    await Order.updateOne({id:corders[0].id}).set({createdAt:parseInt(moment(order['date_created']).valueOf()),tracking: tracking});
                  } else {
                    throw new Error('No se pudo crear la orden');
                  }
                }else{
                  throw new Error('Ciudad No Localizada');
                }
              } else if(existShipping.length > 0){
                let cartProducts = [];
                let orderItems = await OrderItem.find({order: existShipping[0].id, externalOrder: order.id});
                const channelref = order.id;
                if (orderItems.length === 0) {
                  for(let item of order['order_items']){
                    try{
                      let productvariation;
                      if(item.item['seller_sku']){
                        productvariation = await ProductVariation.findOne({id:item.item['seller_sku']});
                      }else{
                        let pr = await ProductChannel.findOne({channelid:item.item.id});
                        if (pr) {
                          pr = await Product.findOne({id:pr.product}).populate('variations');
                          productvariation = pr.variations[0];
                        }
                      }
                      if(productvariation){
                        for (let i = 1; i <= item.quantity; i++) {
                          let cartproduct = await CartProduct.create({
                            cart: existShipping[0].cart,
                            product:productvariation.product,
                            productvariation:productvariation.id,
                            totalDiscount:parseFloat(0),
                            totalPrice:parseFloat(item['full_unit_price']),
                            externalReference:item.item['variation_id'] ? item.item['variation_id'] : ''
                          }).fetch();
                          cartproduct = await CartProduct.findOne({id: cartproduct.id}).populate('product').populate('productvariation');
                          cartProducts.push(cartproduct);
                        }
                      }
                    }catch(err){
                      return exits.error(err.message);
                    }
                  }
                  await sails.helpers.channel.orderShipping({cartProducts, channelref, order: existShipping[0]});
                }
              }
            } else {
              let user = await User.findOrCreate({emailAddress:order.buyer.email},{
                emailAddress:order.buyer.email,
                emailStatus:'confirmed',
                password:await sails.helpers.passwords.hashPassword(order.buyer.id.toString()),
                fullName:order.buyer['first_name']+' '+order.buyer['last_name'],
                dniType: order.buyer && order.buyer.billing_info && order.buyer['billing_info']['doc_number'] ? 'CC' : 'MLID',
                dni: order.buyer && order.buyer.billing_info && order.buyer['billing_info']['doc_number'] ? order.buyer['billing_info']['doc_number'].toString() : order.buyer.id.toString(),
                mobilecountry:null,
                mobile:0,
                mobileStatus:'unconfirmed',
                profile:profile.id
              });
              let address = null;
              let payment = {
                data:{
                  estado:'Aceptado',
                  channel:'mercadolibremx',
                  channelref:order.id,
                  integration:integration.id
                }
              };
              payment.data['ref_payco'] = order.id;
              let cart = await Cart.create().fetch();
              for(let item of order['order_items']){
                try{
                  let productvariation;
                  if(item.item['seller_sku']){
                    productvariation = await ProductVariation.findOne({id:item.item['seller_sku']});
                  }else{
                    let pr = await ProductChannel.findOne({channelid:item.item.id});
                    if (pr) {
                      pr = await Product.findOne({id:pr.product}).populate('variations');
                      productvariation = pr.variations[0];
                    }
                  }
                  if(productvariation){
                    for (let i = 1; i <= item.quantity; i++) {
                      await CartProduct.create({
                        cart:cart.id,
                        product:productvariation.product,
                        productvariation:productvariation.id,
                        totalDiscount:parseFloat(0),
                        totalPrice:parseFloat(item['full_unit_price']),
                        externalReference:item.item['variation_id'] ? item.item['variation_id'] : ''
                      });
                    }
                  }
                }catch(err){
                  return exits.error(err.message);
                }
              }
              if((await CartProduct.count({cart:cart.id}))>0){
                let corders = await sails.helpers.order({address:address,user:user,cart:cart,method:order.payments[0].payment_method_id,payment:payment,carrier:''});
                await Order.updateOne({id:corders[0].id}).set({createdAt:parseInt(moment(order['date_created']).valueOf()),tracking:''});
              } else {
                return exits.error('No se pudo crear la orden');
              }
            }
          }else{
            if(oexists.length > 0){
              for (const ord of oexists) {
                let shipping = await sails.helpers.channel.mercadolibremx.findShipments(integration.secret,order.shipping.id,integration.channel.endpoint).catch(err=>{
                  return exits.error(err.message);
                });
                let currentStatus = await sails.helpers.orderState(shipping.status);
                await sails.helpers.notification(ord, currentStatus);
                await Order.updateOne({id:ord.id}).set({updatedAt:parseInt(moment(shipping.last_updated).valueOf()),currentstatus:currentStatus});
                let oitems = await OrderItem.find({order:ord.id});
                for(let it of oitems){
                  await OrderItem.updateOne({id: it.id}).set({currentstatus: currentStatus});
                }
                await OrderHistory.create({
                  order:ord.id,
                  state:currentStatus
                });
              }
            }
          }
        }catch(err){
          console.log(err);
          return exits.error(err);
        }
        return exits.success();
      }else{
        return exits.error('Sin Ordenes para procesar');
      }
    }
  }
};
