module.exports = {
  friendlyName: 'Make Job',
  description: 'Para crear un job para el sistema de colas',
  inputs: {
    data:{
      type:'ref',
      required: true
    }
  },
  exits: {
    success: {
      description: 'All done.',
    },
  },
  fn: async function (inputs, exits) {
    const job = function() {};
    job.data = inputs.data;
    return exits.success(job);
  }
};
