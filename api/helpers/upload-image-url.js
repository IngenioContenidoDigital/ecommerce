const axios = require('axios');
const AWS = require('aws-sdk');
const uuid = require('node-uuid');

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

      AWS.config.loadFromPath('./config.json');
      let s3bucket = new AWS.S3();
      

      let hash = uuid.v4();
      
      s3bucket.putObject({
          Bucket: `iridio.co/images/products/${inputs.product}`,
          Key: hash,
          Body: buffer,
          ContentLength : buffer.length,
          ACL: 'public-read'
      }, (err, data)=>{
        console.log("data", data);
        console.log("filename", hash);
        if(!err){
            return resolve({ filename :  `${hash}`});
        }

        reject(err);
      });
    });

  }

};

