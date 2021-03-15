module.exports = {
  friendlyName: 'Create whatsapp',
  description: 'Create whatsapp messenger people',
  inputs: {
    seller:{
      type:'string',
      required:true
    },
    channel:{
      type:'string',
      required:true
    },
    name: {
      type:'string',
      required:true
    },
    phonenumber: {
      type:'string',
      required:true
    },
    phonecc: {
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
      const seller = await Seller.findOne({id: inputs.seller});
      let integrations = await Integrations.find({seller: seller.id}).populate('channel');
      const integration = integrations.find(int => int.channel.type === 'messenger');
      let resultCustomer = null;
      if (!integration) {
        resultCustomer = await sails.helpers.channel.messenger.createCustomer(seller, inputs.channel, inputs.name);
      }
      if (integration || (resultCustomer && !resultCustomer.error)) {
        const clientId = resultCustomer ? resultCustomer.data.client.client_id : integration.key;
        const clientSecret = resultCustomer ? resultCustomer.data.client.client_secret : integration.secret;
        const token = await sails.helpers.channel.messenger.createToken(clientId, clientSecret, 'messenger:settings webhooks:create subscriptions:create crm:admin');
        const data = {
          'wb_display_name': inputs.name,
          'fb_business_manager_id': inputs.phonenumber,
          'terms_commerce_policy': true,
          'terms_business_policy': true,
          'terms_optin': true,
          'phone_cc': inputs.phonecc,
          'phone_number': inputs.phonenumber,
          'setup_contact_type': 'email',
          'setup_contact': seller.email
        };
        let options = {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          data,
          url: 'https://api.messengerpeople.dev/channels/whatsapp-business',
        };
        const response = await axios(options);
        if (response.data.uuid) {
          const uuidChannel = response.data.uuid;
          const integrat = resultCustomer ? resultCustomer.integration : integration;
          if (!integrat.user) {
            await Integrations.updateOne({id:integrat.id}).set({
              user: response.data.uuid,
              url: response.data.fb_business_manager_id
            });
            const resultWeb = await sails.helpers.channel.messenger.createWebhook(token,uuidChannel,seller.email,seller.name,seller.id);
            if (resultWeb.error) {
              return exits.success({error: resultWeb.error});
            }
          }
          return exits.success({});
        } else {
          return exits.success({error: response.data.error});
        }
      } else {
        return exits.success({error: 'No existe la integracion.'});
      }
    } catch (error) {
      console.log(error);
      return exits.success({error: 'Ocurrio un error al crear el canal.'});
    }
  }
};
