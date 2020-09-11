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
      try {
          let response = await axios.get(inputs.url,  { responseType: 'arraybuffer' }).catch((e)=>resolve());
          if(!response || !response.data){
            return resolve();
          }

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
            if(!err){
              console.log("Uploaded new image with key : ", `${hash}`);
                return resolve({ filename :  `${hash}`});
            }
          });
      } catch (error) {
        if(error){
          console.log(error);
        }
        console.log(`ERROR GETTING IMAGE BINARI: ${error.message}`);
        resolve();
      }
    });
  }

};

