module.exports = {
  friendlyName: 'Orders',
  description: 'Changed status orders mercadolibre.',
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
  fn: async function (inputs, exits) {
    let integration = await sails.helpers.channel.mercadolibre.sign(inputs.integration);
    let moment = require('moment');
    let result = await sails.helpers.channel.mercadolibre.findUser(integration.secret).catch(err =>{return exits.error(err.message);});
    const shippingId = inputs.resource.split('/')[2];
    if(result.id){
      let shipping = await sails.helpers.channel.mercadolibre.findShipments(integration.secret, shippingId, integration.channel.endpoint).catch(err=>{
        return exits.error(err.message);
      });
      if (shipping){
        try{
          let oexists = await Order.find({channel:'mercadolibre',channelref: shipping.order_id,integration: integration.id});
          if(oexists.length > 0){
            let currentStatus = await sails.helpers.orderState(shipping.status);
            for (const ord of oexists) {
              const trackingMethod = shipping.tracking_method ? shipping.tracking_method.split(' ')[0] : '';
              let carrier = await Carrier.findOne({name: trackingMethod ? trackingMethod.trim().toLowerCase():''});
              await sails.helpers.notification(ord, currentStatus);
              await Order.updateOne({id:ord.id}).set({updatedAt:parseInt(moment(shipping.last_updated).valueOf()),currentstatus:currentStatus,carrier: carrier ? carrier.id : ord.carrier});
              await OrderHistory.create({
                order:ord.id,
                state:currentStatus
              });
            }
          }
        }catch(err){
          return exits.error(err);
        }
        return exits.success();
      }else{
        return exits.error('No existe el envio');
      }
    }
  }
};
