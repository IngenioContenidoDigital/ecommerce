
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
    let tokens = [];
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
      channels = await Channel.find({});
      integrations = await Integrations.find({
        where:{seller:id},
      }).populate('channel');
      commissiondiscount = await CommissionDiscount.find({seller:id});
      commissionchannel = await CommissionChannel.find({seller: id}).populate('channel');
      tokens = await Token.find({user:id}).sort([{createdAt: 'DESC'}]);
      for (const token of tokens) {
        const stringFrch = token.frch.toLowerCase();
        const frch = stringFrch.includes('master') || stringFrch.includes('maestro') ? 'master' :
        stringFrch.includes('diners') ? 'diners' :
        stringFrch.includes('american') ? 'amex' :
        stringFrch.includes('visa') ? 'visa' : '';
        token.frchimg = frch;
      }
    }
    let countries = await Country.find();
    let currencies = await Currency.find();
    res.view('pages/sellers/sellers',{layout:'layouts/admin',rights,sellers:sellers,action:action,seller:seller,error:error,success:success,countries:countries,currencies, channels, integrations, commissiondiscount,commissionchannel, appIdMl: constant.APP_ID_ML, secretKeyMl: constant.SECRET_KEY_ML, moment, tokens});
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
      };

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
  settaxes: async (req, res)=>{
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if(rights.name!=='superadmin' && !_.contains(rights.permissions,'editseller')){
      throw 'forbidden';
    }
    let error=null;
    let id = req.param('seller');
    try{
      await Seller.updateOne({id: id}).set({
        retIca: req.body.retIca ? req.body.retIca : 0,
        retFte: req.body.retFte ? req.body.retFte : 0
      });
    }catch(err){
      error=err;
      if(err.code==='badRequest'){
        await Seller.updateOne({id:id}).set({
          retIca: req.body.retIca ? req.body.retIca : 0,
          retFte: req.body.retFte ? req.body.retFte : 0
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
          value: req.body.commission,
          collect: (req.body.collect ==='on') ? true : false
        });
      } else {
        await CommissionChannel.create({
          value: req.body.commission,
          channel: req.body.channel,
          seller: id,
          collect: (req.body.collect ==='on') ? true : false
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
    const textResult = integration ? 'Se Actualizó Correctamente la Integración.': 'Se Agrego Correctamente la Integración.';
    let edit = false;

    let getProductUpdates = req.body.getProductUpdates == 'on' ? true : false;
    let getOrderUpdates =  req.body.getOrderUpdates == 'on' ? true : false

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
      switch (nameChannel) {
        case 'woocommerce':
          let int = await Integrations.findOne({id : integration});
          if(getProductUpdates && !int.product_creation_webhookId){
            let product_created = {};
            product_created.name = "1Ecommerce Product Creation Sync v2";
            product_created.delivery_url = `https://import.1ecommerce.app/api/created_product/woocommerce/${record.key}/true`
            product_created.status = "active",
            product_created.topic = "product.created";
            product_created.version  = req.body.version
            
            let product_creation_response = await sails.helpers.webhooks.addWebhook(nameChannel, record.key, record.secret, record.url, record.version, 'ADD_WEBHOOK', product_created);
            let product_updated = {};
            product_updated.name = "1Ecommerce Update Creation Sync v2";
            product_updated.delivery_url = `https://import.1ecommerce.app/api/updated_product/woocommerce/${record.key}/true`
            product_updated.status = "active",
            product_updated.topic = "product.updated";
            product_updated.version  = req.body.version
            
            let product_updates_response = await sails.helpers.webhooks.addWebhook(nameChannel, record.key, record.secret, record.url, record.version, 'ADD_WEBHOOK', product_updated);
            
            if(product_creation_response && product_updates_response){
                await Integrations.update({ id : integration}).set({ 
                  product_creation_webhookId : product_creation_response.id,
                  product_updates_webhookId :  product_updates_response.id,
                  product_webhook_status : true
                })
            }
          }else{
            
            await sails.helpers.webhooks.updateWebhook(nameChannel, record.key, record.secret, record.url, record.version, 'UPDATE_WEBHOOK', {
              status : getProductUpdates ? "active" : "paused"
            }, int.product_creation_webhookId);

            await sails.helpers.webhooks.updateWebhook(nameChannel, record.key, record.secret, record.url, record.version, 'UPDATE_WEBHOOK', {
              status : getProductUpdates ? "active" : "paused"
            }, int.product_updates_webhookId);

            await Integrations.update({ id : integration}).set({ 
              product_webhook_status : getProductUpdates,
            });
          }
  
          if(getOrderUpdates && !int.order_updated_webhookId){
            let order_updated = {};
          
            order_updated.name = "1Ecommerce Order updated Sync v2";
            order_updated.delivery_url = `https://import.1ecommerce.app/api/updated_order/woocommerce/${record.key}`;
            order_updated.status = "active",
            order_updated.topic = "order.updated";
            order_updated.version  = req.body.version 
            
            let order_updated_response = await sails.helpers.webhooks.addWebhook(nameChannel, record.key, record.secret, record.url, record.version, 'ADD_WEBHOOK', order_updated);
            
            if(order_updated_response){
                await Integrations.update({ id : integration}).set({ 
                  order_updated_webhookId : order_updated_response.id,
                  order_webhook_status : true
                });
            }

          }else{
            await sails.helpers.webhooks.updateWebhook(nameChannel, record.key, record.secret, record.url, record.version, 'UPDATE_WEBHOOK', {
              status : getOrderUpdates ? "active" : "paused"
            }, int.order_creation_webhookId);

            await Integrations.update({ id : integration}).set({ 
              order_webhook_status : getOrderUpdates
            });
          }
          break;
          //add case for shopify, vtex, prestashop
        case 'shopify':
          if (getProductUpdates && !record.product_creation_webhookId) {
            let webhookProductCreate = {
              topic: 'products/create',
              address: `https://import.1ecommerce.app/api/shopify/createproduct/${record.key}/false`,
              format: 'json'
            };
            let webhookProductUpdate = {
              topic: 'products/update',
              address: `https://import.1ecommerce.app/api/shopify/updateproduct/${record.key}/false`,
              format: 'json'
            };

            let productCreationResponse = await sails.helpers.webhooks.addWebhook(nameChannel, record.key, record.secret, record.url, record.version, 'ADD_WEBHOOK', webhookProductCreate);
            let productUpdateResponse = await sails.helpers.webhooks.addWebhook(nameChannel, record.key, record.secret, record.url, record.version, 'ADD_WEBHOOK', webhookProductUpdate);

            if(productCreationResponse && productUpdateResponse){
              await Integrations.update({id: record.id}).set({
                product_creation_webhookId: productCreationResponse.id,
                product_updates_webhookId:  productUpdateResponse.id,
                product_webhook_status: true
              });
            }
          } else if (!getProductUpdates && record.product_creation_webhookId && record.product_updates_webhookId) {
            await sails.helpers.webhooks.deleteWebhook(nameChannel, record.key, record.secret, record.url, record.version, 'DELETE_WEBHOOK', record.product_creation_webhookId);
            await sails.helpers.webhooks.deleteWebhook(nameChannel, record.key, record.secret, record.url, record.version, 'DELETE_WEBHOOK', record.product_updates_webhookId);
            await Integrations.update({ id: record.id}).set({
              product_creation_webhookId: '',
              product_updates_webhookId: '',
              product_webhook_status: getProductUpdates
            });
          }
          if(getOrderUpdates && !record.order_updated_webhookId){
            let orderUpdated = {
              topic: 'orders/create',
              address: `https://import.1ecommerce.app/api/shopify/createorder/${record.key}`,
              format: 'json'
            };
            let orderUpdatedResponse = await sails.helpers.webhooks.addWebhook(nameChannel, record.key, record.secret, record.url, record.version, 'ADD_WEBHOOK', orderUpdated);
            if(orderUpdatedResponse){
              await Integrations.update({id: record.id}).set({
                order_updated_webhookId: orderUpdatedResponse.id,
                order_webhook_status: true
              });
            }
          } else if (!getProductUpdates && record.order_updated_webhookId) {
            await sails.helpers.webhooks.deleteWebhook(nameChannel, record.key, record.secret, record.url, record.version, 'DELETE_WEBHOOK', record.order_updated_webhookId);
            await Integrations.update({id: record.id}).set({
              order_updated_webhookId: '',
              order_webhook_status: getProductUpdates
            });
          }
          break;
        case 'vtex' :
          if(getOrderUpdates && !record.order_updated_webhookId){
            let orderUpdatedVtex = {
              url: `https://import.1ecommerce.app/api/vtex/orders/${record.key}`
            };
            let orderUpdatedResponseVtex = await sails.helpers.webhooks.addWebhook(nameChannel, record.key, record.secret, record.url, record.version, 'ADD_WEBHOOK', orderUpdatedVtex);
            if(orderUpdatedResponseVtex){
              await Integrations.update({id: record.id}).set({
                order_updated_webhookId: orderUpdatedResponseVtex.id,
                order_webhook_status: true
              });
            }
          } else if (!getProductUpdates && record.order_updated_webhookId) {
            await sails.helpers.webhooks.deleteWebhook(nameChannel, record.key, record.secret, record.url, record.version, 'DELETE_WEBHOOK', record.order_updated_webhookId);
            await Integrations.update({id: record.id}).set({
              order_updated_webhookId: '',
              order_webhook_status: getProductUpdates
            });
          }
        default:
          break;
      }

      if(nameChannel == 'mercadolibre' && !edit){
        return res.redirect('https://auth.mercadolibre.com.co/authorization?response_type=code&client_id='+record.user+'&state='+integration+'&redirect_uri='+'https://'+req.hostname+'/mlauth/'+record.user);
      }else if(nameChannel == 'mercadolibremx' && !edit){
        return res.redirect('https://auth.mercadolibre.com.mx/authorization?response_type=code&client_id='+record.user+'&state='+integration+'&redirect_uri='+'https://'+req.hostname+'/mlauth/'+record.user);
      }else{
        return res.redirect('/sellers/edit/'+seller+'?success='+textResult);
      }
    });
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
      const dateStart = report > 0 && product[0] ? moment(product[0].createdAt).format('YYYY/MM') : seller.skuPrice && product[0] ? moment(product[0].createdAt).format('YYYY/MM') : order.length > 0 ? moment(order[0].createdAt).format('YYYY/MM') : moment().format('YYYY/MM');
      let numberMonth = moment(dateEnd, 'YYYY/MM').diff(moment(dateStart, 'YYYY/MM'), 'months');
      const number = numberMonth >= 14 ? 14 : seller.skuPrice && numberMonth === 0 ? 0 : numberMonth - 1;
      for (let i = number; i >= 0; i--) {
        let month = moment().subtract(i+1, 'months').locale('es').format('MMMM YYYY');
        let available = moment().subtract(i, 'months').locale('es').format('MMMM YYYY');
        if (i === 0 && currentDay < 5) {
          availableOptions = true;
        }
        months.push({month, available, availableOptions});
      }
    }
    res.view('pages/sellers/reports',{layout:'layouts/admin',months,moment,seller,rights});

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
  },
  cms: async (req,res) =>{
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if(rights.name!=='superadmin' && !_.contains(rights.permissions,'cms')){
      throw 'forbidden';
    }
    let seller = null;
    let cms = null;
    if(req.param('id')){
      cms = await Cms.findOne({id:req.param('id')}).populate('seller');
    }
    let cmss = null;
    let filter={};
    let fseller={active:true};
    let action = req.param('action') ? req.param('action') : null
    if(rights.name!=='superadmin' && rights.name!=='admin'){ 
      filter.seller = req.session.user.seller;
      fseller.id = req.session.user.seller;
    }
    if(!action){
      cmss = await Cms.find(filter).populate('seller').sort('updatedAt DESC');
    }
    let sellers = await Seller.find(fseller).sort('name ASC');
    res.view('pages/sellers/cms',{layout:'layouts/admin',sellers:sellers,seller:seller,cmss:cmss, cms:cms, action:action});
  },
  cmsexecute: async (req, res) =>{
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if(rights.name!=='superadmin' && !_.contains(rights.permissions,'cms')){
      throw 'forbidden';
    }

    let active = (req.body.activo==='on') ? true : false;
    let action = req.param('action');
    let body = {}
    
    body.name=req.body.name;
    body.url=req.body.url;
    body.active=active;
    body.content=req.body.content;
    body.position=req.body.position;
    body.seller=req.body.seller ? req.body.seller : null;
    
    if(action==='create'){await Cms.create(body)}
    if(action==='edit'){await Cms.updateOne({id:req.param('id')}).set(body)}
    
    return res.redirect('/cms');
  },
  createcreditcard: async (req, res) =>{
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if(rights.name!=='superadmin' && !_.contains(rights.permissions,'creditcard')){
      throw 'forbidden';
    }
    let id = req.param('seller');
    try {
      const seller = await Seller.findOne({id: id}).populate('mainAddress');
      const city = await City.findOne({id: seller.mainAddress.city});
      const tokens = await Token.find({user:id});
      let creditInfo = {
        'card[number]': req.body.card,
        'card[exp_year]': req.body.year,
        'card[exp_month]': req.body.month,
        'card[cvc]': req.body.cvv
      };
      let token = await sails.helpers.payment.tokenize(creditInfo);
      if (tokens.length > 0) {
        const addDefaultCardCustomer = {
          franchise : token.card.name,
          token : token.id,
          mask : token.card.mask,
          customer_id: tokens[0].customerId
        };
        const epayco = await sails.helpers.payment.init('CC');
        await epayco.customers.addDefaultCard(addDefaultCardCustomer);
        await Token.create({
          token:token.id,
          customerId:tokens[0].customerId,
          docType:req.body.tid,
          docNumber:req.body.dni,
          mask:token.card.mask,
          frch:token.card.name,
          dues:1,
          name:req.body.cardname,
          user:seller.id,
          default: true
        });
        for (const token of tokens) {
          await Token.updateOne({id:token.id}).set({default: false});
        }
      } else {
        let customerInfo = {
          token_card: token.id,
          name: req.body.cardname.toUpperCase().trim(),
          last_name: ' ',
          email: seller.email,
          default: true,
          city: city.name,
          address: seller.mainAddress.addressline1+' '+seller.mainAddress.addressline2,
          cell_phone: seller.phone.toString()
        };
        let customer = await sails.helpers.payment.customer(customerInfo, 'CC');
        await Token.create({
          token:token.id,
          customerId:customer.data.customerId,
          docType:req.body.tid,
          docNumber:req.body.dni,
          mask:token.card.mask,
          frch:token.card.name,
          dues:1,
          name:req.body.cardname,
          user:seller.id,
          default: true
        });
      }
      return res.redirect(`/sellers/edit/${id}?success=Se agrego correctamente la tarjeta`);
    } catch (err) {
      console.log(err);
      return res.redirect(`/sellers/edit/${id}?error=${err.message}`);
    }
  },
  confirmationinvoice: async(req, res)=>{
    let invoice = await Invoice.findOne({reference:req.body.x_ref_payco});
    let state = await sails.helpers.orderState(req.body.x_response);
    if(invoice){
      if(invoice.state !== state){
        await Invoice.updateOne({id:invoice.id}).set({
          state: state
        });
      }
    }
    return res.ok();
  },
};
