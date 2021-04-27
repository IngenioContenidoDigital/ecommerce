module.exports = {
  friendlyName: 'Create subscription',
  description: 'Create subscription messenger people',
  inputs: {
    token:{
      type:'string',
      required:true
    },
    uuidChannel:{
      type:'string',
      required:true
    },
    uuidWebhook: {
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
        'channel': inputs.uuidChannel,
        'webhook': inputs.uuidWebhook,
        'upload_target': null,
        'events': ['1','2','3']
      };
      let options = {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'Authorization': `Bearer ${inputs.token}`
        },
        data,
        url: 'https://api.messengerpeople.dev/subscription',
      };
      const response = await axios(options);
      if (response.data.uuid) {
        return exits.success({});
      } else {
        return exits.success({error: response.data.error});
      }
    } catch (error) {
      console.log(error);
      return exits.success({error: 'Ocurrio un error al crear la subscription.'});
    }
  }
};
