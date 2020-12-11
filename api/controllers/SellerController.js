/**
 * SellerController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
const constant = {
  APP_ID_ML: sails.config.custom.APP_ID_ML,
  SECRET_KEY_ML: sails.config.custom.SECRET_KEY_ML
};
module.exports = {
  showsellers: async function(req, res){
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if(rights.name!=='superadmin' && !_.contains(rights.permissions,'showsellers')){
      throw 'forbidden';
    }
    let error= req.param('error') ? req.param('error') : null;
    let success= req.param('success') ? req.param('success') : null;
    let seller = null;
    let integrations = null;
    let action = req.param('action') ? req.param('action') : null;
    let id = req.param('id') ? req.param('id') : null;
    if(rights.name!=='superadmin' && rights.name!=='admin'){
      sellers = await Seller.find({id:req.session.user.seller});
    }else{
      sellers = await Seller.find();
    }
    if(id){
      seller = await Seller.findOne({id:id}).populate('mainAddress');
      if(seller.mainAddress!==undefined && seller.mainAddress!==null){
        seller.mainAddress = await Address.findOne({id:seller.mainAddress.id})
        .populate('country')
        .populate('region')
        .populate('city');
      }
      integrations = await Integrations.find({
        where:{seller:id, channel:{'!=':['dafiti','linio','mercadolibre']}},
      });
    }
    let countries = await Country.find();
    res.view('pages/sellers/sellers',{layout:'layouts/admin',sellers:sellers,action:action,seller:seller,error:error,success:success,countries:countries, integrations : integrations});
  },
  createseller: async function(req, res){
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if(rights.name!=='superadmin' && !_.contains(rights.permissions,'createseller')){
      throw 'forbidden';
    }

    let filename = null;
    let isActive = (req.body.activo==='on') ? true : false;
    let integrationErp = (req.body.integrationErp==='on') ? true : false;
    try{

      let addData = {
        name:'Principal '+req.body.name.trim().toLowerCase(),
        addressline1:req.body.addressline1,
        addressline2:req.body.addressline2,
        country:req.body.country,
        region:req.body.region,
        city:req.body.city,
        zipcode:req.body.zipcode,
        notes:req.body.notes
      }

      let sellerData = {
        name:req.body.name.trim().toLowerCase(),
        dni:req.body.dni,
        contact:req.body.contact,
        email:req.body.email,
        tagManager: req.body.tagManager ? req.body.tagManager : '',
        phone:req.body.phone,
        domain:req.body.url ? req.body.url : '',
        active:isActive,
        salesCommission: req.body.salesCommission ? req.body.salesCommission : 0,
        skuPrice: req.body.skuPrice ? req.body.skuPrice : 0,
        integrationErp
      }

      try{
        filename = await sails.helpers.fileUpload(req,'logo',2000000,'images/sellers');
        if(filename.length>0){sellerData.logo = filename[0].filename;}
      }catch(err){
        console.log(err);
      }

      let address = await Address.findOrCreate({name:addData.name,addressline1:addData.addressline1},addData);

      if(address){sellerData.mainAddress = address.id;}
      
      let seller = await Seller.findOrCreate({dni:sellerData.dni},sellerData);
      let integration = {
        channel:req.body.channel,
        url:req.body.apiUrl,
        key:req.body.key,
        secret:req.body.secret ? req.body.secret : '',
        seller:seller.id
      };

      if(integration.channel && integration.url && integration.key && integration.secret){

        if(req.body.user){integration.user = req.body.user;}
        if(req.body.version){integration.version = req.body.version;}
    
        Integrations.findOrCreate({ seller: seller.id, channel:integration.channel}, integration, async (err, record , created )=>{
          if(err){error = err;}
          if(!created){await Integrations.updateOne({id:record.id}).set(updateIntegration);}
        });
      }
    }catch(err){
      console.log(err);
      return res.redirect('/sellers?error='+err.message);
    }
    return res.redirect('/sellers');
  },
  editseller: async function(req, res){
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if(rights.name!=='superadmin' && !_.contains(rights.permissions,'editseller')){
      throw 'forbidden';
    }
    let error=null;
    let isActive = (req.body.activo==='on') ? true : false;
    let integrationErp = (req.body.integrationErp==='on') ? true : false;
    let id = req.param('id');
    let seller = await Seller.findOne({id:id});
    let address = null;
    let integration = null;
    if(seller.mainAddress!==null){
      address = await Address.updateOne({id:seller.mainAddress}).set({
        addressline1:req.body.addressline1,
        addressline2:req.body.addressline2,
        country:req.body.country,
        region:req.body.region,
        city:req.body.city,
        zipcode:req.body.zipcode,
        notes:req.body.notes
      });
    }else{
      address = await Address.create({
        name:'Principal '+req.body.name.trim().toLowerCase(),
        addressline1:req.body.addressline1,
        addressline2:req.body.addressline2,
        country:req.body.country,
        region:req.body.region,
        city:req.body.city,
        zipcode:req.body.zipcode,
        notes:req.body.notes
      }).fetch();
    }
    try{
      let filename = await sails.helpers.fileUpload(req,'logo',2000000,'images/sellers');
      
       await Seller.updateOne({id:id}).set({
        name:req.body.name.trim().toLowerCase(),
        dni:req.body.dni,
        contact:req.body.contact,
        email:req.body.email,
        phone:req.body.phone,
        tagManager: req.body.tagManager,
        domain:req.body.url,
        logo: filename[0].filename,
        mainAddress:address.id,
        active:isActive,
        salesCommission: req.body.salesCommission ? req.body.salesCommission : 0,
        skuPrice: req.body.skuPrice ? req.body.skuPrice : 0,
        integrationErp});

        if(req.body.secret && req.body.key && req.body.version && req.body.apiurl){
            integration = {
              channel:req.body.channel,
              url:req.body.apiurl,
              key:req.body.key,
              user: req.body.user ? req.body.user : '',
              secret:req.body.secret ? req.body.secret : '',
              version:req.body.version ? req.body.version : '',
              seller:seller.id
            };
            Integrations.findOrCreate({ seller: integration.seller, channel:integration.channel}, integration, async (err, record , created )=>{
              if(err){console.log(err); error = err;}
        
              if(!created){
                delete integration.id;
                delete integration.createdAt;
                delete integration.updatedAt;
                await Integrations.updateOne({id:record.id}).set(integration);
              }
            });
        }

    }catch(err){      
      error=err;
      if(err.code==='badRequest'){
        await Seller.updateOne({id:id}).set({
          name:req.body.name.trim().toLowerCase(),
          dni:req.body.dni,
          contact:req.body.contact,
          email:req.body.email,
          phone:req.body.phone,
          tagManager: req.body.tagManager,
          domain:req.body.url,
          mainAddress:address.id,
          active:isActive,
          salesCommission: req.body.salesCommission ? req.body.salesCommission : 0,
          skuPrice: req.body.skuPrice ? req.body.skuPrice : 0,
          integrationErp});
        
        if(req.body.secret && req.body.key && req.body.version && req.body.apiurl){
            integration = {
              channel:req.body.channel,
              url:req.body.apiurl,
              key:req.body.key,
              user: req.body.user ? req.body.user : '',
              secret:req.body.secret ? req.body.secret : '',
              version:req.body.version ? req.body.version : '',
              seller:seller.id
            };
            Integrations.findOrCreate({ seller: integration.seller, channel:integration.channel}, integration, async (err, record , created )=>{
              if(err){console.log(error); error = err;}
              if(!created){
                delete integration.id;
                delete integration.createdAt;
                delete integration.updatedAt;
                await Integrations.updateOne({id:record.id}).set(integration);
              }
            });
        }

      }
    }
    if (error===undefined || error===null || error.code==='badRequest'){
      return res.redirect('/sellers');
    }else{
      return res.redirect('/sellers?error='+error);
    }
  },
  sellerstate: async function(req, res){
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if(rights.name!=='superadmin' && !_.contains(rights.permissions,'sellerstate')){
      throw 'forbidden';
    }
    if (!req.isSocket) {
      return res.badRequest();
    }
    var id = req.param('id');
    var state = req.body.active;
    var updatedSeller = await Seller.updateOne({id:id}).set({active:state});
    return res.send(updatedSeller);
  },
  integrations:async(req,res)=>{
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if(rights.name!=='superadmin' && !_.contains(rights.permissions,'integrations')){
      throw 'forbidden';
    }
    let integrations = [];
    let seller = await Seller.findOne({id:req.param('id')});
    integrations = await Integrations.find({seller:seller.id});

    return res.view('pages/sellers/integrations',{layout:'layouts/admin',seller:seller,integrations:integrations, appIdMl: constant.APP_ID_ML, secretKeyMl: constant.SECRET_KEY_ML});
  },
  setintegration:async (req,res)=>{
    let seller = req.param('seller');
    let channel = req.param('channel');
    Integrations.findOrCreate({seller:seller,channel:channel},{
      channel:channel,
      url:req.body.url ? req.body.url : '',
      user:req.body.user,
      key:req.body.key,
      secret:req.body.secret ? req.body.secret : '',
      seller:seller
    }).exec(async (err, record, created)=>{
      if(err){return res.redirect('/sellers?error='+err);}
      if(!created){
        await Integrations.updateOne({id:record.id}).set({
          channel:channel,
          url:req.body.url ? req.body.url : '',
          user:req.body.user,
          key:req.body.key,
          secret:req.body.secret ? req.body.secret : '',
          seller:seller
        });
      }

      if(record.channel=='mercadolibre'){
        return res.redirect('https://auth.mercadolibre.com.co/authorization?response_type=code&client_id='+record.user+'&state='+seller+'&redirect_uri='+'https://'+req.hostname+'/mlauth/'+record.user);
      }else{
        return res.redirect('/sellers');
      }
    });
  },
  showmessages: async function(req, res){
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    let sellers = null;
    if(rights.name!=='superadmin' && !_.contains(rights.permissions,'mensajesmeli')){
      throw 'forbidden';
    }
    if(rights.name === 'superadmin'){
      let integrations = await Integrations.find({channel: 'mercadolibre'});
      let slist = integrations.map(i => i.seller);
      sellers = await Seller.find({where: {id: {in: slist}}, select: ['id', 'name']});
      req.session.questions = await Question.count({status: 'UNANSWERED'});
    } else {
      req.session.questions = await Question.count({status: 'UNANSWERED', seller: req.session.user.seller});
    }

    res.view('pages/sellers/messagesml',{layout:'layouts/admin', sellers});
  },
  notificationml: async function(req, res){
    let moment = require('moment');
    let fs = require('fs');
    let path = require('path');
    let resource = req.body.resource;
    let userId = req.body.user_id;
    let topic = req.body.topic;
    let integration = await Integrations.findOne({useridml: userId, channel: 'mercadolibre'});
    fs.writeFile(path.join(__dirname, 'logs', `${moment().format('YYYYMMDD_HHmms')}.json`), JSON.stringify(req.body), err =>{
      if(err){console.log(err);}
    });
    if (integration) {
      let seller = integration.seller;

      try {
        switch (topic) {
          case 'questions':
            let question = await sails.helpers.channel.mercadolibre.findQuestion(seller, integration.secret, resource);
            let itemId = question.item_id;
            let product = await Product.findOne({mlid: itemId});
            if (product) {
              let answer = null;
              if (question.answer !== null) {
                answer = await Answer.create({
                  text: question.answer.text,
                  status: question.answer.status,
                  dateCreated: parseInt(moment(question.answer.date_created).valueOf()),
                }).fetch();
              }

              let questi = {
                idMl: question.id,
                seller: integration.seller,
                text: question.text,
                status: question.status,
                dateCreated: parseInt(moment(question.date_created).valueOf()),
                product: product.id,
                answer: answer ? answer.id : null
              };

              await Question.findOrCreate({idMl: question.id}, questi).exec(async (err, record, wasCreated)=>{
                if(err){return res.send('error');}
                if(!wasCreated){
                  await Question.updateOne({id: record.id}).set({answer: answer ? answer.id : null, status: question.status});
                }
              });
            }
            let questio = await Question.count({status: 'UNANSWERED'});
            let questionsSeller = await Question.count({status: 'UNANSWERED', seller: seller});
            sails.sockets.blast('notificationml', {questions: questio + 1, questionsSeller: questionsSeller, seller});
            break;
          case 'orders_v2':
            await sails.helpers.channel.mercadolibre.orders(seller, resource);
            break;
          default:
            break;
        }
        return res.ok();
      } catch(err) {
        return res.status(404).send(err);
      }
    }
    return res.status(404).send('No se encontró integracion para el seller');
  },
  filtermessages: async function(req, res){
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if(rights.name!=='superadmin' && !_.contains(rights.permissions,'mensajesmeli')){
      throw 'forbidden';
    }
    let seller = req.body.seller || req.session.user.seller;
    let messages = [];

    let questions = await Question.find({seller: seller})
      .populate('product')
      .populate('answer');

    questions.sort((a, b) => (a.answer !== null ? 0 : 1) - (b.answer !== null ? 0 : 1));
    for(let q of questions){
      if(!messages.some(m => m.id === q.product.id)){
        questi = questions.filter(item => item.product.id === q.product.id);
        messages.push({
          id: q.product.id,
          name: q.product.name.toUpperCase(),
          questions: questi
        });
      }
    }
    return res.send({messages});
  },
  answerquestion: async function(req, res){
    let moment = require('moment');
    let questionId = req.body.id;
    let text = req.body.text;
    let seller = req.body.seller || req.session.user.seller;
    let integration = await Integrations.findOne({seller: seller, channel: 'mercadolibre'});

    try {
      await sails.helpers.channel.mercadolibre.answerQuestion(integration.seller, integration.secret, questionId, text);
      let answer = await Answer.create({
        text: text,
        status: 'ACTIVE',
        dateCreated: parseInt(moment().valueOf()),
      }).fetch();
      await Question.updateOne({idMl: questionId}).set({answer: answer.id, status: 'ANSWERED'});

      let messages = [];
      let questions = await Question.find({seller: seller})
      .populate('product')
      .populate('answer');

      questions.sort((a, b) => (a.answer !== null ? 0 : 1) - (b.answer !== null ? 0 : 1));
      for(let q of questions){
        if(!messages.some(m => m.id === q.product.id)){
          questi = questions.filter(item => item.product.id === q.product.id);
          messages.push({
            id: q.product.id,
            name: q.product.name.toUpperCase(),
            questions: questi
          });
        }
      }
      let question = await Question.count({status: 'UNANSWERED'});
      let questionsSeller = await Question.count({status: 'UNANSWERED', seller: seller});
      sails.sockets.blast('notificationml', {questions: question, questionsSeller, seller});
      return res.send({messages});
    } catch (error) {
      return res.send(error);
    }
  }
};
