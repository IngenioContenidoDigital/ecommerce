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
    let files = [];
    inputs.req.file(inputs.field).upload({
      adapter: require('skipper-s3'),
      key: 'AKIATQT7MH3O4B4COYDV',
      secret: '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',
      bucket: 'iridio.co',
      headers: {
        'x-amz-acl': 'public-read'
      },
      maxBytes: inputs.size,
      dirname: inputs.route
    },function whenDone(err, uploadedFiles) {
      if (err) {return exits.error(err);
      }else if (uploadedFiles.length === 0){
        return exits.badRequest('No file was uploaded');
      }else{
        for(let i=0; i<uploadedFiles.length; i++){
          let filename = uploadedFiles[i].fd.split('/').pop();
          files.push({original:uploadedFiles[i].filename,filename:filename});
        }
        return exits.success(files);
      }
      //var baseUrl = sails.config.custom.baseUrl;
    });
  }


};

