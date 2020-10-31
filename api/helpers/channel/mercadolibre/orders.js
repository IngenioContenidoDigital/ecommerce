module.exports = {
  friendlyName: 'Orders',
  description: 'Orders mercadolibre.',
  inputs: {
    seller:{
      type:'string',
      required:true
    },
    secret: {
      type: 'string',
      required: true
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
    let mercadolibre = await sails.helpers.channel.mercadolibre.sign(inputs.seller);

    let profile = await Profile.findOne({name:'customer'});
    let moment = require('moment');

    let result = await sails.helpers.channel.mercadolibre.findUser(mercadolibre, inputs.secret).catch(err =>{return exits.error(err.message);});
    if(result.id){
      let parameters = {};
      parameters.seller = result.id;
      parameters['access_token'] = inputs.secret;
      let order = await sails.helpers.channel.mercadolibre.findOrder(mercadolibre, parameters, inputs.resource).catch(err =>{return exits.error(err.message);});
      if(order){
        try{
          let oexists = await Order.findOne({channel:'mercadolibre',channelref:order.id});
          if(oexists===undefined && order.status==='paid'){
            let shipping = await sails.helpers.channel.mercadolibre.findShipments(mercadolibre,inputs.secret,order.shipping.id).catch(err=>{
              return exits.error(err.message);
            });
            if(shipping){
              let cityname = shipping['receiver_address'].city.name;
              if(cityname==='Bogotá D.C.' || 'Bogotá'){cityname='Bogota';}
              let city = await City.find({name:cityname.toLowerCase().trim()}).populate('region');
              if(city && oexists===undefined){
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
                    channelref:order.id
                  }
                };
                payment.data['ref_payco'] = order.id;
                let cart = await Cart.create().fetch();
                for(let item of order['order_items']){
                  try{
                    let productvariation = await ProductVariation.findOne({id:item.item['seller_sku']});
                    if(productvariation){
                      await CartProduct.create({
                        cart:cart.id,
                        product:productvariation.product,
                        productvariation:productvariation.id,
                        totalDiscount:parseFloat(0),
                        totalPrice:parseFloat(item['full_unit_price']),
                        externalReference:item.item['variation_id']
                      });
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
            }
          }else{
            if(oexists!==undefined){
              let currentStatus = await sails.helpers.orderState(order.status);
              await Order.updateOne({id:oexists.id}).set({updatedAt:parseInt(moment(order['last_updated']).valueOf()),currentstatus:currentStatus});
              await OrderHistory.create({
                order:oexists.id,
                state:currentStatus
              });
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

