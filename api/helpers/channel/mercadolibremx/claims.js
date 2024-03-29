module.exports = {
  friendlyName: 'Claims',
  description: 'Process claims Mercadolibre mexico',
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
    let integration = await sails.helpers.channel.mercadolibremx.sign(inputs.integration);
    try{
      let claim = await sails.helpers.channel.mercadolibremx.request(inputs.resource, integration.channel.endpoint, integration.secret);
      if(claim && claim.id){
        let messages = await sails.helpers.channel.mercadolibremx.request(`${inputs.resource}/messages`, integration.channel.endpoint, integration.secret);
        const typeClaim = claim.reason_id.slice(0,3) === 'PDD' ? 'producto defectuoso' : 'pagado y no recibido';
        let conversation = await Conversation.findOne({identifier: claim.id});
        const isFirstMessage = !conversation ? true : false;
        if (!conversation) {
          conversation = await Conversation.create({
            name: `reclamo #${claim.id}. ${typeClaim}`,
            identifier: claim.id,
            recipient: 'claim',
            integration: integration.id
          }).fetch();
        }
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
              integration: integration.id
            };
            const existsQuest = await Question.findOne({idMl: message.id});
            if (!existsQuest) {
              questi = await Question.create(bodyQuesti).fetch();
              if (message.attachments.length > 0) {
                for (const atta of message.attachments) {
                  await Attachment.create({
                    filename: atta.filename,
                    name: atta.original_filename,
                    type: 'link',
                    question: questi.id
                  }).fetch();
                }
              }
              await sails.helpers.channel.chatBot(isFirstMessage, integration, message.message.replace(/(<[^>]+>|<[^>]>|<\/[^>]>)/gi,''), 'claim', claim.id, questi.id, message.sender_role);
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
                question: questi.id,
                dateCreated: parseInt(moment(message.date_created).valueOf()),
              }).fetch();
              if (answer) {
                if (message.attachments.length > 0) {
                  for (const att of message.attachments) {
                    await Attachment.create({
                      filename: att.filename,
                      name: att.original_filename,
                      type: 'link',
                      answer: answer.id
                    }).fetch();
                  }
                }
              }
            }
          }
        }
        return exits.success();
      } else {
        return exits.error('No se proceso el reclamo');
      }
    }catch(err){
      console.log(err);
      return exits.error(err.message);
    }
  }
};
