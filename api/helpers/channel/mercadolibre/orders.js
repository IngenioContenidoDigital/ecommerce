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
    let orderfilter = [];
    let profile = await Profile.findOne({name:'customer'});
    let moment = require('moment');

    //La Siguiente linea (28), no está haciendo nada. Validar si es necesaria
    //let result = await sails.helpers.channel.mercadolibre.findUser(integration.secret).catch(err =>{return exits.error(err.message);});
    let integration = await sails.helpers.channel.mercadolibre.sign(inputs.integration);
    let order = await sails.helpers.channel.mercadolibre.findOrder(inputs.resource, integration.secret, integration.channel.endpoint).catch(err =>{return exits.error(err.message);});
    let shipping = null;
    if(order){
      try{
        orderfilter[0]={channel:'mercadolibre', channelref:order.id, integration: inputs.integration};
        if(order.shipping.id){
          orderfilter[1]={channel:'mercadolibre', shippingMeli:order.shipping.id, integration: inputs.integration};
          orderfilter[2]={channel:'mercadolibre', tracking:order.shipping.id, integration: inputs.integration};
          shipping = await sails.helpers.channel.mercadolibre.findShipments(integration.secret,order.shipping.id,integration.channel.endpoint).catch(err=>{
            return exits.error(err.message);
          });
        }
        let oexists = await Order.find({or:orderfilter});
        if(oexists.length < 1 && order.status==='paid'){
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
          if(shipping){
            let cityname = shipping['receiver_address'].city.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            let state = shipping['receiver_address'].state.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            if(cityname==='Bogota D.C.' ){cityname='Bogota';}
            if(state==='Bogota D.C.'){state='Bogota';}
            let city = await City.find({name:[cityname.toLowerCase().trim(), state.toLowerCase().trim()]}).populate('region');
            if(city){
              address = await Address.findOrCreate({addressline1:shipping['receiver_address']['address_line'].toLowerCase().trim()},{
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
            }
          }
          let payment = {
            data:{
              estado:'Aceptado',
              channel:'mercadolibre',
              channelref:order.id,
              integration:integration.id,
              shipping: order.shipping.id ? order.shipping.id : ''
            }
          };
          payment.data['ref_payco'] = order.id;
          let cart = await Cart.create().fetch();
          for(let item of order['order_items']){
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
          }
          if((await CartProduct.count({cart:cart.id}))>0){
            let corders = await sails.helpers.order({address:address,user:user,cart:cart,method:order.payments[0].payment_method_id,payment:payment,carrier:''});
            await Order.updateOne({id:corders[0].id}).set({createdAt:parseInt(moment(order['date_created']).valueOf()),tracking:''});
          } else {
            return exits.error('No se pudo crear la orden');
          }

        }else if(oexists.length > 0 && order.status==='paid'){
          let cartProducts = [];
          let orderItems = await OrderItem.find({externalOrder: order.id});
          const channelref = order.id;
          if (!orderItems) {
            for(let item of order['order_items']){
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
                    cart: oexists[0].cart,
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
            }
            await sails.helpers.channel.orderShipping({cartProducts, channelref, order: oexists[0].id});
          }
        }else{
          for (const ord of oexists) {
            let shipping = await sails.helpers.channel.mercadolibre.findShipments(integration.secret,order.shipping.id,integration.channel.endpoint).catch(err=>{
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
        return exits.success();
      }catch(err){
        console.log(err);
        return exits.error(err);
      }
    }else{
      return exits.error('Sin Ordenes para procesar');
    }
  }
};
