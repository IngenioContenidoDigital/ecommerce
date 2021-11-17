module.exports = {
  friendlyName: 'Sign Request',
  description: 'Sign Request for Channel',
  inputs: {
    integration:{
      type:'string',
      required:true,
    },
    seller:{
      type:'string',
      required:true,
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
    let integration = await Integrations.findOne({id: inputs.integration});
    let params=[
      encodeURIComponent('partner_id')+'='+encodeURIComponent(''),
      encodeURIComponent('timestamp')+'='+encodeURIComponent(moment().toISOString(true))
    ];
    baseString = `${partner_id}${path}${moment().toISOString(true)}`;
    if(inputs.params!==undefined && inputs.params.length>0){
      for(let p of inputs.params){
        let d = p.split('=');
        d[0]=encodeURIComponent(d[0]);
        d[1]=encodeURIComponent(d[1]);
        d = d.join('=');
        params.push(d);
      }
    }
    params = params.sort();
    let hash = crypto.createHmac('sha256', partner_key).update(baseString).digest('hex');
    params.push(encodeURIComponent('sign')+'='+hash);
    return exits.success(params.join('&'));
  }
};

