module.exports = {
    friendlyName: 'Quality Check Walmart',
    description: 'Quality Check Walmart',
    inputs: {},
    exits: {
      success: {
        description: 'All done.',
      },
    },
    fn: async function (inputs, exits) {
        try{

            let axios = require('axios');
            let channel = await Channel.findOne({name:'walmart'}); 
            let product_channels = await ProductChannel.find({qc:false, channel:channel.id});
            
            const params = new URLSearchParams()
            params.append('grant_type', 'client_credentials');
            
            for(let i=0; i<product_channels.length; i++){

                let product_channel = product_channels[i];
                
                let integration = await Integrations.findOne({id: product_channel.integration}).populate('channel');
                let auth = `${integration.user}:${integration.key}`;
                const buferArray = Buffer.from(auth);
                let encodedAuth = buferArray.toString('base64');
                
                let token = await sails.helpers.channel.walmart.sign(integration);

                let options = {
                    method: 'get',
                    url: `${integration.channel.endpoint}/v3/feeds/${product_channel.channelid}`,
                    headers: {
                        'Authorization': `Basic ${encodedAuth}`,
                        'WM_SEC.ACCESS_TOKEN':token,               
                        'WM_MARKET' : 'mx',
                        'WM_SVC.NAME' : 'Walmart Marketplace',
                        'WM_QOS.CORRELATION_ID': '11111111',
                        accept: 'application/json'
                    }
                };
                let response = await axios(options).catch((e) => {console.log(e.response.data);});
                          
                if(response){
                    if (response.data.feedStatus === 'PROCESSED') {
                        await ProductChannel.updateOne({id:product_channel.id}).set({qc:true});
                    }
                }
            }
            return exits.success();
      
        }catch(err){
          return exits.error(err);
        }
    }
  };