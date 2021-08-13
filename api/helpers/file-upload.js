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
  fn: async (inputs,exits) => {
    let files = [];
    inputs.req.file(inputs.field).upload({
      maxTimeToBuffer: 20000,
      maxBytes: inputs.size,
    },async function whenDone(err, uploadedFiles) {
      let files = [];
      if (err) {return exits.error(err);}
      if (uploadedFiles.length === 0){
        return exits.badRequest('No file was uploaded');
      } else {
        var params = {
          Bucket: 'iridio.co',
          ACL: 'public-read'
        };
        for(let i=0; i<uploadedFiles.length; i++){
          let filename = uploadedFiles[i].fd.split('/').pop();
          let data = await sails.helpers.fileReader(uploadedFiles[i].fd);
          params.Body=data;
          params.Key= inputs.route+'/'+filename;
          //params.ContentLength=uploadedFiles[i].size;
          await sails.helpers.amazonUpload(params);
          files.push({original:uploadedFiles[i].filename,filename:filename, type:uploadedFiles[i].type});
        };
        return exits.success(files);
      }
    });
  }
};

