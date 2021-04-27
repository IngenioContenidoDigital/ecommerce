module.exports = {
  friendlyName: 'Create customer',
  description: 'Create customer messenger people',
  inputs: {
    seller:{
      type:'ref',
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
      const token = await sails.helpers.channel.messenger.createToken('ab125ab264e6bde3f7a9920de9195d82', '84d4211eb05b9e63baa1e4efde7c1d8d', 'partner:users:manage');
      const seller = inputs.seller;
      let params=[
        encodeURIComponent('email')+'='+encodeURIComponent(seller.email),
        encodeURIComponent('password')+'='+encodeURIComponent(seller.dni+'1ecommerce'),
        encodeURIComponent('name')+'='+encodeURIComponent(seller.name.toUpperCase())
      ];
      const data = params.join('&');
      const options = {
        method: 'POST',
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
          'Authorization': `Bearer ${token}`
        },
        data,
        url: 'https://auth.messengerpeople.dev/api/partner/users',
      };
      const response = await axios(options);
      if (response.data.client) {
        const newIntegration = await Integrations.create({
          channel: inputs.channel,
          key: response.data.client.client_id,
          secret: response.data.client.client_secret,
          seller:seller.id,
          name: inputs.name
        }).fetch();
        return exits.success({data: response.data, integration: newIntegration});
      } else {
        return exits.success({error: response.data.error});
      }
    } catch (error) {
      console.log(error);
      return exits.success({error: 'Ocurrio un error al crear el customer.'});
    }
  }
};
