/**
 * ConversationController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
module.exports = {
  webhookmessenger: async function(req, res){
    // let moment = require('moment');
    let identifier = req.param('uuid');
    const body = req.body;
    let integration = await Integrations.findOne({user: identifier});
    if (body.challenge) {
      if (!integration) {
        return res.status(403).send('Not authorized');
      }
      return res.send({challenge: body.challenge});
    }
    console.log(body);
    if (integration && body.uuid) {
      let conversation = await Conversation.findOne({identifier: body.identifier});
      if (!conversation) {
        conversation = await Conversation.create({
          name: body.payload.user.name,
          identifier: body.identifier,
          recipient: body.recipient,
          integration: integration.id
        }).fetch();
      }
      let questi = {
        idMl: body.uuid,
        seller: integration.seller,
        text: body.type === 'text' ? body.payload.text : '',
        status: 'UNANSWERED',
        dateCreated: parseInt(body.created),
        conversation: conversation.id,
        answer: null,
        integration: integration.id
      };
    }
    return res.send();
  },
  showmessages: async function(req, res){
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    let seller = req.param('seller');
    if(rights.name!=='superadmin' && !_.contains(rights.permissions,'messages')){
      throw 'forbidden';
    }
    const questionsChannel = [];
    let channels = await Channel.find({type: 'messenger'});
    let integrations = await Integrations.find({seller: seller}).populate('channel');
    seller = await Seller.findOne({id: seller});
    const address = await Address.findOne({id: seller.mainAddress}).populate('country');

    integrations = integrations.filter(int => int.channel.type === 'messenger' || (address.country.iso === 'MX' ?  int.channel.name === 'mercadolibremx': int.channel.name === 'mercadolibre'));
    channels = channels.filter(chann => address.country.iso === 'MX' ? chann.name !== 'mensajes mercadolibre' : chann.name !== 'mensajes mercadolibremx');

    for (const inte of integrations) {
      let channel = null;
      if (inte.channel.name === 'mercadolibre' || inte.channel.name === 'mercadolibremx') {
        const resultChan = channels.find(cha =>  address.country.iso === 'MX' ? cha.name === 'mensajes mercadolibremx' : cha.name === 'mensajes mercadolibre');
        channel = resultChan.id;
      } else {
        channel = inte.channel.id;
      }
      const count = await Question.count({status: 'UNANSWERED', seller: seller.id, integration: inte.id});
      questionsChannel.push({channel, count, integration: inte.id});
    }
    res.view('pages/sellers/showmessages',{layout:'layouts/admin',channels, questionsChannel, seller: seller.id});
  },
  filtermessages: async function(req, res){
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if(rights.name!=='superadmin' && !_.contains(rights.permissions,'messages')){
      throw 'forbidden';
    }
    let seller = req.body.seller || req.session.user.seller;
    const integrations = req.body.integrations;
    let messages = [];
    let questions = await Question.find({seller: seller, status: 'UNANSWERED', integration: integrations}).sort('createdAt DESC')
      .populate('product').populate('conversation');
    for(let q of questions){
      const identifier = q.product ? q.product.id : q.conversation.id;
      if(!messages.some(m => m.id === identifier)){
        const questi = q.product ? questions.filter(item => item.product && item.product.id === identifier) : questions.filter(item => item.conversation && item.conversation.id === identifier);
        messages.push({
          id: identifier,
          isproduct: q.product ? true : false,
          name: q.product ? q.product.name.toUpperCase() : q.conversation.name.toUpperCase(),
          created: q.dateCreated,
          questions: questi,
          type: q.product ? '' : q.conversation.recipient
        });
      }
    }
    return res.send({messages});
  },
  getquestions: async function(req, res){
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if(rights.name!=='superadmin' && !_.contains(rights.permissions,'messages')){
      throw 'forbidden';
    }
    let identifier = req.body.productId;
    const isproduct = req.body.isproduct;
    let questions = isproduct ? await Question.find({product: identifier}).sort('createdAt DESC').populate('product').populate('answers') : await Question.find({conversation: identifier}).populate('conversation').populate('answers').populate('attachments');
    let answers = [];
    if (isproduct) {
      questions.sort((a, b) => (a.answers.length > 0 ? 0 : 1) - (b.answers.length > 0 ? 0 : 1));
    } else {
      for (const question of questions) {
        for (const answer of question.answers) {
          answers.push(answer.id);
        }
      }
      answers = await Answer.find({id: answers}).populate('attachments');
    }
    return res.send({questions, answers});
  },
  answerquestion: async function(req, res){
    let moment = require('moment');
    let questionId = req.body.id;
    let text = req.body.text;
    let seller = req.body.seller;
    let question = await Question.findOne({seller: seller, idMl: questionId});

    try {
      if (question) {
        let integration = await Integrations.findOne({id: question.integration}).populate('seller');
        const address = await Address.findOne({id: integration.seller.mainAddress}).populate('country');
        if (address.country.iso === 'MX') {
          await sails.helpers.channel.mercadolibremx.answerQuestion(integration.id, questionId, text);
        } else {
          await sails.helpers.channel.mercadolibre.answerQuestion(integration.id, questionId, text);
        }
        await Answer.create({
          text: text,
          status: 'ACTIVE',
          dateCreated: parseInt(moment().valueOf()),
          question: question.id
        }).fetch();
        await Question.updateOne({idMl: questionId}).set({status: 'ANSWERED'});
        let questions = await Question.find({product: question.product}).sort('createdAt DESC').populate('product').populate('answers');
        questions.sort((a, b) => (a.answers.length > 0 ? 0 : 1) - (b.answers.length > 0 ? 0 : 1));

        let questionsSeller = await Question.count({status: 'UNANSWERED', seller: seller});
        sails.sockets.blast('notificationml', {questionsSeller, seller});
        return res.send({questions});
      } else {
        throw new Error('No existe la pregunta');
      }
    } catch (error) {
      return res.send(error);
    }
  },
  answerclaim: async function(req, res){
    let moment = require('moment');
    let text = req.body.text;
    let conversation = await Conversation.findOne({id: req.body.id}).populate('questions');
    try {
      if (conversation) {
        let integration = await sails.helpers.channel.mercadolibre.sign(conversation.integration);
        let answers = [];
        let questions = [];
        let attachments = await sails.helpers.channel.mercadolibre.uploadAttachment(req, 'file', 12000000,integration.channel.endpoint,conversation.identifier,integration.secret);
        let route = `attachments/${conversation.id}`;
        const files = await sails.helpers.fileUpload(req, 'file', 12000000, route);
        let body = {
          'receiver_role': 'complainant',
          'message': text,
          'attachments': attachments
        };
        let response = await sails.helpers.channel.mercadolibre.request(`/v1/claims/${conversation.identifier}/messages`,integration.channel.endpoint,integration.secret,body,'POST');
        if (response && response.id) {
          const answer = await Answer.create({
            idAnswer: response.id,
            text: text,
            status: 'claim',
            dateCreated: parseInt(moment().valueOf()),
            question: req.body.questionId
          }).fetch();
          for (const attach of files) {
            await Attachment.create({
              filename: attach.filename,
              name: attach.original,
              type: attach.type,
              answer: answer.id
            }).fetch();
          }
          questions = await Question.find({conversation: conversation.id}).populate('conversation').populate('answers').populate('attachments');
          for (const question of questions) {
            for (const answer of question.answers) {
              answers.push(answer.id);
            }
          }
          answers = await Answer.find({id: answers}).populate('attachments');
        }
        return res.send({questions, answers});
      } else {
        throw new Error('No existe la conversation');
      }
    } catch (error) {
      return res.send({error: error.message});
    }
  },
  donwloadattachment: async function(req, res){
    try {
      let integration = await sails.helpers.channel.mercadolibre.sign(req.body.integration);
      let response = await sails.helpers.channel.mercadolibre.request(`/v1/claims/${req.body.identifier}/attachments/${req.body.filename}/download`, integration.channel.endpoint, integration.secret, {responseType: 'arraybuffer'});
      return res.send(response);
    } catch (err) {
      console.log(err);
      return res.status(404).send(err.message);
    }
  }
};
