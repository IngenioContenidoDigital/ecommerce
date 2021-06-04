module.exports = {
  friendlyName: 'Convert Excel',
  description: 'Convertir excel a json',
  inputs: {
    req:{type:'ref'},
    field: {type:'string'},
    size: {type:'number'}
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
    const xlstojson = require('xls-to-json');
    const xlsxtojson = require('xlsx-to-json');

    inputs.req.file(inputs.field).upload({
      maxTimeToBuffer: 20000,
      maxBytes: inputs.size,
    },async function whenDone(err, uploadedFiles) {
      if (err) {return exits.error(err);}
      if (uploadedFiles.length === 0){
        return exits.badRequest('No file was uploaded');
      } else {
        for(let i=0; i<uploadedFiles.length; i++){
          let filename = uploadedFiles[i].filename;
          let exceltojson = filename.split('.')[filename.split('.').length-1] === 'xlsx' ? xlsxtojson : xlstojson;
          let records = [];
          exceltojson({
            input: uploadedFiles[i].fd,
            output: null,
            allowEmptyKey: false,
          }, (err, result) => {
            if (err) {return exits.error(err);}
            result.forEach(obj => {
              if (obj.reference) {
                records.push(obj);
              }
            });
            return exits.success(records);
          });
        }
      }
    });
  }
};

