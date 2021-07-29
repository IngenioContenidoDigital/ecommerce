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

    if(inputs.method==='CC' || inputs.method==='PSE'){
      // Modelo Gateway
      publicKey = '60155da6f1e6473f87716bd3839bf8c6';
      privateKey = '5af11498811086325abecd2a0cd7256f';
    }else{
      //Modelo Agregador
      publicKey = '60155da6f1e6473f87716bd3839bf8c6';
      privateKey = '5af11498811086325abecd2a0cd7256f';
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

