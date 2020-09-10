module.exports = {
  friendlyName: 'Amazon upload',
  description: '',
  inputs: {
    params:{
     type:'ref',
     required:true 
    }
  },
  exits: {
    success: {
      description: 'All done.',
    },
  },
  fn: async function (inputs,exits) {
    let AWS = require('aws-sdk');
    AWS.config.loadFromPath('./config.json');
    let s3bucket = new AWS.S3();
    s3bucket.putObject(inputs.params,(err,result)=>{
      if(err){console.log(err); return exits.error(err);}
      console.log(result);
      return exits.success(result);
    });
  }
};

