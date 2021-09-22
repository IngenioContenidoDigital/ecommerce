
module.exports = {
  friendlyName: 'Send Notification',
  description: 'Envia notificacion al usuario',
  inputs: {
    order: {
      type:'ref',
      required: true
    },
    state: {
      type:'string',
      required: true
    }
  },
  exits: {
    success: {
      description: 'All done.',
    },
  },
  fn: async function (inputs, exits) {
    let users = null;
    let state = null;
    let orderState = await OrderState.findOne({name: 'aceptado'});
    if(inputs.order.seller.id){
      users = await User.find({seller: inputs.order.seller.id});
    }else{
      users = await User.find({seller: inputs.order.seller});
    }

    if(inputs.order.currentstatus.id){
      state = inputs.order.currentstatus;
    }else{
      state = await OrderState.findOne({id:inputs.order.currentstatus});
    }
    if (state.id !== inputs.state || inputs.state === orderState.id) {
      for (const user of users) {
        state = await OrderState.findOne({id:inputs.state});
        const country = await Country.findOne({id:user.mobilecountry});
        const userNotification = await UserNotification.findOne({user: user.id, state: inputs.state});
        if (userNotification && userNotification.sms) {
          await sails.helpers.sendSms('Te informamos que se ha cambio de estado (' + state.name.toUpperCase() + ') la orden #'+ inputs.order.reference +'. Por favor verificar la orden.',country.prefix+user.mobile);
        }
        if(userNotification && userNotification.email){
          await sails.helpers.sendEmail('email-notification',{state: state.name.toUpperCase(), order: inputs.order},user.emailAddress,'Cambio de Estado de un Pedido', 'email-notification');
        }
      }
    }
    return exits.success();
  }
};
