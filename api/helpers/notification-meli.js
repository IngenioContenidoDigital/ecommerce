module.exports = {
  friendlyName: 'Notification mercadolibre',
  description: 'Se procesa las notificaciones de mercadolibre',
  inputs: {
    body: {
      type:'ref',
      required: true
    }
  },
  exits: {
    success: {
      description: 'All done.',
    },
  },
  fn: async function (inputs, exits) {
    let moment = require('moment');
    let resource = inputs.body.resource;
    let userId = inputs.body.user_id;
    let topic = inputs.body.topic;
    let integration = await Integrations.find({useridml: userId}).populate('seller');
    if (integration.length > 0) {
      integration = integration[0];
      let seller = integration.seller.id;
      const address = await Address.findOne({id: integration.seller.mainAddress}).populate('country');
      try {
        if (integration.seller.active) {
          if (address.country.iso === 'CO') {
            switch (topic) {
              case 'questions':
                let question = await sails.helpers.channel.mercadolibre.findQuestion(integration.id, resource);
                let itemId = question.item_id;
                let productchan = await ProductChannel.findOne({channelid: itemId, integration: integration.id});
                if (productchan) {
                  let questi = {
                    idMl: question.id,
                    seller: seller,
                    text: question.text,
                    status: question.status,
                    dateCreated: parseInt(moment(question.date_created).valueOf()),
                    product: productchan.product,
                    integration: integration.id
                  };
                  const existsQuest = await Question.findOne({idMl: question.id});
                  if (existsQuest) {
                    questi = await Question.updateOne({id: existsQuest.id}).set({status: question.status});
                  } else {
                    questi = await Question.create(questi).fetch();
                  }
                  if (question.answer !== null) {
                    await Answer.create({
                      text: question.answer.text,
                      status: question.answer.status,
                      dateCreated: parseInt(moment(question.answer.date_created).valueOf()),
                      question: questi.id
                    }).fetch();
                  } else {
                    await sails.helpers.channel.chatBot(true, integration, question.text, 'question', question.id, questi.id);
                  }
                }
                let questionsSeller = await Question.count({status: 'UNANSWERED', seller: seller});
                sails.sockets.blast('notificationml', {questionsSeller: questionsSeller, seller});
                break;
              case 'shipments':
                await sails.helpers.channel.mercadolibre.statusOrder(integration.id, resource);
                break;
              case 'orders_v2':
                let data = await sails.helpers.channel.mercadolibre.orders(integration.id, resource);
                if (data && !data.packId && integration.seller.integrationErp) {
                  if (integration.seller.nameErp === 'siesa') {
                    await sails.helpers.integrationsiesa.exportOrder(data);
                  } else if(integration.seller.nameErp === 'busint'){
                    await sails.helpers.integrationbusint.exportOrder(data);
                  } else if(integration.seller.nameErp === 'sap'){
                    await sails.helpers.integrationsap.exportOrder(data);
                  }
                }
                break;
              case 'items':
                await sails.helpers.channel.mercadolibre.productQc(integration.id, resource);
                break;
              case 'claims':
                await sails.helpers.channel.mercadolibre.claims(integration.id, resource);
                break;
              case 'messages':
                await sails.helpers.channel.mercadolibre.messages(integration.id, resource);
                break;
              default:
                break;
            }
          } else if (address.country.iso === 'MX') {
            switch (topic) {
              case 'questions':
                let question = await sails.helpers.channel.mercadolibremx.findQuestion(integration.id, resource);
                let itemId = question.item_id;
                let productchan = await ProductChannel.findOne({channelid: itemId, integration: integration.id});
                if (productchan) {
                  let questi = {
                    idMl: question.id,
                    seller: seller,
                    text: question.text,
                    status: question.status,
                    dateCreated: parseInt(moment(question.date_created).valueOf()),
                    product: productchan.product,
                    integration: integration.id
                  };
                  const existsQuest = await Question.findOne({idMl: question.id});
                  if (existsQuest) {
                    questi = await Question.updateOne({id: existsQuest.id}).set({status: question.status});
                  } else {
                    questi = await Question.create(questi).fetch();
                  }
                  if (question.answer !== null) {
                    await Answer.create({
                      text: question.answer.text,
                      status: question.answer.status,
                      dateCreated: parseInt(moment(question.answer.date_created).valueOf()),
                      question: questi.id
                    }).fetch();
                  } else {
                    await sails.helpers.channel.chatBot(true, integration, question.text, 'question', question.id, questi.id);
                  }
                }
                let questionsSeller = await Question.count({status: 'UNANSWERED', seller: seller});
                sails.sockets.blast('notificationml', {questionsSeller: questionsSeller, seller});
                break;
              case 'shipments':
                await sails.helpers.channel.mercadolibremx.statusOrder(integration.id, resource);
                break;
              case 'orders_v2':
                await sails.helpers.channel.mercadolibremx.orders(integration.id, resource);
                break;
              case 'items':
                await sails.helpers.channel.mercadolibremx.productQc(integration.id, resource);
                break;
              case 'claims':
                await sails.helpers.channel.mercadolibremx.claims(integration.id, resource);
                break;
              case 'messages':
                await sails.helpers.channel.mercadolibremx.messages(integration.id, resource);
                break;
              default:
                break;
            }
          }
        }
      } catch(err) {
        console.log(`Error ${err.message}`);
      }
    }
    return exits.success();
  }
};