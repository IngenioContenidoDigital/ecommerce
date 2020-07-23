module.exports = {


  friendlyName: 'Commerce importer',


  description: 'Import data from marketplaces providers',


  inputs: {
    provider: {
      type: 'string',
      description: 'The marketplace provider.',
      required: true
    },
    credentials: {
      type: {},
      description: 'The marketplace credentials.',
      required: true
    },
  },


  exits: {

    success: {
      description: 'All done.',
    },

  },


  fn: async function (inputs) {
    console.log(inputs);
  }


};

