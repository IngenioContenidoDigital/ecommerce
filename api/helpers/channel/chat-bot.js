module.exports = {
  friendlyName: 'Chat bot',
  description: 'Para enviar mensajes automaticamente a mercadolibre',
  inputs: {
    integration:{type:'ref'},
    text: {type:'string'},
    type: {type:'string'},
    identifier:{type:'string'},
    questionId:{type:'string'},
    questionIdMl:{type:'string'}
  },
  exits: {
    success: {
      description: 'All done.',
    },
    serverError:{
      description: 'Error de Proceso'
    }
  },
  fn: async (inputs, exits) => {
    const moment = require('moment');
    try {
      let integration = inputs.integration;
      let sellerId = typeof integration.seller === 'string' ? integration.seller : integration.seller.id;
      let seller = await Seller.findOne({id: sellerId});
      const address = await Address.findOne({id: seller.mainAddress}).populate('country');
      integration = address.country.iso === 'MX' ? await sails.helpers.channel.mercadolibremx.sign(integration.id) : await sails.helpers.channel.mercadolibre.sign(integration.id);
      const messages = await Message.find({seller: seller.id, type: inputs.type});
      let resultMessage = [];
      let text = inputs.text.trim().toLowerCase();
      for (const message of messages) {
        const tags = message.tags.split(',');
        for (const tag of tags) {
          if (text.includes(tag.trim().toLowerCase())) {
            resultMessage.push(message.text);
          }
        }
      }
      if (resultMessage.length > 0) {
        switch (inputs.type) {
          case 'question':
            if (address.country.iso === 'MX') {
              await sails.helpers.channel.mercadolibremx.answerQuestion(integration.id, inputs.identifier, resultMessage[0]);
            } else {
              await sails.helpers.channel.mercadolibre.answerQuestion(integration.id, inputs.identifier, resultMessage[0]);
            }
            await Answer.create({
              text: resultMessage[0],
              status: 'ACTIVE',
              dateCreated: parseInt(moment().valueOf()),
              question: inputs.questionId
            }).fetch();
            await Question.updateOne({idMl: inputs.identifier}).set({status: 'ANSWERED'});
            break;
          case 'claim':
            let body = {
              'receiver_role': inputs.questionIdMl,
              'message': resultMessage[0]
            };
            let response = address.country.iso === 'MX' ? await sails.helpers.channel.mercadolibremx.request(`/v1/claims/${inputs.identifier}/messages`,integration.channel.endpoint,integration.secret,body,'POST') :
            await sails.helpers.channel.mercadolibre.request(`/v1/claims/${inputs.identifier}/messages`,integration.channel.endpoint,integration.secret,body,'POST');
            if (response && response.id) {
              await Answer.create({
                idAnswer: response.id,
                text: resultMessage[0],
                status: 'claim',
                dateCreated: parseInt(moment().valueOf()),
                question: inputs.questionId
              }).fetch();
            }
            break;
          case 'order':
            let message = address.country.iso === 'MX' ? await sails.helpers.channel.mercadolibremx.request(`messages/${inputs.questionIdMl}`, integration.channel.endpoint, integration.secret) :
            await sails.helpers.channel.mercadolibre.request(`messages/${inputs.questionIdMl}`, integration.channel.endpoint, integration.secret);
            const from = message.from;
            const to = message.to[0];
            const emailFrom = from.user_id === integration.useridml ? from.email : to.email;
            const userIdTo = from.user_id === integration.useridml ? to.user_id : from.user_id;
            const bodyOrder = {
              from: {'user_id': integration.useridml, 'email': emailFrom},
              to: {'user_id': userIdTo},
              text: resultMessage[0]
            };
            let respon = address.country.iso === 'MX' ? await sails.helpers.channel.mercadolibremx.request(`messages/packs/${inputs.identifier}/sellers/${integration.useridml}`,integration.channel.endpoint,integration.secret,bodyOrder,'POST') :
            await sails.helpers.channel.mercadolibre.request(`messages/packs/${inputs.identifier}/sellers/${integration.useridml}`,integration.channel.endpoint,integration.secret,bodyOrder,'POST');
            if (respon && respon.id) {
              await Answer.create({
                idAnswer: respon.id,
                text: resultMessage[0],
                status: 'message',
                dateCreated: parseInt(moment().valueOf()),
                question: inputs.questionId
              }).fetch();
            }
            break;
          default:
            break;
        }
      }
      return exits.success();
    } catch (err) {
      console.log(err.message);
      return exits.success();
    }
  }
};
