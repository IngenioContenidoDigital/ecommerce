module.exports = {
  friendlyName: 'Orders',
  description: 'Orders linio.',
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
    let sign = await sails.helpers.channel.linio.sign('GetOrders', inputs.seller, inputs.params);
    let profile = await Profile.findOne({name: 'customer'});
    await sails.helpers.request('https://sellercenter-api.linio.com.co','/?'+ sign, 'GET')
    .then(async (response)=>{
      let result = await JSON.parse(response);
      let orders = {
        Order:[]
      };
      if(result.SuccessResponse.Head.TotalCount > 0){
        if(result.SuccessResponse.Body.Orders.Order.length > 1){
          orders = result.SuccessResponse.Body.Orders;
        }else{
          orders['Order'].push(result.SuccessResponse.Body.Orders.Order);
        }
        for(let order of orders.Order){
          let oexists = await Order.findOne({channel: 'linio', channelref: order.OrderId});
          if(order.Statuses.Status === 'pending'){
            let city = await City.find({name:(order.AddressShipping.City.split(','))[0].toLowerCase().trim()}).populate('region');
            if(city.length > 0 && oexists === undefined){
              const customerEmail = order.AddressBilling.CustomerEmail || order.CustomerFirstName.replace(' ', '') + order.CustomerLastName.replace(' ', '') + '@linio.com.co';
              let user = await User.findOrCreate({emailAddress: customerEmail},{
                emailAddress: customerEmail,
                emailStatus: 'confirmed',
                password: await sails.helpers.passwords.hashPassword(order.NationalRegistrationNumber),
                fullName: order.CustomerFirstName+' '+order.CustomerLastName,
                dniType: 'CC',
                dni: order.NationalRegistrationNumber,
                mobilecountry: city[0].region.country,
                mobile: order.AddressShipping.Phone2 !== '' ? parseInt(order.AddressShipping.Phone2) : 0,
                mobileStatus: 'unconfirmed',
                profile: profile.id
              });
              let address = await Address.findOrCreate({addressline1: order.AddressShipping.Address1.toLowerCase().trim()},{
                name: order.AddressShipping.Address1.trim().toLowerCase(),
                addressline1: order.AddressShipping.Address1.trim().toLowerCase(),
                addressline2: order.AddressShipping.Address2.trim().toLowerCase(),
                country: city[0].region.country,
                region: city[0].region.id,
                city: city[0].id,
                notes: order.DeliveryInfo,
                zipcode: order.AddressShipping.PostCode,
                user: user.id,
              });
              let payment = {
                data:{
                  estado: 'Aceptada',
                  channel: 'linio',
                  channelref: order.OrderId
                }
              };
              payment.data['ref_payco'] = order.OrderNumber;
              let cart = await Cart.create().fetch();
              let itemsign = await sails.helpers.channel.linio.sign('GetOrderItems', inputs.seller,['OrderId='+order.OrderId]);
              await sails.helpers.request('https://sellercenter-api.linio.com.co','/?'+ itemsign, 'GET')
              .then(async (result)=>{
                let rs = JSON.parse(result);
                let items = {
                  OrderItem: []
                };
                if(rs.SuccessResponse.Body.OrderItems.OrderItem.length > 1){
                  items = rs.SuccessResponse.Body.OrderItems;
                }else{
                  items['OrderItem'].push(rs.SuccessResponse.Body.OrderItems.OrderItem);
                }
                let carrier = null;
                for(let item of items.OrderItem){
                  carrier = item.ShipmentProvider ? item.ShipmentProvider : null;
                  let productvariation = await ProductVariation.find({or : [
                    { id:item.Sku },
                    { reference: item.Sku }
                  ]});
                  if(productvariation){
                    await CartProduct.create({
                      cart: cart.id,
                      product: productvariation[0].product,
                      productvariation: productvariation[0].id,
                      totalDiscount: parseFloat(item.VoucherAmount),
                      totalPrice: parseFloat(item.ItemPrice),
                      externalReference: item.OrderItemId
                    });
                  }
                }
                if((await CartProduct.count({cart: cart.id})) > 0){
                  if(carrier===null){carrier='servientrega';}
                  let corders = await sails.helpers.order({address: address, user: user, cart: cart, method: order.PaymentMethod, payment: payment, carrier: carrier});
                  await Order.updateOne({id: corders[0].id}).set({createdAt: parseInt(moment(order.CreatedAt).valueOf())});
                }
              });
            }
          } else {
            if(oexists !== undefined){
              let currentStatus = await sails.helpers.orderState(order.Statuses.Status);
              await Order.updateOne({id: oexists.id}).set({updatedAt: parseInt(moment(order.UpdatedAt).valueOf()), currentstatus: currentStatus});
              await OrderHistory.create({
                order: oexists.id,
                state: currentStatus
              });
            }
          }
        }
      }
    });
    return exits.success();
  }
};
