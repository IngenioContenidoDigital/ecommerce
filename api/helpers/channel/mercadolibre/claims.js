module.exports = {
  friendlyName: 'Claims',
  description: 'Process claims Mercadolibre',
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
    const moment = require('moment');
    let integration = await sails.helpers.channel.mercadolibre.sign(inputs.integration);
    try{
      let claim = await sails.helpers.channel.mercadolibre.request(inputs.resource, integration.channel.endpoint, integration.secret);
      if(claim && claim.id){
        let messages = await sails.helpers.channel.mercadolibre.request(`${inputs.resource}/messages`, integration.channel.endpoint, integration.secret);
        const typeClaim = claim.reason_id.slice(0,3) === 'PDD' ? 'producto defectuoso' : 'pagado y no recibido';
        let conversation = await Conversation.findOne({identifier: claim.id});
        if (!conversation) {
          conversation = await Conversation.create({
            name: `reclamo #${claim.id}. ${typeClaim}`,
            identifier: claim.id,
            recipient: 'claim',
            integration: integration.id
          }).fetch();
        }
        messages.sort((a, b) => new Date(a.date_created) - new Date(b.date_created));
        let questi = null;
        for (const message of messages) {
          if (message.sender_role === 'complainant' || message.sender_role === 'mediator') {
            const bodyQuesti = {
              idMl: message.id,
              seller: integration.seller,
              text: message.message.replace(/(<[^>]+>|<[^>]>|<\/[^>]>)/gi,''),
              status: 'UNANSWERED',
              dateCreated: parseInt(moment(message.date_created).valueOf()),
              conversation: conversation.id,
              answer: null,
              integration: integration.id
            };
            const existsQuest = await Question.findOne({idMl: message.id});
            if (!existsQuest) {
              questi = await Question.create(bodyQuesti).fetch();
            } else {
              questi = existsQuest;
            }
            const questionsSeller = await Question.count({status: 'UNANSWERED', seller: integration.seller});
            sails.sockets.blast('notificationml', {questionsSeller: questionsSeller, seller: integration.seller});
          } else if(message.sender_role === 'respondent'){
            const existsAnswer = await Answer.findOne({idAnswer: message.id});
            if (!existsAnswer) {
              const answer = await Answer.create({
                idAnswer: message.id,
                text: message.message.replace(/(<[^>]+>|<[^>]>|<\/[^>]>)/gi,''),
                status: message.stage,
                dateCreated: parseInt(moment(message.date_created).valueOf()),
              }).fetch();
              await Question.updateOne({id: questi.id}).set({answer: answer ? answer.id : null});
            }
          }
        }
        return exits.success();
      } else {
        return exits.error('No se proceso el reclamo');
      }
    }catch(err){
      return exits.error(err.message);
    }
  }
};
