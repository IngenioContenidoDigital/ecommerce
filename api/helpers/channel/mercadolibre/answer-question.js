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
    let mercadolibre = await sails.helpers.channel.mercadolibre.sign(inputs.seller);
    let body = {
      'question_id': inputs.questionId,
      'text': inputs.text
    };
    mercadolibre.post('/answers', body ,{access_token: inputs.secret}, (error, response) =>{
      if(error){return exits.error(error);}
      return exits.success(response);
    });
  }
};
