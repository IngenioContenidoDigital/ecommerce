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
    let profile = await Profile.findOne({name:'customer'});
    await sails.helpers.request('https://sellercenter-api.dafiti.com.co','/?'+sign,'GET')
    .then(async (response)=>{
      let result = await JSON.parse(response);
      let orders = {
        Order:[]
      };
      if(result.SuccessResponse.Head.TotalCount>0){
        if(result.SuccessResponse.Body.Orders.Order.length>1){
          orders = result.SuccessResponse.Body.Orders;
        }else{
          orders['Order'].push(result.SuccessResponse.Body.Orders.Order);
        }
        for(let order of orders.Order){
          //console.log(JSON.stringify(order));
          let city = await City.find({name:order.AddressShipping.City.toLowerCase().trim()}).populate('region');

          if(city.length>0){
            let user = await User.findOrCreate({emailAddress:order.AddressBilling.CustomerEmail},{
              emailAddress:order.AddressBilling.CustomerEmail,
              emailStatus:'confirmed',
              password:await sails.helpers.passwords.hashPassword(order.NationalRegistrationNumber),
              fullName:order.CustomerFirstName+' '+order.CustomerLastName,
              dniType:'CC',
              dni:order.NationalRegistrationNumber,
              mobilecountry:city[0].region.country,
              mobile:order.AddressBilling.Phone2,
              mobileStatus:'unconfirmed',
              profile:profile.id
            });
            let address = await Address.findOrCreate({addressline1:order.AddressShipping.Address1.toLowerCase().trim()},{
              name:order.AddressShipping.Address1.trim().toLowerCase(),
              addressline1:order.AddressShipping.Address1.trim().toLowerCase(),
              addressline2:order.AddressShipping.Address2.trim().toLowerCase(),
              country:city[0].region.country,
              region:city[0].region.id,
              city:city[0].id,
              notes:order.DeliveryInfo,
              zipcode:order.AddressShipping.PostCode,
              user:user.id,
            });
            let payment = {
              data:{
                estado:'Aceptada',
                channel:'dafiti',
                channelref:order.OrderNumber
              }
            };
            payment.data['ref_payco'] = order.OrderNumber;
            let cart = await Cart.create().fetch();
            let itemsign = await sails.helpers.channel.dafiti.sign('GetOrderItems',inputs.seller,['OrderId='+order.OrderId]);
            await sails.helpers.request('https://sellercenter-api.dafiti.com.co','/?'+itemsign,'GET')
            .then(async (result)=>{
              let rs = JSON.parse(result);
              let items = {
                OrderItem:[]
              };
              if(rs.SuccessResponse.Body.OrderItems.OrderItem.length>1){
                items = rs.SuccessResponse.Body.OrderItems;
              }else{
                items['OrderItem'].push(rs.SuccessResponse.Body.OrderItems.OrderItem);
              }
              for(let item of items.OrderItem){
                let productvariation = await ProductVariation.findOne({id:item.Sku});
                //let productvariation = await ProductVariation.findOne({id:'5ef0c5ae4283b925e44c2c4f'});
                if(productvariation){
                  await CartProduct.create({
                    cart:cart.id,
                    product:productvariation.product,
                    productvariation:productvariation.id,
                    totalDiscount:parseFloat(item.VoucherAmount),
                    totalPrice:parseFloat(item.ItemPrice),
                    externalReference:item.OrderItemId
                  });
                }
              }
              if((await CartProduct.count({cart:cart.id}))>0){
                await sails.helpers.order({address:address,user:user,cart:cart,method:order.PaymentMethod,payment:payment,carrier:'servientrega'});
              }
            });
          }
        }
      }
    });
    return exits.success();
  }
};

