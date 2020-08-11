module.exports = {
  friendlyName: 'Orders',
  description: 'Orders mercadolibre.',
  inputs: {
    seller:{
      type:'string',
      required:true
    },
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
  fn: async function (inputs,exits) {
    let mercadolibre = await sails.helpers.channel.mercadolibre.sign(inputs.seller);
    let integrations = await Integrations.findOne({channel:'mercadolibre',seller:inputs.seller});
    let profile = await Profile.findOne({name:'customer'});
    mercadolibre.get('users/me',{access_token:integrations.secret}, (err, result) =>{
      if(err){console.log(err);}
      inputs.params.seller=result.id;
      inputs.params['access_token']=integrations.secret;
      mercadolibre.get('orders/search/',inputs.params, (err, result) => {
        if(err){console.log(err); return exits.error(err);}
        for(let order of result.results){
          let oexists = await Order.findOne({channel:'mercadolibre',channelref:order.id});
          if(oexists===undefined && order.status==='paid'){
            let cityname = order.shipping['receiver_address'].city.name;
            if(cityname==='Bogotá D.C.' || 'Bogotá'){cityname='Bogota'}
            let city = await City.find({name:cityname.toLowerCase().trim()}).populate('region');

            if(city.length>0 && oexists===undefined){
              let user = await User.findOrCreate({emailAddress:order.buyer.email},{
                emailAddress:order.buyer.email,
                emailStatus:'confirmed',
                password:await sails.helpers.passwords.hashPassword(order.buyer['billing_info']['doc_number']),
                fullName:order.buyer['first_name']+' '+order.buyer['last_name'],
                dniType:'CC',
                dni:order.buyer['billing_info']['doc_number'],
                mobilecountry:city[0].region.country,
                mobile:parseInt(order.buyer.phone.number),
                mobileStatus:'confirmed',
                profile:profile.id
              });
              let address = await Address.findOrCreate({addressline1:order.shipping['receiver_address']['address_line'].toLowerCase().trim()},{
                name:order.shipping['receiver_address']['address_line'].trim().toLowerCase(),
                addressline1:order.shipping['receiver_address']['address_line'].trim().toLowerCase(),
                addressline2:order.shipping['receiver_address']['comment'].trim().toLowerCase(),
                country:city[0].region.country,
                region:city[0].region.id,
                city:city[0].id,
                notes:order.shipping['receiver_address']['comment'].trim().toLowerCase(),
                zipcode:order.shipping['receiver_address']['zip_code'],
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
                let productvariation = await ProductVariation.findOne({id:item['seller_sku']});
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
              }
              if((await CartProduct.count({cart:cart.id}))>0){
                //Verificar el Carrier Asignado el Pedido
                let corders = await sails.helpers.order({address:address,user:user,cart:cart,method:order.PaymentMethod,payment:payment,carrier:'servientrega'});
                await Order.updateOne({id:corders[0].id}).set({createdAt:moment(order['date_created']).valueOf()});
              }
              
            }
          }else{
            if(oexists!==undefined){
              let currentStatus = await sails.helpers.orderState(order.status);
              await Order.updateOne({id:oexists.id}).set({currentstatus:currentStatus});
              await OrderHistory.create({
                order:oexists.id,
                state:currentStatus
              });
            }
          }
        }
        return exits.success();
      });
    });
  }


};

