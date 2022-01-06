module.exports = {
  friendlyName: 'Verify push notification',
  description: 'Verify push notification shopee.',
  inputs: {
    requestBody:{
      type:'ref',
      required:true
    },
    authorization: {
      type:'string',
      required:true
    },
    url: {
      type:'string',
      required:true
    }
  },
  exits: {
    success: {
      description: 'All done.',
    },
    error: {
      description: 'Error.',
    },
  },
  fn: async function (inputs, exits) {
    let crypto = require('crypto');
    try{
      let partnerKey = sails.config.custom.PARTNER_KEY_SHOPEE;
      let baseString = inputs.url + '|' + inputs.requestBody;
      let calAuth = crypto.createHmac('sha256', partnerKey).update(baseString).digest('hex');
      if (calAuth !== inputs.authorization) {
        return exits.success(false);
      } else {
        return exits.success(true);
      }
    }catch(err){
      console.log(err);
      return exits.success(false);
    }
  }
};

