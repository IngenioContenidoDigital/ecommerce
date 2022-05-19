let queue = require('queue');

let objectQueue = queue({
  timeout: 30000,
  concurrency: 1,
  autostart: true
});

objectQueue.on('start', async (result) => {
  let jsonxml = require('jsontoxml');
  let productResult = result.data.product;
  let productChannels = await ProductChannel.find({product: productResult.id});
  if (productChannels.length > 0) {
    for (const item of productChannels) {
      let integration = await Integrations.findOne({id: item.integration}).populate('channel');
      if (integration.channel.name === 'dafiti' && item.status && productResult.delete === false) {
        let result = await sails.helpers.channel.dafiti.product([productResult], integration, item.price,undefined,false);
        const xml = jsonxml(result,true);
        let sign = await sails.helpers.channel.dafiti.sign(integration.id,'ProductUpdate',productResult.seller);
        await sails.helpers.request(integration.channel.endpoint,'/?'+sign,'POST',xml);
      }
      if (integration.channel.name === 'mercadolibre' && item.status && item.channelid !== '' && productResult.delete === false) {
        let mlstatus = item.status ? 'active' : 'paused';
        let body =  await sails.helpers.channel.mercadolibre.product(productResult.id, 'Update', integration.id, item.price, mlstatus)
          .tolerate(()=>{ return;});
        if(body){
          let integrat = await sails.helpers.channel.mercadolibre.sign(integration.id);
          await sails.helpers.channel.mercadolibre.request('items/'+item.channelid,integrat.secret,body,'PUT')
            .tolerate(()=>{return;});
        }
      }
      if (integration.channel.name === 'linio' && item.status && productResult.delete === false) {
        let result = await sails.helpers.channel.linio.product([productResult], integration, item.price,undefined,false);
        const xml = jsonxml(result,true);
        let sign = await sails.helpers.channel.linio.sign(integration.id,'ProductUpdate',productResult.seller);
        await sails.helpers.request(integration.channel.endpoint,'/?'+sign,'POST',xml);
      }
    }
  }
});

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
    objectQueue.push(await sails.helpers.makeJob({product: inputs.product}));
  }
};

