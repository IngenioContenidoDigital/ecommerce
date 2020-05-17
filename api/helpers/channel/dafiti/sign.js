module.exports = {
  friendlyName: 'Sign Request',
  description: 'Sign Request for Channel',
  inputs: {
    action:{
      type:'string',
      required:true,
    },
    seller:{
      type:'string',
      required:true,
    }
  },
  exits: {
    success: {
      description: 'All done.',
    },
  },
  fn: async function (inputs,exits) {
    let moment = require('moment');
    let crypto = require('crypto');
    let seller = await Seller.findOne({id:inputs.seller});
    let integration = await Integration.findOne({channel:'dafiti',seller:seller.id});
    let params=
      encodeURIComponent('Action')+'='+encodeURIComponent(inputs.action)+'&'+
      encodeURIComponent('Format')+'='+encodeURIComponent('JSON')+'&'+
      encodeURIComponent('Timestamp')+'='+encodeURIComponent(moment().toISOString())+'&'+
      encodeURIComponent('UserID')+'='+encodeURIComponent(integration.user)+'&'+
      encodeURIComponent('Version')+'='+encodeURIComponent('1.0');

    let hash = crypto.createHmac('sha256',integration.key).update(params).digest('hex');
    params=params+'&'+encodeURIComponent('Signature')+'='+hash;
    return exits.success(params);
  }
};

