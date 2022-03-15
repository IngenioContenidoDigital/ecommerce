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
      if (integration.channel.name === 'mercadolibremx' && item.status && item.channelid !== '' && productResult.delete === false) {
        let mlstatus = item.status ? 'active' : 'paused';
        let body =  await sails.helpers.channel.mercadolibremx.product(productResult.id, 'Update', integration.id, item.price, mlstatus)
          .tolerate(()=>{ return;});
        if(body){
          let integrat = await sails.helpers.channel.mercadolibremx.sign(integration.id);
          await sails.helpers.channel.mercadolibremx.request('items/'+item.channelid,integrat.secret,body,'PUT')
            .tolerate(()=>{return;});
        }
      }
      if (integration.channel.name === 'linio' && item.status && productResult.delete === false) {
        let result = await sails.helpers.channel.linio.product([productResult], integration, item.price,undefined,false);
        const xml = jsonxml(result,true);
        let sign = await sails.helpers.channel.linio.sign(integration.id,'ProductUpdate',productResult.seller);
        await sails.helpers.request(integration.channel.endpoint,'/?'+sign,'POST',xml);
      }
      if (integration.channel.name === 'liniomx' && item.status && productResult.delete === false) {
        let result = await sails.helpers.channel.liniomx.product([productResult], integration, item.price,undefined,false);
        const xml = jsonxml(result,true);
        let sign = await sails.helpers.channel.liniomx.sign(integration.id,'ProductUpdate',productResult.seller);
        await sails.helpers.request(integration.channel.endpoint,'/?'+sign,'POST',xml);
      }
      if (integration.channel.name === 'coppel' && item.status && productResult.delete === false) {
        let axios = require('axios');
        let body = await sails.helpers.channel.coppel.product(productResult.id, 'Update', parseFloat(item.price), item.status)
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
        };
        let response_offer = await axios(options).catch((e) => {result=e.response, console.log(result);});
      }
      if (integration.channel.name === 'walmart' && item.status && productResult.delete === false)  {
        let axios = require('axios');
        let product = await Product.findOne({ id: productResult.id }).populate('channels');
        try {
          let xml = await sails.helpers.channel.walmart.product([product], parseFloat(item.price), parseFloat(item.price), 'ProductUpdate', integration.channel.id);
          const buffer_xml = Buffer.from(xml,'latin1');
          let token = await sails.helpers.channel.walmart.sign(integration);
          let auth = `${integration.user}:${integration.key}`;
          const buferArray = Buffer.from(auth);
          let encodedAuth = buferArray.toString('base64');

          let options = {
            method: 'post',
            url: `${integration.channel.endpoint}/v3/feeds?feedType=item`,
            headers: {
              'content-type': `application/xml`,
              accept: 'application/json',
              'WM_MARKET' : 'mx',
              'WM_SEC.ACCESS_TOKEN':token,
              'WM_SVC.NAME' : 'Walmart Marketplace',
              'WM_QOS.CORRELATION_ID': '11111111',
              'Authorization': `Basic ${encodedAuth}`
            },
            data:buffer_xml
          };
          await axios(options).catch((e) => {error=e; console.log(e);});

        } catch (err) {
          console.log(err);
          return res.send(err.message);
        }

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

