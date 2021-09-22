module.exports = {
  friendlyName: 'Send Notification Product',
  description: 'Envia notificacion al usuario de los productos',
  inputs: {
    product: {
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
    let seller = await Seller.findOne({id: inputs.product.seller});
    let users = await UserNotification.find({feature: 'productnew'}).populate('user');
    for (const userN of users) {
      const country = await Country.findOne({id: userN.user.mobilecountry});
      if (userN.sms) {
        const message = `Te informamos que se ha creado un nuevo producto (${inputs.product.name.toUpperCase()}) con referencia ${inputs.product.reference}. Por favor verificar el producto.`;
        await sails.helpers.sendSms(message, country.prefix+userN.user.mobile);
      }
      if(userN.email){
        await sails.helpers.sendEmail('email-product',{name: seller.name.toUpperCase(), product: inputs.product},userN.user.emailAddress,'Se creo un producto nuevo', 'email-notification');
      }
    }
    return exits.success();
  }
};
