module.exports = {
  friendlyName: 'Find question',
  description: 'Find question Mercadolibre',
  inputs: {
    seller: {
      type:'string',
      required:true
    },
    secret: {
      type: 'string',
      required: true
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
    let mercadolibre = await sails.helpers.channel.mercadolibre.sign(inputs.seller);
    mercadolibre.get(inputs.resource, {access_token: inputs.secret}, (error, response) =>{
      if(error){return exits.error(error);}
      return exits.success(response);
    });
  }
};
