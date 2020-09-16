module.exports = {
  friendlyName: 'File reader',
  description: '',
  inputs: {
    path:{
      type:'ref',
      requiered:true,
    }
  },
  exits: {
    success: {
      description: 'All done.',
    },
  },
  fn: async function (inputs,exits) {
    let fs = require('fs');
    fs.readFile(inputs.path,(err,data) =>{
      if(err){return exits.error(err);}
      return exits.success(data);
    });
  }
};

