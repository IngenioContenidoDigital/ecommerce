module.exports = {
  friendlyName: 'File upload',
  description: 'Proceso de Carga Archivos a mercadolibre',
  inputs: {
    req:{type:'ref'},
    field: {type:'string'},
    size: {type:'number'},
    endpoint: {type:'string'},
    identifier: {type:'string'},
    secret: {type:'string'},
    type: {type:'string'}
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
  fn: async (inputs, exits) => {
    let axios = require('axios');
    let fs = require('fs');
    let FormData = require('form-data');
    inputs.req.file(inputs.field).upload({
      maxTimeToBuffer: 20000,
      maxBytes: inputs.size,
    },async function whenDone(err, uploadedFiles) {
      let files = [];
      if (err) {return exits.error(err);}
      if (uploadedFiles.length === 0){
        return exits.success(files);
      } else {
        for(let i=0; i<uploadedFiles.length; i++){
          const form = new FormData();
          form.append('file', fs.createReadStream(uploadedFiles[i].fd));
          const url = inputs.type === 'claim' ? `${inputs.endpoint}v1/claims/${inputs.identifier}/attachments` : `${inputs.endpoint}messages/attachments`;
          options = {
            method: 'post',
            url: url,
            headers: {
              'Authorization': `Bearer ${inputs.secret}`,
              'content-type': `multipart/form-data; boundary=${form._boundary}`,
              'accept': 'application/json'
            },
            data: form
          };
          let result = await axios(options).catch((e) => {exits.badRequest('Error en al subir las imagene');});
          if (result && inputs.type === 'claim' && result.data.filename) {
            files.push(result.data.filename);
          } else if(result && result.data.id){
            files.push(result.data.id);
          }
        }
        return exits.success(files);
      }
    });
  }
};
