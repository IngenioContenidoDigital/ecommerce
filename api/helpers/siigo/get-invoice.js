module.exports = {
  friendlyName: 'get invoice',
  description: 'get invoice SIIGO',
  inputs: {
    idSiigo:{
      type: 'string',
      required:true
    }
  },
  exits: {
    success: {
      description: 'All done.',
    },
    error: {
      description: 'All done.',
    },
  },
  fn: async function (inputs, exits) {
    let axios = require('axios');
    try {
      let accessToken = await sails.helpers.siigo.init();
      let options = {
        method: 'get',
        url: `https://api.siigo.com/v1/invoices/${inputs.idSiigo}/pdf`,
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      };
      let result = await axios(options);
      if (result.data && result.data.id) {
        return exits.success(result.data.base64);
      } else {
        return exits.success('');
      }
    } catch (error) {
      console.log(error);
      return exits.success('');
    }
  }
};
