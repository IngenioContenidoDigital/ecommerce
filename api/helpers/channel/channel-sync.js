const { exists } = require('grunt');

module.exports = {
  friendlyName: 'Channel sync',
  description: '',
  inputs: {
    product:{
      type:'ref',
      required:true
    }
  },
  exits: {
    success: {
      description: 'All done.',
    },
  },
  fn: async function (inputs) {
    let jsonxml = require('jsontoxml');
    if (inputs.product.dafiti) { 
      let result = await sails.helpers.channel.dafiti.product([inputs.product], inputs.product.dafitiprice);
      var xml = jsonxml(result,true);
      let sign = await sails.helpers.channel.dafiti.sign('ProductUpdate',inputs.product.seller);
      await sails.helpers.request('https://sellercenter-api.dafiti.com.co','/?'+sign,'POST',xml);
    }
    if (inputs.product.ml && inputs.product.mlid ) { 
      let mlstatus = inputs.product.mlstatus ? 'active' : 'paused';
      let body =  await sails.helpers.channel.mercadolibre.product(inputs.product.id, 'Update', inputs.product.mlprice,mlstatus)
      .tolerate(()=>{ return;});
      if(body){
        let integration = await sails.helpers.channel.mercadolibre.sign(inputs.product.seller);
        await sails.helpers.channel.mercadolibre.request('items/'+inputs.product.mlid+'?access_token='+integration.secret,body,'PUT')
        .tolerate(()=>{return;});
      }
    }
    if (inputs.product.linio) {
      let result = await sails.helpers.channel.linio.product([inputs.product], inputs.product.linioprice);
      var xml = jsonxml(result,true);
      let sign = await sails.helpers.channel.linio.sign('ProductUpdate',inputs.product.seller);
      await sails.helpers.request('https://sellercenter-api.linio.com.co','/?'+sign,'POST',xml); 
    }
  }
};

