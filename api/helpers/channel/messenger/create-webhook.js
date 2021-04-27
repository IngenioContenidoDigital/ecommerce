module.exports = {
  friendlyName: 'Create whatsapp',
  description: 'Create whatsapp messenger people',
  inputs: {
    token:{
      type:'string',
      required:true
    },
    uuidChannel:{
      type:'string',
      required:true
    },
    email: {
      type:'string',
      required:true
    },
    name: {
      type:'string',
      required:true
    },
    sellerId: {
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
    }
  },
  fn: async function (inputs,exits) {
    const axios = require('axios');
    try {
      const data = {
        'name': 'Webhook '+inputs.name,
        'url': 'https://ecommercestaging.herokuapp.com/webhookmessenger/'+inputs.uuidChannel,
        'active': true,
        'secret': '',
        'verification_token': inputs.sellerId,
        'timestamp_format': 'iso_8601',
        'notification_recipients': [inputs.email],
        'status_messages': true
      };
      let options = {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'Authorization': `Bearer ${inputs.token}`
        },
        data,
        url: 'https://api.messengerpeople.dev/webhooks',
      };
      const response = await axios(options);
      if (response.data.uuid) {
        const uuidWebhook = response.data.uuid;
        const resultSubs = await sails.helpers.channel.messenger.createSubscription(inputs.token,inputs.uuidChannel,uuidWebhook);
        if (resultSubs.error) {
          return exits.success({error: resultSubs.error});
        }
        return exits.success({});
      } else {
        return exits.success({error: response.data.error});
      }
    } catch (error) {
      console.log(error);
      return exits.success({error: 'Ocurrio un error al crear el webhook.'});
    }
  }
};
