module.exports = {
  friendlyName: 'Orders',
  description: 'Orders dafiti.',
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
    let sign = await sails.helpers.channel.dafiti.sign('GetOrders',inputs.seller,inputs.params);
    let seller = await Seller.findOne({id:inputs.seller});
    let profile = await Profile.findOne({name:'customer'});
    await sails.helpers.request('https://sellercenter-api.dafiti.com.co','/?'+sign,'GET')
    .then(async (response)=>{
      let orders = JSON.parse(response);
      for(let order of orders.SuccessResponse.Body.Orders.Order){
        let city = await City.findOne({name:order.AddressBilling.City.toLowerCase().trim()}).populate('region');
        if(city!==undefined){
          let user = await User.findOrCreate({emailAddress:order.AddressBilling.CustomerEmail},{
            emailAddress:order.AddressBilling.CustomerEmail,
            emailStatus:'confirmed',
            password:await sails.helpers.passwords.hashPassword(order.NationalRegistrationNumber),
            fullName:order.Firstname+' '+order.LastName,
            dniType:'CC',
            dni:order.NationalRegistrationNumber,
            mobilecountry:city.region.country,
            mobile:order.AddressBilling.Phone2,
            mobileStatus:'unconfirmed',
            profile:profile.id
          });
          let address = await Address.findOrCreate({addressline1:order.AddressShipping.Address1.toLowerCase().trim()},{
            name:order.AddressShipping.Address1.trim().toLowerCase(),
            addressline1:order.AddressShipping.Address1.trim().toLowerCase(),
            addressline2:order.AddressShipping.Address2.trim().toLowerCase(),
            country:city.country,
            region:city.region.id,
            city:city.id,
            notes:order.DeliveryInfo,
            zipcode:order.AddressShipping.PostCode,
            user:user.id,
          });
          let payment = {
            data:{
              // eslint-disable-next-line camelcase
              ref_payco:order.OrderNumber,
              estado:'Aceptada',
              channel:'dafiti',
              channelref:order.OrderNumber
            }
          };
          let cart = await Cart.create().fetch();
          let itemsign = await sails.helpers.channel.dafiti.sign('GetOrderItems',seller.id,['OrderId='+order.OrderId]);
          await sails.helpers.request('https://sellercenter-api.dafiti.com.co','/?'+itemsign,'GET')
          .then(async (result)=>{
            let items = JSON.parse(result);
            for(let i in items.SuccessResponse.Body.OrderItems){
              //console.log(items.SuccessResponse.Body.OrderItems[i]);
              let productvariation = await ProductVariation.findOne({id:items.SuccessResponse.Body.OrderItems[i].Sku});
              await CartProduct.create({
                cart:cart.id,
                product:productvariation.product,
                productvariation:productvariation.id,
                totalDiscount:items.SuccessResponse.Body.OrderItems[i].VoucherAmount.toFixed(),
                totalPrice:items.SuccessResponse.Body.OrderItems[i].ItemPrice.toFixed(),
                externalReference:items.SuccessResponse.Body.OrderItems[i].OrderItemId
              });
            }
          });
          await sails.helpers.order({address:address,user:user,cart:cart,method:order.PaymentMethod,payment:payment,carrier:'servientrega'});
        }
      }
    });
    return exits.success();
  }
};

