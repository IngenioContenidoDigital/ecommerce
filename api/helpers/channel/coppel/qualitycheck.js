module.exports = {
    friendlyName: 'Shipping',
    description: 'Shipping coppel.',
    inputs: {
    },
    exits: {
      success: {
        description: 'All done.',
      },
      error:{
        description: 'Error'
      },
    },
    fn: async function (inputs,exits) {
       try{
          
          let axios = require('axios');
          let channel = await Channel.findOne({name:'coppel'}); 
          let product_channels = await ProductChannel.find({qc:false, channel:channel.id}).populate('integration');
          
          for(let i=0; i<product_channels.length; i++){
            let product_channel = product_channels[i];
            let options = {
                method: 'get',
                url: `${channel.endpoint}api/products/imports/${product_channel.channelid}`,
                headers: {
                    'Authorization':`${product_channel.integration.key}`,
                    accept: 'application/json'
                }
            };
            let response = await axios(options).catch((e) => {result=e.response; console.log(result);});
            
            if(response){
                if(!response.data.has_error_report){
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
  
  