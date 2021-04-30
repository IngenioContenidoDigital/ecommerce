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
    let productChannels = await ProductChannel.find({product: inputs.product.id});
    if (productChannels.length > 0) {
      for (const item of productChannels) {
        let integration = await Integrations.findOne({id: item.integration}).populate('channel');
        if (integration.channel.name === 'dafiti' && item.status) {
          let result = await sails.helpers.channel.dafiti.product([inputs.product], integration, item.price,undefined,false);
          const xml = jsonxml(result,true);
          let sign = await sails.helpers.channel.dafiti.sign(integration.id,'ProductUpdate',inputs.product.seller);
          await sails.helpers.request(integration.channel.endpoint,'/?'+sign,'POST',xml);
        }
        if (integration.channel.name === 'mercadolibre' && item.status && item.channelid !== '') {
          let mlstatus = item.status ? 'active' : 'paused';
          let body =  await sails.helpers.channel.mercadolibre.product(inputs.product.id, 'Update', integration.id, item.price, mlstatus)
          .tolerate(()=>{ return;});
          if(body){
            let integrat = await sails.helpers.channel.mercadolibre.sign(integration.id);
            await sails.helpers.channel.mercadolibre.request('items/'+item.channelid,integrat.secret,body,'PUT')
            .tolerate(()=>{return;});
          }
        }
        if (integration.channel.name === 'mercadolibremx' && item.status && item.channelid !== '') {
          let mlstatus = item.status ? 'active' : 'paused';
          let body =  await sails.helpers.channel.mercadolibremx.product(inputs.product.id, 'Update', integration.id, item.price, mlstatus)
          .tolerate(()=>{ return;});
          if(body){
            let integrat = await sails.helpers.channel.mercadolibremx.sign(integration.id);
            await sails.helpers.channel.mercadolibremx.request('items/'+item.channelid,integrat.secret,body,'PUT')
            .tolerate(()=>{return;});
          }
        }
        if (integration.channel.name === 'linio' && item.status) {
          let result = await sails.helpers.channel.linio.product([inputs.product], integration, item.price,undefined,false);
          const xml = jsonxml(result,true);
          let sign = await sails.helpers.channel.linio.sign(integration.id,'ProductUpdate',inputs.product.seller);
          await sails.helpers.request(integration.channel.endpoint,'/?'+sign,'POST',xml);
        }
        if (integration.channel.name === 'coppel' && item.status) {
          let axios = require('axios');
          let body = await sails.helpers.channel.coppel.product(inputs.product.id, 'Update', parseFloat(item.price), item.status)
          .intercept((err) => {return new Error(err.message);});
          options = {
            method: 'post',
            url: `${integration.channel.endpoint}api/offers`,
            headers: {
                'Authorization':`${integration.key}`,
                'content-type': `application/json`,
                accept: 'application/json'
            },
            data:body
          }
          let response_offer = await axios(options).catch((e) => {result=e.response, console.log(result);});
        }
      }
    }
  }
};

