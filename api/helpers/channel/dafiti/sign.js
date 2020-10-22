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
    let seller = await Seller.findOne({id:inputs.seller});
    let integration = await Integrations.findOne({channel:'dafiti',seller:seller.id});

    let params=[
      encodeURIComponent('Version')+'='+encodeURIComponent('1.0'),
      encodeURIComponent('UserID')+'='+encodeURIComponent(integration.user),
      encodeURIComponent('Action')+'='+encodeURIComponent(inputs.action),
      encodeURIComponent('Format')+'='+encodeURIComponent('JSON'),
      encodeURIComponent('Timestamp')+'='+encodeURIComponent(moment().toISOString(true))
    ];

    if(inputs.params.orderId){
      params.push(
        encodeURIComponent('OrderId')+'='+encodeURIComponent(inputs.params.orderId)
      )
    }

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
    let hash = crypto.createHmac('sha256',integration.key).update(params.join('&')).digest('hex');
    params.push(encodeURIComponent('Signature')+'='+hash);
    return exits.success(params.join('&'));
  }
};

