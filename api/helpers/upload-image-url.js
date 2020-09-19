module.exports = {
  friendlyName: 'Upload image to aws bucket from given url',
  description: '',
  inputs: {
    url : { type:'string'},
    file : { type:'string'},
    product :  { type:'string'}
  },
  exits: {
    success: {
      description: 'All done.',
    },
    notFound:{
      description: 'Target not found',
    }
  },
  fn: async function (inputs,exits) {
    let AWS = require('aws-sdk');
    let axios = require('axios');
    AWS.config.loadFromPath('./config.json');

    let s3 = new AWS.S3();
      try{
        let response = await axios.get(inputs.url,  { responseType: 'arraybuffer' })
        if(response.status===200){
          let buffer = Buffer.from(response.data, "utf-8");
          s3.putObject({
            Bucket: 'iridio.co/images/products/'+inputs.product,
            Key: inputs.file,
            Body: buffer,
            ACL: 'public-read'
          }, (err, result)=>{
            if(err){return exits.error(err.message)};
              return exits.success(result);
            }
          );
        }else{
          return exits.error(new Error('Not Found'));
        }
      }catch(err){
        return exits.error(err.message);
      };
  }

};

