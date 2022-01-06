module.exports = {
  friendlyName: 'Sign Request',
  description: 'Sign Request for Channel',
  inputs: {
    path: {
      type: 'string',
      required:true
    },
    params:{
      type:'ref'
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
    let partner_id = sails.config.custom.PARTNER_ID_SHOPEE;
    let partner_key = sails.config.custom.PARTNER_KEY_SHOPEE;
    let path = inputs.path;
    let shopId = '';
    let accessToken = '';
    let params=[
      encodeURIComponent('partner_id')+'='+encodeURIComponent(partner_id),
      encodeURIComponent('timestamp')+'='+encodeURIComponent(moment().unix())
    ];
    if(inputs.params!==undefined && inputs.params.length>0){
      for(let p of inputs.params){
        let d = p.split('=');
        if (d[0] === 'access_token') {
          accessToken = d[1];
        }
        if (d[0] === 'shop_id') {
          shopId = d[1];
        }
        d[0]=encodeURIComponent(d[0]);
        d[1]=encodeURIComponent(d[1]);
        d = d.join('=');
        params.push(d);
      }
    }
    let baseString = accessToken && shopId ? `${partner_id}${path}${moment().unix()}${accessToken}${shopId}` : `${partner_id}${path}${moment().unix()}`;

    let hash = crypto.createHmac('sha256', partner_key).update(baseString).digest('hex');
    params.push(encodeURIComponent('sign')+'='+hash);
    return exits.success(params.join('&'));
  }
};

