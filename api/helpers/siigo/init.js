module.exports = {
  friendlyName: 'Init',
  description: 'Init SIIGO.',
  inputs:{
  },
  exits: {
    success: {
      description: 'All done.',
    },
    error: {
      description: 'Error en el proceso',
    },
  },
  fn: async function (inputs, exits) {
    let axios = require('axios');
    try {
      let options = {
        method: 'post',
        url: `https://api.siigo.com/auth`,
        headers: {
          'Content-Type': 'application/json'
        },
        data: {'username': 'luis.quinones@1ecommerce.io', 'access_key': 'YTRlZGZmMmItMGU4NS00ZWQwLTllNmQtZDQzZGNmMjk3ZTQyOig/SzN1PU41X0g='}
      };
      let result = await axios(options);
      if(result.data && result.data.access_token){
        return exits.success(result.data.access_token);
      }
    } catch (error) {
      return exits.error(error.message);
    }
  }
};
