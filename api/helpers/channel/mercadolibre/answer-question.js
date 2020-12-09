module.exports = {
  friendlyName: 'Answer question',
  description: 'Answer question Mercadolibre',
  inputs: {
    seller: {
      type:'string',
      required:true
    },
    secret: {
      type: 'string',
      required: true
    },
    questionId: {
      type: 'string',
      required: true
    },
    text: {
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
    
    const meli = require('mercadolibre-nodejs-sdk');
    
    let mercadolibre = new meli.RestClientApi();
    let integration = await sails.helpers.channel.mercadolibre.sign(inputs.seller);
    let body = {
      'question_id': inputs.questionId,
      'text': inputs.text
    };
    mercadolibre.resourcePost('/answers', {access_token: integration.secret}, body, (error, response) =>{
      if(error){return exits.error(error);}
      return exits.success(response);
    });
  }
};
