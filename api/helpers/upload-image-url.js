const axios = require('axios');
const AWS = require('aws-sdk');

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

  },


  fn: async function (inputs) {
    return new Promise(async (resolve, reject)=>{
      const response = await axios.get(inputs.url,  { responseType: 'arraybuffer' });
      const buffer = Buffer.from(response.data, "utf-8");

      let s3bucket = new AWS.S3({
        accessKeyId: 'AKIATQT7MH3O4B4COYDV',
        secretAccessKey: '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'
      });

      s3bucket.putObject({
          Bucket: `iridio.co/images/products/${inputs.product}`,
          Key: inputs.file.trim(),
          Body: buffer,
          ContentLength : buffer.length,
          ACL: 'public-read'
      }, (err, data)=>{
        if(!err){
            return resolve({ filename :  `${inputs.file.trim()}`});
        }

        reject(err);
      });
    });

  }

};

