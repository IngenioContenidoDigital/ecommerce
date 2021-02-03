module.exports = {
    friendlyName: 'Orders',
    description: 'Orders muybacano.',
    inputs: {
      seller:{
        type:'string',
        required:true
      },
      secret: {
        type: 'string',
        required: true
      },
      orderinfo: {
        type: 'ref',
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
        let orderinfo = inputs.orderinfo[0];
        let channel = await Channel.findOne({name: 'muybacano'});
        let integration = await Integrations.find({seller: inputs.orderinfo[0].items[0].Seller, channel: channel.id});
        let profile = await Profile.findOne({name:'customer'});
        let oexists = await Order.findOne({channel: 'muybacano', channelref: orderinfo.marketplaceOrderId});
        let city = await City.find({name: orderinfo.shippingData.address.city.toLowerCase().trim()}).populate('region');
        if(city && oexists===undefined){
            let user = await User.findOrCreate({emailAddress : orderinfo.clientProfileData.email},{
                emailAddress:orderinfo.clientProfileData.email,
                emailStatus:'confirmed',
                password:await sails.helpers.passwords.hashPassword(orderinfo.clientProfileData.document),
                fullName:orderinfo.clientProfileData.firstName+' '+orderinfo.clientProfileData.lastName,
                dniType:'CC',
                dni:orderinfo.clientProfileData.document,
                mobilecountry:city[0].region.country,
                mobile:orderinfo.clientProfileData.phone,
                mobileStatus:'unconfirmed',
                profile:profile.id
            });
            let address = await Address.findOrCreate({ addressline1: (orderinfo.shippingData.address.street.trim().toLowerCase()+' '+(orderinfo.shippingData.address.number?orderinfo.shippingData.address.number.trim().toLowerCase():''))},{
                name: orderinfo.shippingData.address.street.trim().toLowerCase()+' '+(orderinfo.shippingData.address.number?orderinfo.shippingData.address.number.trim().toLowerCase():''),
                addressline1: orderinfo.shippingData.address.street.trim().toLowerCase()+' '+(orderinfo.shippingData.address.number?orderinfo.shippingData.address.number.trim().toLowerCase():''),
                addressline2: orderinfo.shippingData.address.complement ? orderinfo.shippingData.address.complement.trim().toLowerCase()+' '+orderinfo.shippingData.address.neighborhood.trim().toLowerCase() : orderinfo.shippingData.address.neighborhood ? orderinfo.shippingData.address.neighborhood.trim().toLowerCase():'',
                country: city[0].region.country,
                region: city[0].region.id,
                city: city[0].id,
                notes: orderinfo.shippingData.address.reference ? orderinfo.shippingData.address.reference.trim().toLowerCase() : '',
                zipcode: orderinfo.shippingData.address.postalCode ? orderinfo.shippingData.address.postalCode : '',
                user:user.id,
            });
            let payment = {
                data:{
                  estado:'Pendiente',
                  channel:'muybacano',
                  channelref: orderinfo.marketplaceOrderId,
                  method:'',
                  ref_payco:'',
                  integration:integration[0].id
                }
              };
            let cart = await Cart.create().fetch();
            for(let item of orderinfo.items){
                try{
                  let productvariation = await ProductVariation.findOne({id:item.id});
                  if(productvariation){
                    await CartProduct.create({
                        cart:cart.id,
                        product:productvariation.product,
                        productvariation:productvariation.id,
                        totalDiscount:parseFloat(0),
                        totalPrice:parseFloat(item.price),
                        externalReference:''
                    });
                  }
                }catch(err){
                  return exits.error(err.message);
                }
              }

            let corders = await sails.helpers.order({address:address, user:user, cart:cart, method:'', payment:payment, carrier:'servientrega'});

            let response = inputs.orderinfo;
            delete response[0].marketplaceServicesEndpoint;
            delete response[0].marketplacePaymentValue;
            for(let item of response[0].items){
                delete item.itemAttachment;
                delete item.attachments;
            }
            delete response[0].openTextField;
            delete response[0].marketingData;
            response[0].orderId=corders[0].id;
            response[0].followUpEmail=corders[0].seller.email;

          return exits.success(response);
        }else{
          return exits.error('Orden ya existe');
        }
    }
  };
  
  