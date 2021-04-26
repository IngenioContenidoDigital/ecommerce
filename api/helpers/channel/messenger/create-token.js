module.exports = {
  friendlyName: 'Create token',
  description: 'Create token messenger people',
  inputs: {
    clientId:{
      type:'string',
      required:true
    },
    clientSecret:{
      type:'string',
      required:true
    },
    scope:{
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
      let params=[
        encodeURIComponent('grant_type')+'='+encodeURIComponent('client_credentials'),
        encodeURIComponent('client_id')+'='+encodeURIComponent(inputs.clientId),
        encodeURIComponent('client_secret')+'='+encodeURIComponent(inputs.clientSecret),
        encodeURIComponent('scope')+'='+encodeURIComponent(inputs.scope),
      ];
      const data = params.join('&');
      const options = {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        data,
        url: 'https://auth.messengerpeople.dev/token',
      };
      const response = await axios(options);
      if (response.data.access_token) {
        return exits.success(response.data.access_token);
      }else {
        return exits.error(response.data.error);
      }
    } catch (error) {
      return exits.error(error.message);
    }
  }
};
