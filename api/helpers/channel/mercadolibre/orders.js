module.exports = {
  friendlyName: 'Orders',
  description: 'Orders mercadolibre.',
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
    let integration = await sails.helpers.channel.mercadolibre.sign(inputs.integration);

    let profile = await Profile.findOne({name:'customer'});
    let moment = require('moment');

    let result = await sails.helpers.channel.mercadolibre.findUser(integration.secret).catch(err =>{return exits.error(err.message);});
    if(result.id){
      let order = await sails.helpers.channel.mercadolibre.findOrder(inputs.resource, integration.secret, integration.channel.endpoint).catch(err =>{return exits.error(err.message);});
      if(order){
        try{
          let oexists = await Order.find({channel:'mercadolibre', channelref:order.id, integration: integration.id});
          if(oexists.length === 0 && order.status==='paid'){
            let shipping = await sails.helpers.channel.mercadolibre.findShipments(integration.secret,order.shipping.id,integration.channel.endpoint).catch(err=>{
              return exits.error(err.message);
            });
            if(shipping){
              let existShipping = await Order.find({channel:'mercadolibre', tracking: order.shipping.id, integration: integration.id});
              if (existShipping.length === 0) {
                let cityname = shipping['receiver_address'].city.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                let state = shipping['receiver_address'].state.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                if(cityname==='Bogota D.C.' ){cityname='Bogota';}
                if(state==='Bogota D.C.'){state='Bogota';}
                let city = await City.find({name:[cityname.toLowerCase().trim(), state.toLowerCase().trim()]}).populate('region');
                if(city && oexists.length === 0){
                  let user = await User.findOrCreate({emailAddress:order.buyer.email},{
                    emailAddress:order.buyer.email,
                    emailStatus:'confirmed',
                    password:await sails.helpers.passwords.hashPassword(order.buyer['billing_info']['doc_number']),
                    fullName:order.buyer['first_name']+' '+order.buyer['last_name'],
                    dniType:'CC',
                    dni:order.buyer['billing_info']['doc_number'],
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
                      channel:'mercadolibre',
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
                        let pr = await Product.findOne({mlid:item.item.id}).populate('variations');
                        productvariation = pr.variations[0];
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
                    let carrier = shipping['tracking_method'].split(' ');
                    let corders = await sails.helpers.order({address:address,user:user,cart:cart,method:order.payments[0].payment_method_id,payment:payment,carrier:carrier[0]});
                    await Order.updateOne({id:corders[0].id}).set({createdAt:parseInt(moment(order['date_created']).valueOf()),tracking:shipping.id});
                  }
                }else{
                  return exits.error('Ciudad No Localizada');
                }
              } else if(existShipping.length > 0){
                let cartProducts = [];
                for(let item of order['order_items']){
                  try{
                    let productvariation;
                    if(item.item['seller_sku']){
                      productvariation = await ProductVariation.findOne({id:item.item['seller_sku']});
                    }else{
                      let pr = await Product.findOne({mlid:item.item.id}).populate('variations');
                      productvariation = pr.variations[0];
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
                await sails.helpers.channel.mercadolibre.orderShipping({cartProducts, order: existShipping[0]});
              }
            }
          }else{
            if(oexists.length > 0){
              for (const ord of oexists) {
                let shipping = await sails.helpers.channel.mercadolibre.findShipments(integration.secret,order.shipping.id,integration.channel.endpoint).catch(err=>{
                  return exits.error(err.message);
                });
                let currentStatus = await sails.helpers.orderState(shipping.status);
                await Order.updateOne({id:ord.id}).set({updatedAt:parseInt(moment(shipping.last_updated).valueOf()),currentstatus:currentStatus});
                await OrderHistory.create({
                  order:ord.id,
                  state:currentStatus
                });
                await sails.helpers.notification(ord);
              }
            }
          }
        }catch(err){
          return exits.error(err);
        }
        return exits.success();
      }else{
        return exits.error('Sin Ordenes para procesar');
      }
    }
  }
};

