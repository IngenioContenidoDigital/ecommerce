module.exports = {
  friendlyName: 'Delete Walmart',
  description: 'Delete Walmart.',
  inputs: {
    productvariations:{
      type:'ref',
      required:true,
    },    
    integration:{
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
    let axios = require('axios'); 
    let integration = inputs.integration; 
    let productvariations = inputs.productvariations; 
    let token = await sails.helpers.channel.walmart.sign(integration);

    let auth = `${integration.user}:${integration.key}`;
    const buferArray = Buffer.from(auth);
    let encodedAuth = buferArray.toString('base64');
    let response_retire ;
    let truth_flag=0;

      try{
        for (let index = 0; index < productvariations.length; index++) {
          const pv = productvariations[index];
          let options_retire = {
            method: 'delete',
            url: `${integration.channel.endpoint}/v3/items/${pv.id}`,
            headers: {
                'content-type': `application/xml`,
                accept: 'application/json',                
                'WM_MARKET' : 'mx',
                'WM_SEC.ACCESS_TOKEN':token,
                'WM_SVC.NAME' : 'Walmart Marketplace',
                'WM_QOS.CORRELATION_ID': '11111111',
                'Authorization': `Basic ${encodedAuth}`
            }
          }
          response_retire = await axios(options_retire).catch((e) => {error=e; console.log(e);}).then((result) => {
            if(!result.data.errors){
              truth_flag++;
            }
            return result;
          });
        }
        if(truth_flag === productvariations.length){
          return exits.success(response_retire.data);
        }else{
          throw new Error('Algunos items no fueron desactivados');
        }
      }catch(err){
        return exits.error(err);    
      }
  }
};