module.exports = {
  friendlyName: 'Messages',
  description: 'Process messages Mercadolibre',
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
      let message = await sails.helpers.channel.mercadolibre.request(`messages/${inputs.resource}`, integration.channel.endpoint, integration.secret);
      let conversation = await Conversation.findOne({identifier: message.resource_id});
      if (!conversation) {
        conversation = await Conversation.create({
          name: `Mensajes de la venta #${message.resource_id}`,
          identifier: message.resource_id,
          recipient: 'messages',
          integration: integration.id
        }).fetch();
      }
      const userId = message.from.user_id;
      const existsQuest = await Question.findOne({idMl: message._id});
      if (!existsQuest) {
        const questi = await Question.create({
          idMl: message._id,
          seller: integration.seller,
          text: message.text.plain,
          status: 'UNANSWERED',
          dateCreated: parseInt(moment(message.date).valueOf()),
          conversation: conversation.id,
          integration: integration.id,
          senderRole: userId === integration.useridml ? 'respondent' : 'complainant'
        }).fetch();
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
        const questionsSeller = await Question.count({status: 'UNANSWERED', seller: integration.seller});
        sails.sockets.blast('notificationml', {questionsSeller: questionsSeller, seller: integration.seller});
      }
      return exits.success();
    }catch(err){
      console.log(err);
      return exits.error(err.message);
    }
  }
};
