module.exports = {
    friendlyName: 'Orders',
    description: 'Orders Walmart.',
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
        let moment = require('moment');
        let from = moment().subtract(5,'d').startOf('day').toISOString(); 
        let to = moment().endOf('day').toISOString();     
        let token = await sails.helpers.channel.walmart.sign(integration);
  
        let auth = `${integration.user}:${integration.key}`;
        const buferArray = Buffer.from(auth);
        let encodedAuth = buferArray.toString('base64');

        let options = {
          method: 'get',
          url: `${integration.channel.endpoint}/v3/orders?createdStartDate=${from}&createdEndDate=${to}`,
          headers: {
              accept: 'application/json',                
              'WM_MARKET' : 'mx',
              'WM_SEC.ACCESS_TOKEN':token,
              'WM_SVC.NAME' : 'Walmart Marketplace',
              'WM_QOS.CORRELATION_ID': '11111111',
              'Authorization': `Basic ${encodedAuth}`
          }
        };
        
        let response = await axios(options).catch((e) => {error=e; console.log(e);});

        let orders = response.data.order;
        let profile = await Profile.findOne({name:'customer'});
        let address={};
          
        if(response){
          for(let i=0; i<orders.length; i++){
            let order = orders[i];
            for(let j=0; j<order.orderLines.length; j++){
              let order_line = order.orderLines[j];
              order_line.id = order.purchaseOrderId + '-' + order_line.primeLineNumber;
              // order_line.orderLineStatus[j].status = 'Created';

              let oexists = await Order.findOne({channel :'walmart', channelref : order_line.id, integration : integration.id});
              if(oexists === undefined && order_line.orderLineStatus[j].status === 'Created'){
                if(order.shippingInfo.postalAddress.city === 'Ciudad de M?xico'){order.shippingInfo.postalAddress.city = 'Ciudad de Mexico'}
                let city = await City.find({name:order.shippingInfo.postalAddress.city.trim().toLowerCase()}).populate('region');
                
                let user = await User.findOrCreate({emailAddress:order.customerEmailId},{
                  emailAddress:order.customerEmailId,
                  emailStatus:'confirmed',
                  password:await sails.helpers.passwords.hashPassword(order.customerOrderId),
                  fullName:order.shippingInfo.postalAddress.name,
                  dniType:'CC',
                  dni:order.customerOrderId,
                  mobilecountry:city[0].region.country,
                  mobile:0,
                  mobileStatus:'unconfirmed',
                  profile:profile.id
                });
                
                address = await Address.findOrCreate({addressline1:order.shippingInfo.postalAddress.address1.trim().toLowerCase(),},{
                  name: order.shippingInfo.postalAddress.address1.trim().toLowerCase(),
                  addressline1: order.shippingInfo.postalAddress.address1.trim().toLowerCase(),
                  addressline2: order.shippingInfo.postalAddress.address2.trim().toLowerCase(),
                  country: city[0].region.country,
                  region: city[0].region.id,
                  city: city[0].id,
                  notes: '',
                  zipcode: order.shippingInfo.postalAddress.postalCode ? order.shippingInfo.postalAddress.postalCode : '',
                  user:user.id,
                });
                
                let payment = {
                  data:{
                    estado:'Aceptado',
                    channel:'walmart',
                    channelref:order_line.id,
                    integration:integration.id
                  }
                };
                // order_line.item.sku = '5fb7b7b605256f4f1910be57';
                let cart = await Cart.create().fetch();
                try{
                  
                  let price = parseFloat(order_line.item.unitPrice.amount);
                  let productvariation = await ProductVariation.findOne({id:order_line.item.sku});
                  for (let index = 0; index < order_line.charges.length; index++) {
                    const element = order_line.charges[index];
                    if(element.chargeAmount){
                      price = price + parseFloat(element.chargeAmount.amount);
                    }else if(element.chargeType === 'PRODUCT'){
                      for (let k = 0; k < element.length; k++) {
                        const elemento = element[k];
                        price = price + parseFloat(elemento.taxAmount);
                      }
                    }
                    
                  }
                  if(productvariation){
                    await CartProduct.create({
                      cart:cart.id,
                      product:productvariation.product,
                      productvariation:productvariation.id,
                      totalDiscount:parseFloat(0),
                      totalPrice:parseFloat(price),
                      externalReference:order_line.item.upc
                  // externalReference:order_line.item.ean
                    });
                  }
                }catch(err){
                  return exits.error(err.message);
                }
                if((await CartProduct.count({cart:cart.id}))>0){
                  let corders = await sails.helpers.order({address:address, user:user, cart:cart, method:order.paymentMethod, extra:order.paymentMethod, carrier:order.shipments[j].carrier ? order.shipments[j].carrier : 'coordinadora', payment:payment});
                  await Order.updateOne({id:corders[0].id}).set({createdAt:parseInt(moment(order.orderDate).valueOf())});
                }
              }else{
                if(oexists!==undefined){
                  let currentStatus = await sails.helpers.orderState(order_line.orderLineStatus[j].status.toLowerCase());
                  await Order.updateOne({id:oexists.id}).set({updatedAt:parseInt(moment(order_line.orderLineStatus[j].statusDate).valueOf()),currentstatus:currentStatus});
                  await OrderHistory.create({
                    order:oexists.id,
                    state:currentStatus
                  });
                  await sails.helpers.notification(oexists);
                }
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
  
  