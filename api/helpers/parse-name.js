module.exports = {
  friendlyName: 'Parse Name',
  description: '',
  inputs: {
    name:{
      type:'string',
      required: true
    }
  },
  exits: {
    success: {
      description: 'All done.',
    },
  },
  fn: async function (inputs, exits) {
    const fullName = inputs.name || '';
    const result = {};
    if (fullName.length > 0) {
      const nameTokens = fullName.split(' ') || [];

      if (nameTokens.length > 3) {
        result.name = nameTokens.slice(0, 2).join(' ');
      } else {
        result.name = nameTokens.slice(0, 1).join(' ');
      }
      if (nameTokens.length > 2) {
        result.lastName = nameTokens.slice(-2, -1).join(' ');
        result.secondLastName = nameTokens.slice(-1).join(' ');
      } else {
        result.lastName = nameTokens.slice(-1).join(' ');
        result.secondLastName = '';
      }
    }
    return exits.success(result);
  }
};

