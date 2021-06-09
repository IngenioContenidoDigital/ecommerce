module.exports = {
  friendlyName: 'Shipping',
  description: 'Shipping walmart.',
  inputs: {
    order:{
      type:'ref',
      required:true,
    }
  },
  exits: {
    success: {
      description: 'All done.',
    },
  },
  fn: async function (inputs,exits) {
    try{
      let axios = require('axios'); 
      let order = inputs.order;
      let integration = await Integrations.findOne({id: order.integration}).populate('channel');   
      let token = await sails.helpers.channel.walmart.sign(integration);

      let auth = `${integration.user}:${integration.key}`;
      const buferArray = Buffer.from(auth);
      let encodedAuth = buferArray.toString('base64');
      
      let options = {
        method: 'get',
        url: `${integration.channel.endpoint}/v3/orders/label/${order.tracking}`,
        headers: {
            accept: 'application/octet-stream',                
            'WM_MARKET' : 'mx',
            'WM_SEC.ACCESS_TOKEN':token,
            'WM_SVC.NAME' : 'Walmart Marketplace',
            'WM_QOS.CORRELATION_ID': '11111111',
            'Authorization': `Basic ${encodedAuth}`
        }
      };
      let response = await axios(options).catch((e) => {error=e; console.log(e);});
      if(response){
        let buffer = Buffer.from(response.data).toString('base64');
        return exits.success(buffer);
      }
    }catch(err){
      console.log(err);
      return exits.error('Guia No Localizada');
    }
  }
};
