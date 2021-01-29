module.exports = {
  friendlyName: 'Orders',
  description: 'Changed status orders mercadolibre.',
  inputs: {
    order:{
      type: 'ref',
      required: true
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
  fn: async function (inputs, exits) {
    let moment = require('moment');
    const order = inputs.order;
    if (order.integration) {
      let integration = await sails.helpers.channel.mercadolibre.sign(order.integration);
      let result = await sails.helpers.channel.mercadolibre.findUser(integration.secret).catch(err =>{return exits.error(err.message);});

      if(result.id){
        if(order.tracking){
          let shipping = await sails.helpers.channel.mercadolibre.findShipments(integration.secret, order.tracking,integration.channel.endpoint).catch(err=>{
            return exits.error(err.message);
          });
          if (shipping){
            try{
              let currentStatus = await sails.helpers.orderState(shipping.status);
              await Order.updateOne({id:order.id}).set({updatedAt:parseInt(moment(shipping.last_updated).valueOf()),currentstatus:currentStatus});
              await OrderHistory.create({
                order:order.id,
                state:currentStatus
              });
            }catch(err){
              return exits.error(err);
            }
            return exits.success();
          }else{
            return exits.error('No existe el envio');
          }
        } else {
          return exits.error('la orden no tiene asocido el envio');
        }
      }
    }
  }
};
