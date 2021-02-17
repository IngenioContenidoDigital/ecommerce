
module.exports = {
  friendlyName: 'Send Notification',
  description: 'Envia notificacion al usuario',
  inputs: {
    seller: {
      type:'string',
      required: true
    },
    order: {
      type:'ref',
      required: true
    }
  },
  exits: {
    success: {
      description: 'All done.',
    },
  },
  fn: async function (inputs, exits) {
    let users = await User.find({seller: inputs.seller});
    let state = null;
    if(inputs.order.currentstatus.id){
      state = inputs.order.currentstatus;
    }else{
      state = await OrderState.findOne({id:inputs.order.currentstatus});
    }
    
    for (const user of users) {
      const country = await Country.findOne({id:user.mobilecountry});
      const userNotification = await UserNotification.findOne({user: user.id, state: state.id});
      if (userNotification && userNotification.sms) {
        await sails.helpers.sendSms('Te informamos que se ha cambio de estado (' + state.name.toUpperCase() + ') la orden #'+ inputs.order.reference +'. Por favor verificar la orden.',country.prefix+user.mobile);
      }
      if(userNotification && userNotification.email){
        await sails.helpers.sendEmail('email-notification',{state: state.name.toUpperCase(), order: inputs.order},user.emailAddress,'Cambio de Estado de un Pedido');
      }
    }
    return exits.success();
  }
};
