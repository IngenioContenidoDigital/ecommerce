module.exports = {
  friendlyName: 'Shopee Images',
  description: 'Images shopee.',
  inputs: {
    imageUrl:{
      type:'string',
      required:true
    },
    endpoint: {
      type:'string',
      required:true
    }
  },
  exits: {
    success: {
      description: 'All done.',
    },
    error: {
      description: 'Error.',
    },
  },
  fn: async function (inputs,exits) {
    let axios = require('axios');
    let FormData = require('form-data');
    try{
      let response = await axios.get(inputs.imageUrl,  {responseType: 'stream'});
      let data = new FormData();
      data.append('image', response.data);
      let config = {
        headers: {
          responseType: 'stream',
          ...data.getHeaders()
        }
      };
      let sign = await sails.helpers.channel.shopee.sign('/api/v2/media_space/upload_image');
      let resultShopee = await axios.post(`${inputs.endpoint}api/v2/media_space/upload_image?${sign}`,data,config);
      if (resultShopee.data && !resultShopee.data.error) {
        return exits.success(resultShopee.data.response.image_info.image_id);
      }
    }catch(err){
      console.log(err);
      return exits.error();
    }
  }
};

