module.exports = {
  friendlyName: 'Answer question',
  description: 'Answer question Mercadolibre mexico',
  inputs: {
    integration: {
      type:'string',
      required:true
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
    try{
      let integration = await sails.helpers.channel.mercadolibremx.sign(inputs.integration);
      let body = {
        'question_id': inputs.questionId,
        'text': inputs.text
      };
      let response = await sails.helpers.channel.mercadolibremx.request('answers',integration.channel.endpoint,integration.secret,body,'POST');
      if(response){return exits.success(response);}
    }catch(err){
      return exits.error(err.message);
    }
  }
};
