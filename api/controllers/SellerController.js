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
    let moment = require('moment');
    let error= req.param('error') ? req.param('error') : null;
    let success= req.param('success') ? req.param('success') : null;
    let seller = null;
    let integrations = null;
    let channels = null;
    let commissiondiscount = null;
    let commissionchannel = null;
    let action = req.param('action') ? req.param('action') : null;
    let id = req.param('id') ? req.param('id') : null;
    if(rights.name!=='superadmin' && rights.name!=='admin'){
      sellers = await Seller.find({id:req.session.user.seller});
    }else{
      sellers = await Seller.find();
    }
    if(id){
      seller = await Seller.findOne({id:id}).populate('mainAddress').populate('currency');
      if(seller.mainAddress!==undefined && seller.mainAddress!==null){
        seller.mainAddress = await Address.findOne({id:seller.mainAddress.id})
        .populate('country')
        .populate('region')
        .populate('city');
      }
      channels = await Channel.find({where:{type: { '!=': 'messenger' }}});
      integrations = await Integrations.find({
        where:{seller:id},
      }).populate('channel');
      commissiondiscount = await CommissionDiscount.find({seller:id});
      commissionchannel = await CommissionChannel.find({seller: id}).populate('channel');
    }
    let countries = await Country.find();
    let currencies = await Currency.find();
    res.view('pages/sellers/sellers',{layout:'layouts/admin',sellers:sellers,action:action,seller:seller,error:error,success:success,countries:countries,currencies, channels, integrations, commissiondiscount,commissionchannel, appIdMl: constant.APP_ID_ML, secretKeyMl: constant.SECRET_KEY_ML, moment});
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
        currency : req.body.currency,
        skuPrice: req.body.skuPrice ? req.body.skuPrice : 0,
        integrationErp,
        safestock: req.body.safestock ? req.body.safestock : 0
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
      return res.redirect('/sellers/edit/'+seller.id);
    }catch(err){
      console.log(err);
      return res.redirect('/sellers?error='+err.message);
    }
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
        currency : req.body.currency,
        skuPrice: req.body.skuPrice ? req.body.skuPrice : 0,
        integrationErp,
        safestock: req.body.safestock ? req.body.safestock : 0
      });

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
          currency : req.body.currency,
          skuPrice: req.body.skuPrice ? req.body.skuPrice : 0,
          integrationErp,
          safestock: req.body.safestock ? req.body.safestock : 0
        });
      }
    }
    if (error===undefined || error===null || error.code==='badRequest'){
      return res.redirect('/sellers/edit/'+id);
    }else{
      return res.redirect('/sellers/edit/'+id+'?error='+error);
    }
  },
  setcommission:async (req, res)=>{
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if(rights.name!=='superadmin' && !_.contains(rights.permissions,'editseller')){
      throw 'forbidden';
    }
    let error=null;
    let id = req.param('seller');
    try{
      await Seller.updateOne({id: id}).set({
        skuPrice: req.body.skuPrice ? req.body.skuPrice : 0,
        activeSku: (req.body.activeSku ==='on') ? true : false
      });
    }catch(err){
      error=err;
      if(err.code==='badRequest'){
        await Seller.updateOne({id:id}).set({
          skuPrice: req.body.skuPrice ? req.body.skuPrice : 0,
          activeSku: (req.body.activeSku ==='on') ? true : false
        });
      }
    }
    if (error===undefined || error===null || error.code==='badRequest'){
      return res.redirect('/sellers/edit/'+id+'?success=Se Actualizó Correctamente.');
    }else{
      return res.redirect('/sellers/edit/'+id+'?error='+error);
    }
  },
  createcommissiondiscount:async (req, res)=>{
    const moment = require('moment');
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if(rights.name!=='superadmin' && !_.contains(rights.permissions,'editseller')){
      throw 'forbidden';
    }
    let error=null;
    let id = req.param('seller');
    try{
      const range = req.body.range.split(' - ');
      await CommissionDiscount.create({
        from: moment(range[0]).valueOf(),
        to: moment(range[1]).valueOf(),
        value: req.body.commission,
        seller: id
      });
    }catch(err){
      error=err;
    }
    if (error===undefined || error===null || error.code==='badRequest'){
      return res.redirect('/sellers/edit/'+id+'?success=Se Agrego Correctamente el Descuento.');
    }else{
      return res.redirect('/sellers/edit/'+id+'?error='+error);
    }
  },
  removecommissiondiscount: async (req, res) =>{
    if (!req.isSocket) {
      return res.badRequest();
    }
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if(rights.name!=='superadmin' && !_.contains(rights.permissions,'editseller')){
      throw 'forbidden';
    }
    try{
      let discountId = req.body.id;
      await CommissionDiscount.destroyOne({id: discountId});
      return res.send('ok');
    }catch(err){
      console.log(err);
      return res.send(err.message);
    }
  },
  commissionchannel:async (req, res)=>{
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if(rights.name!=='superadmin' && !_.contains(rights.permissions,'editseller')){
      throw 'forbidden';
    }
    let error=null;
    let id = req.param('seller');
    const text = req.body.idcommission ? 'Se Actualizó Correctamente la comisión.' : 'Se Agrego Correctamente la comisión.';
    try{
      if (req.body.idcommission) {
        await CommissionChannel.updateOne({id: req.body.idcommission}).set({
          value: req.body.commission
        });
      } else {
        await CommissionChannel.create({
          value: req.body.commission,
          channel: req.body.channel,
          seller: id
        });
      }
    }catch(err){
      error=err;
    }
    if (error===undefined || error===null || error.code==='badRequest'){
      return res.redirect('/sellers/edit/'+id+'?success='+text);
    }else{
      return res.redirect('/sellers/edit/'+id+'?error='+error);
    }
  },
  removecommissionchannel: async (req, res) =>{
    if (!req.isSocket) {
      return res.badRequest();
    }
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if(rights.name!=='superadmin' && !_.contains(rights.permissions,'editseller')){
      throw 'forbidden';
    }
    try{
      let commission = req.body.id;
      await CommissionChannel.destroyOne({id: commission});
      return res.send('ok');
    }catch(err){
      console.log(err);
      return res.send(err.message);
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
    if(!state){
      await Product.update({seller:updatedSeller.id}).set({active:false});
    }
    return res.send(updatedSeller);
  },
  setintegration:async (req,res)=>{
    let seller = req.param('seller');
    let channel = req.param('channel');
    const nameChannel = req.param('namechannel');
    let integration = req.body.integration;
    const textResult = integration ? 'Se Actualizó Correctamente la Integración.': 'Se Agrego Correctamente la Integración.'
    let edit = false;

    Integrations.findOrCreate({id: integration},{
      channel:channel,
      name: req.body.name,
      url:req.body.url ? req.body.url : '',
      user:req.body.user,
      key:req.body.key,
      secret:req.body.secret ? req.body.secret : '',
      version:req.body.version ? req.body.version : '',
      seller:seller
    }).exec(async (err, record, created)=>{
      if(err){return res.redirect('/sellers?error='+err);}
      integration = record.id;
      if(!created){
        record = await Integrations.updateOne({id:record.id}).set({
          name: req.body.name,
          url:req.body.url ? req.body.url : record.url,
          user:req.body.user ? req.body.user : record.user,
          key:req.body.key ? req.body.key : record.key,
          secret:req.body.secret ? req.body.secret : record.secret,
          version:req.body.version ? req.body.version : record.version
        });
        edit = record.useridml !== '' && record.secret !== '' ? true : false;
      }
      if(nameChannel == 'mercadolibre' && !edit){
        return res.redirect('https://auth.mercadolibre.com.co/authorization?response_type=code&client_id='+record.user+'&state='+integration+'&redirect_uri='+'https://'+req.hostname+'/mlauth/'+record.user);
      }else{
        return res.redirect('/sellers/edit/'+seller+'?success='+textResult);
      }
    });
  },
  showmessages: async function(req, res){
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    let seller = req.param('seller');
    if(rights.name!=='superadmin' && !_.contains(rights.permissions,'messages')){
      throw 'forbidden';
    }
    let channels = await Channel.find({type: 'messenger'});
    let countQuestion = await Question.count({status: 'UNANSWERED', seller: seller});

    res.view('pages/sellers/showmessages',{layout:'layouts/admin',channels, countQuestion, seller});
  },
  notificationml: async function(req, res){
    let moment = require('moment');
    let resource = req.body.resource;
    let userId = req.body.user_id;
    let topic = req.body.topic;
    let integration = await Integrations.findOne({useridml: userId});
    if (integration) {
      let seller = integration.seller;
      try {
        switch (topic) {
          case 'questions':
            let question = await sails.helpers.channel.mercadolibre.findQuestion(integration.id, resource);
            let itemId = question.item_id;
            let productchan = await ProductChannel.findOne({channelid: itemId, integration: integration.id});
            if (productchan) {
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
                seller: seller,
                text: question.text,
                status: question.status,
                dateCreated: parseInt(moment(question.date_created).valueOf()),
                product: productchan.product,
                answer: answer ? answer.id : null,
                integration: integration.id
              };
              const existsQuest = await Question.findOne({idMl: question.id});
              if (existsQuest) {
                await Question.updateOne({id: existsQuest.id}).set({answer: answer ? answer.id : null, status: question.status});
              } else {
                await Question.create(questi).fetch();
              }
            }
            let questionsSeller = await Question.count({status: 'UNANSWERED', seller: seller});
            sails.sockets.blast('notificationml', {questionsSeller: questionsSeller, seller});
            break;
          case 'shipments':
            await sails.helpers.channel.mercadolibre.statusOrder(integration.id, resource);
            break;
          case 'orders_v2':
            await sails.helpers.channel.mercadolibre.orders(integration.id, resource);
            break;
          case 'items':
            await sails.helpers.channel.mercadolibre.productQc(integration.id, resource);
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
    if(rights.name!=='superadmin' && !_.contains(rights.permissions,'messages')){
      throw 'forbidden';
    }
    let seller = req.body.seller || req.session.user.seller;
    let messages = [];

    let questions = await Question.find({seller: seller, status: 'UNANSWERED'}).sort('createdAt DESC')
      .populate('product');

    for(let q of questions){
      if(!messages.some(m => m.id === q.product.id)){
        const questi = questions.filter(item => item.product.id === q.product.id && item.status === 'UNANSWERED');
        messages.push({
          id: q.product.id,
          name: q.product.name.toUpperCase(),
          created: q.dateCreated,
          questions: questi
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
    let productId = req.body.productId;

    let questions = await Question.find({product: productId}).sort('createdAt DESC').populate('product').populate('answer');
    questions.sort((a, b) => (a.answer !== null ? 0 : 1) - (b.answer !== null ? 0 : 1));
    return res.send({questions});
  },
  answerquestion: async function(req, res){
    let moment = require('moment');
    let questionId = req.body.id;
    let text = req.body.text;
    let seller = req.body.seller;
    let question = await Question.findOne({seller: seller, idMl: questionId});

    try {
      if (question) {
        let integration = await Integrations.findOne({id: question.integration});
        await sails.helpers.channel.mercadolibre.answerQuestion(integration.id, questionId, text);

        let answer = await Answer.create({
          text: text,
          status: 'ACTIVE',
          dateCreated: parseInt(moment().valueOf()),
        }).fetch();
        await Question.updateOne({idMl: questionId}).set({answer: answer.id, status: 'ANSWERED'});
        let questions = await Question.find({product: question.product}).sort('createdAt DESC').populate('product').populate('answer');
        questions.sort((a, b) => (a.answer !== null ? 0 : 1) - (b.answer !== null ? 0 : 1));

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
  showreports: async function(req, res){
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if(rights.name!=='superadmin' && !_.contains(rights.permissions,'report')){
      throw 'forbidden';
    }
    let moment = require('moment');
    let seller = null;
    let months = [];
    let id = req.param('id') ? req.param('id') : req.session.user.seller;
    if(id){
      let currentDay =  moment().format('DD');
      let availableOptions = false;
      seller = await Seller.findOne({id:id}).populate('mainAddress').populate('currency');
      let order = await Order.find({
        where:{
          seller: seller.id
        },
        sort: 'createdAt ASC',
        limit: 1
      });
      let report = await ReportSkuPrice.count({seller: seller.id});
      const dateEnd = moment().format('YYYY/MM');
      const product = await Product.find({
        where:{
          seller: seller.id
        },
        sort: 'createdAt ASC',
        limit: 1
      });
      const dateStart = report > 0 ? moment(product[0].createdAt).format('YYYY/MM') : seller.skuPrice ? moment(product[0].createdAt).format('YYYY/MM') : order.length > 0 ? moment(order[0].createdAt).format('YYYY/MM') : moment().format('YYYY/MM');
      let numberMonth = moment(dateEnd, 'YYYY/MM').diff(moment(dateStart, 'YYYY/MM'), 'months');
      const number = numberMonth >= 14 ? 14 : seller.skuPrice && numberMonth === 0 ? 0 : numberMonth - 1;
      for (let i = number; i >= 0; i--) {
        let month = moment().subtract(i+1, 'months').locale('es').format('MMMM YYYY');
        let available = moment().subtract(i, 'months').locale('es').format('MMMM YYYY');
        if (i === 0 && currentDay < 20) {
          availableOptions = true;
        }
        months.push({month, available, availableOptions});
      }
    }
    res.view('pages/sellers/reports',{layout:'layouts/admin',months,moment,seller});

  },
  createhash: async (req, res) =>{
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if(rights.name!=='superadmin' && !_.contains(rights.permissions,'editseller')){
      throw 'forbidden';
    }
    if (!req.isSocket) {
      return res.badRequest();
    }
    let uniqueString = await sails.helpers.strings.uuid();     
    return res.send(uniqueString);
  }
};
