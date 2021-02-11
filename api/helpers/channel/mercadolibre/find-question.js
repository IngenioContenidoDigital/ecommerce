module.exports = {
  friendlyName: 'Find question',
  description: 'Find question Mercadolibre',
  inputs: {
    integration: {
      type:'string',
      required:true
    },
    resource: {
      type: 'string',
      required: true
    },
  },
  exits: {
    success: {
      description: 'All done.',
    },
  },
  fn: async function (inputs, exits) {
    let integration = await sails.helpers.channel.mercadolibre.sign(inputs.integration);
    try{
      let response = await sails.helpers.channel.mercadolibre.request(inputs.resource, integration.channel.endpoint, integration.secret);
      if(response){
        return exits.success(response);
      }
    }catch(err){
      return exits.error(err.message);
    }
  }
};
