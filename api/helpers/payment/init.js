module.exports = {
  friendlyName: 'Init',
  description: 'Init payment.',
  inputs:{
    method:{
      type:'string',
      required:true,
    }
  },
  exits: {
    success: {
      description: 'All done.',
    },
  },
  fn: async function (inputs, exits) {
    let publicKey = '';
    let privateKey = '';

    if(inputs.method==='CC'){
      // Modelo Gateway
      publicKey = '6a7d08a5cc7410769c22029ea34108f6';
      privateKey = 'c4f2b4893fcb720b78f405e3a34cbc9c';
    }else{
      //Modelo Agregador
      publicKey = '654321aa2d4ced997b799450ce3f4802';
      privateKey = '6303de3a48c07a82a3c83c3ab0d76b44';
    }

    const epayco = require('epayco-sdk-node')({
      apiKey: publicKey,
      privateKey: privateKey,
      lang: 'ES',
      test: true
    });

    return exits.success(epayco);

  }

};

