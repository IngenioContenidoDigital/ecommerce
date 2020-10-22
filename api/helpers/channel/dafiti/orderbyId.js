module.exports = {
    friendlyName: 'Orders by Id',
    description: 'Orders  by Id dafiti.',
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
      let moment = require('moment');
      console.log(inputs);
      
      let sign = await sails.helpers.channel.dafiti.sign('GetOrder',inputs.seller, inputs.params);
      console.log("sign", sign);

      let profile = await Profile.findOne({name:'customer'});

      console.log("profile", profile);

      await sails.helpers.request('https://sellercenter-api.dafiti.com.co','/?'+sign,'GET')
      .then(async (response)=>{
        let result = await JSON.parse(response);
        console.log("result", result);
        let orders = {
          Order:[]
        };
          orders['Order'].push(result.SuccessResponse.Body.Orders.Order);
          console.log("order", orders);
          for(let order of orders.Order){
            let oexists = await Order.findOne({channel:'dafiti',channelref:order.OrderId,seller:inputs.seller});
            console.log("order", order);
            if(order.Statuses.Status==='pending'){
              console.log("pending", order.Statuses);
              console.log("city", order.AddressShipping.City);
              let city = await City.find({name:order.AddressShipping.City.toLowerCase().trim()}).populate('region');
              console.log("city", city);

              if(city.length>0 && oexists===undefined){
                let user = await User.findOrCreate({emailAddress:order.AddressBilling.CustomerEmail},{
                  emailAddress:order.AddressBilling.CustomerEmail,
                  emailStatus:'confirmed',
                  password:await sails.helpers.passwords.hashPassword(order.NationalRegistrationNumber),
                  fullName:order.CustomerFirstName+' '+order.CustomerLastName,
                  dniType:'CC',
                  dni:order.NationalRegistrationNumber.replace(/\./gi,''),
                  mobilecountry:city[0].region.country,
                  mobile:order.AddressShipping.Phone2 ? parseInt(order.AddressShipping.Phone2) : 0,
                  mobileStatus:'unconfirmed',
                  profile:profile.id
                });

                console.log("user", user);
                
                let address = await Address.findOrCreate({addressline1:order.AddressShipping.Address1.toLowerCase().trim()},{
                  name:order.AddressShipping.Address1.trim().toLowerCase(),
                  addressline1:order.AddressShipping.Address1.trim().toLowerCase(),
                  addressline2:order.AddressShipping.Address2 ? order.AddressShipping.Address2.trim().toLowerCase() : '',
                  country:city[0].region.country,
                  region:city[0].region.id,
                  city:city[0].id,
                  notes:order.DeliveryInfo ? order.DeliveryInfo : '',
                  zipcode:order.AddressShipping.PostCode ? order.AddressShipping.PostCode : '',
                  user:user.id,
                });
                let payment = {
                  data:{
                    estado:'Aceptada',
                    channel:'dafiti',
                    channelref:order.OrderId
                  }
                };
                payment.data['ref_payco'] = order.OrderNumber;
                let cart = await Cart.create().fetch();
                let itemsign = await sails.helpers.channel.dafiti.sign('GetOrderItems',inputs.seller,['OrderId='+order.OrderId]);
                await sails.helpers.request('https://sellercenter-api.dafiti.com.co','/?'+itemsign,'GET')
                .then(async (result)=>{
                  let rs = JSON.parse(result);
                  console.log("rs", rs);
                  let items = {
                    OrderItem:[]
                  };
                  
                  items['OrderItem'].push(rs.SuccessResponse.Body.OrderItems.OrderItem);
                  
                  for(let item of items.OrderItem){
                    let productvariation = await ProductVariation.findOne({id:item.Sku})
                    .catch(err=>{
                      console.log(err.message);
                    });
                    console.log('item', item)
                    console.log('productvariation', productvariation)
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
                    let corders = await sails.helpers.order({address:address,user:user,cart:cart,method:order.PaymentMethod,payment:payment,carrier:'servientrega'});
                    console.log("corders", corders);
                    await Order.updateOne({id:corders[0].id}).set({createdAt:parseInt(moment(order.CreatedAt).valueOf())});
                  }
                });
              }
            }else{
              if(oexists!==undefined){
                let currentStatus = await sails.helpers.orderState(order.Statuses.Status);
                await Order.updateOne({id:oexists.id}).set({updatedAt:parseInt(moment(order.UpdatedAt).valueOf()),currentstatus:currentStatus});
                await OrderHistory.create({
                  order:oexists.id,
                  state:currentStatus
                });
              }
            }
          }
      }).catch((e)=>console.log("error", e));
      
      return exits.success(true);
    }
  };
  
  