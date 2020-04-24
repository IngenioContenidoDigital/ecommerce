module.exports = {
  friendlyName: 'Init',
  description: 'Init payment.',
  inputs:{},
  exits: {
    success: {
      description: 'All done.',
    },
  },
  fn: async function (inputs, exits) {

    const publicKey = '654321aa2d4ced997b799450ce3f4802';
    const privateKey = '6303de3a48c07a82a3c83c3ab0d76b44';

    const epayco = require('epayco-sdk-node')({
      apiKey: publicKey,
      privateKey: privateKey,
      lang: 'ES',
      test: true
    });

    return exits.success(epayco);

  }

};

