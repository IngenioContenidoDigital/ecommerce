module.exports = {
    friendlyName: 'Orders',
    description: 'Orders coppel.',
    inputs: {
      integration:{
        type:'string',
        required:true
      }
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
       
      try{
         
        let integration = await Integrations.findOne({id: inputs.integration}).populate('channel');
        let axios = require('axios');  
        let result;
        
        let options = {
            method: 'get',
            url: `${integration.channel.endpoint}api/orders`,
            headers: {
                'Authorization':`${integration.key}`,
                accept: 'application/json'
            }
          }
        let response = await axios(options).catch((e) => {result=e.response; console.log(result);});

        let orders = response.data.orders;
        let profile = await Profile.findOne({name:'customer'});
        let moment = require('moment');
        let address={};
          
        if(response){
          for(let i=0; i<orders.length; i++){
            let order = orders[i];
            let oexists = await Order.findOne({channel:'coppel', channelref:order.order_id, integration: integration.id});
            if(order.order_state=="SHIPPED"){order.order_state = 'SHIPPING';};
            if(oexists===undefined && order.order_state==='WAITING_ACCEPTANCE'){
              let order_lines=[];
              for(let j=0; j<order.order_lines.length; j++){
                let obj={
                  "accepted": true,
                  "id": `${order.order_lines[j].order_line_id}`
                };
                order_lines.push(obj);
              }
              options = {
                method: 'put',
                url: `${integration.channel.endpoint}api/orders/${order.order_id}/accept`,
                headers: {
                    'Authorization':`${integration.key}`,
                    'content-type': 'application/json'
                },
                data:{
                  "order_lines":order_lines
                }
              };
              response = await axios(options).catch((e) => {result=e.response; console.log(result);});
            }
            if(oexists===undefined && order.order_state==='SHIPPING'){
              // let city = await City.find({name:'ciudad de mexico'}).populate('region');
              let city = await City.find({name:order.customer.shipping_address.city.trim().toLowerCase()}).populate('region');
              let country = await Country.find({name:order.customer.shipping_address.country.trim().toLowerCase()});
              
              let user = await User.findOrCreate({emailAddress:order.customer_notification_email},{
                emailAddress:order.customer_notification_email,
                emailStatus:'confirmed',
                password:await sails.helpers.passwords.hashPassword(order.customer.customer_id),
                fullName:order.customer.firstname+' '+order.customer.lastname,
                dniType:'CC',
                dni:order.customer.customer_id ? order.customer.customer_id.toString() : '',
                mobilecountry:city[0].region.country,
                mobile:0,
                mobileStatus:'unconfirmed',
                profile:profile.id
              });
              
              address = await Address.findOrCreate({addressline1:order.customer.shipping_address.street_1.trim().toLowerCase(),},{
                name: order.customer.shipping_address.street_1.trim().toLowerCase(),
                addressline1: order.customer.shipping_address.street_1.trim().toLowerCase(),
                addressline2: order.customer.shipping_address.street_2.trim().toLowerCase(),
                country: city[0].region.country,
                region: city[0].region.id,
                city: city[0].id,
                notes: order.customer.shipping_address.additional_info ? order.customer.shipping_address.additional_info.trim().toLowerCase() : '',
                zipcode: order.customer.shipping_address.zip_code ? order.customer.shipping_address.zip_code : '',
                user:user.id,
              });
              
              let payment = {
                data:{
                  estado:'Aceptado',
                  channel:'coppel',
                  channelref:order.order_id,
                  integration:integration.id
                }
              };
              
              let cart = await Cart.create().fetch();
              for(let item of order.order_lines){
                try{
                  for(let i=0; i<item.quantity; i++){
                    let productvariation = await ProductVariation.findOne({id:item.offer_sku});
                    if(productvariation){
                      await CartProduct.create({
                        cart:cart.id,
                        product:productvariation.product,
                        productvariation:productvariation.id,
                        totalDiscount:parseFloat(0),
                        totalPrice:parseFloat(order.total_price),
                        externalReference:item.offer_id
                      });
                    }
                  }
                }catch(err){
                  return exits.error(err.message);
                }
              }
              if((await CartProduct.count({cart:cart.id}))>0){
                let corders = await sails.helpers.order({address:address, user:user, cart:cart, method:order.payment_type, extra:order.paymentType, carrier:order.shipping_company?order.shipping_company:'coordinadora', payment:payment});
                await Order.updateOne({id:corders[0].id}).set({createdAt:parseInt(moment(order.created_date).valueOf())});
              }
            }else{
              if(oexists!==undefined){
                let currentStatus = await sails.helpers.orderState(order.order_state);
                await sails.helpers.notification(oexists, currentStatus);
                await Order.updateOne({id:oexists.id}).set({updatedAt:parseInt(moment(order.last_updated_date).valueOf()),currentstatus:currentStatus});
                await OrderHistory.create({
                  order:oexists.id,
                  state:currentStatus
                });
              }
            }
          }
          return exits.success();
        }else{
          return exits.error('Sin Ordenes para procesar');
        }
      }catch(err){
        console.log(err);
        return exits.error(err);
      }
    }
  };
  
  