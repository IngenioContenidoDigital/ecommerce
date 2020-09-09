module.exports = {
  friendlyName: 'File upload',
  description: 'Proceso de Carga de Archivos',
  inputs: {
    req:{type:'ref'},
    field: {type:'string'},
    size: {type:'number'},
    route:{type:'string'}
  },
  exits: {
    success: {
      description: 'All done.',
    },
    badRequest:{
      description: 'Error'
    },
    serverError:{
      description: 'Error de Proceso'
    }
  },
  fn: async function (inputs,exits) {
    let AWS = require('aws-sdk');
    let fs = require('fs');
    let uuid = require('node-uuid');
    AWS.config.loadFromPath('./config.json');
    let s3bucket = new AWS.S3();
    let hash = uuid.v4();
    let files = [];

    inputs.req.file(inputs.field).upload({
      maxTimeToBuffer: 20000,
      maxBytes: inputs.size,
      dirname: inputs.route
    },function whenDone(err, uploadedFiles) {
      if (err) {return exits.error(err);
      } else if (uploadedFiles.length === 0){
        return exits.badRequest('No file was uploaded');
      } else {
        let fileName = uploadedFiles[0].fd;
        let ext = fileName.split('.').pop();
        const key = hash + '.' + ext;
        fs.readFile(fileName, (err, data) => {
          if (err) {throw err;}
          var params = {
            Bucket: `iridio.co/${inputs.route}`,
            Key: key,
            Body: data,
            ContentLength: data.length,
            ACL: 'public-read'
          };
          s3bucket.putObject(params, (err, data) => {
            if (err) {return exits.error(err);}
            files.push({original: uploadedFiles[0].filename, filename: key});
            return exits.success(files);
          });
        });
      }
    });
  }
};

