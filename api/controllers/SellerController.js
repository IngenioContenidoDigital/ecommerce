/**
 * SellerController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
const constant = {
  APP_ID_ML: sails.config.custom.APP_ID_ML,
  SECRET_KEY_ML: sails.config.custom.SECRET_KEY_ML,
  PARTNER_ID_SHOPEE: sails.config.custom.PARTNER_ID_SHOPEE,
  PARTNER_KEY_SHOPEE: sails.config.custom.PARTNER_KEY_SHOPEE
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
    let plans = null;
    let tokens = [];
    let action = req.param('action') ? req.param('action') : null;
    let id = req.param('id') ? req.param('id') : null;
    if(rights.name!=='superadmin' && rights.name!=='admin'){
      sellers = await Seller.find({id:req.session.user.seller});
    }else{
      sellers = await Seller.find();
    }
    if(id){
      seller = await Seller.findOne({id:id}).populate('documents').populate('mainAddress').populate('currency');
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
      plans = await Plan.find();
      req.session.validateChannel = await sails.helpers.validatePlan(id);
    }
    let countries = await Country.find();
    let currencies = await Currency.find();
    res.view('pages/sellers/sellers',{layout:'layouts/admin',rights,sellers:sellers,action:action,seller:seller,error:error,success:success,countries:countries,currencies, channels, integrations, commissiondiscount,commissionchannel, appIdMl: constant.APP_ID_ML, secretKeyMl: constant.SECRET_KEY_ML, appIdShopee: constant.PARTNER_ID_SHOPEE, keyShopee: constant.PARTNER_KEY_SHOPEE, moment, tokens, plans});
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
      let sellerData = {
        name:req.body.name.trim().toLowerCase(),
        dni:req.body.dni,
        contact:req.body.contact,
        email:req.body.email,
        tagManager: req.body.tagManager ? req.body.tagManager : '',
        phone:req.body.phone,
        domain:req.body.url ? req.body.url : '',
        active:isActive,
        currency : req.body.currency || null,
        integrationErp,
        nameErp: req.body.nameErp || '',
        safestock: req.body.safestock ? req.body.safestock : 0
      }

      try{
        filename = await sails.helpers.fileUpload(req,'logo',2000000,'images/sellers');
        if(filename.length>0){sellerData.logo = filename[0].filename;}
      }catch(err){
        console.log(err);
      }

      let seller = await Seller.findOrCreate({dni:sellerData.dni},sellerData);
      return res.redirect('/sellers/edit/'+seller.id);
    }catch(err){
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
        active:isActive,
        integrationErp,
        nameErp: req.body.nameErp || '',
        safestock: req.body.safestock ? req.body.safestock : 0,
        currency: req.body.currency || null
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
          active:isActive,
          integrationErp,
          nameErp: req.body.nameErp || '',
          safestock: req.body.safestock ? req.body.safestock : 0,
          currency: req.body.currency || null
        });
      }
    }
    if (error===undefined || error===null || error.code==='badRequest'){
      return res.redirect('/sellers/edit/'+id);
    }else{
      return res.redirect('/sellers/edit/'+id+'?error='+error);
    }
  },
  setaddressseller: async function(req, res){
    let error=null;
    let id = req.param('seller');
    let type = req.body.type;
    try{
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
          name:'Principal '+seller.name.trim().toLowerCase(),
          addressline1:req.body.addressline1,
          addressline2:req.body.addressline2,
          country:req.body.country,
          region:req.body.region,
          city:req.body.city,
          zipcode:req.body.zipcode,
          notes:req.body.notes
        }).fetch();
      }
      await Seller.updateOne({id:id}).set({mainAddress: address.id});
    }catch(err){
      error=err;
      if(err.code==='badRequest'){
        await Seller.updateOne({id:id}).set({mainAddress: address.id});
      }
    }
    if (error===undefined || error===null || error.code==='badRequest'){
      return type && type === 'register' ? res.send('ok') : res.redirect('/sellers/edit/'+id+'?success=Se Actualizó la dirección correctamente.');
    }else{
      return type && type === 'register' ? res.send({error}) : res.redirect('/sellers/edit/'+id+'?error='+error);
    }
  },
  adddocuments: async function (req, res) {
    let id = req.body.id;
    let route = 'documents/seller/' + id;
    let result = null;
    try {
      let response = await sails.helpers.fileUpload(req, 'document', 12000000, route);
      for (let i = 0; i < response.length; i++) {
        await DocumentSeller.create({file: response[i].filename, name: response[i].original, seller: id }).fetch();
      }
      result = await DocumentSeller.find({seller: id});
    } catch (err) {
      console.log(err);
    }
    res.send(result);
  },
  showdocument: async function(req, res){
    try {
      let axios = require('axios');
      let documentId = req.param('document');
      let doc = await DocumentSeller.findOne({id: documentId});
      let route = `${sails.config.views.locals.imgurl}/documents/seller/${doc.seller}/${doc.file}`;
      let response = await axios.get(route, { responseType: 'arraybuffer' });
      let resultDocument = Buffer.from(response.data, 'utf-8').toString('base64');
      return res.view('pages/pdf',{layout:'layouts/admin',guia: resultDocument, label:null});
    } catch (err) {
      console.log(err);
      return res.view('pages/pdf',{layout:'layouts/admin',guia: null, label:null}); 
    }
  },
  removedocument: async function (req, res) {
    let error = null;
    try {
      await DocumentSeller.destroyOne({ id: req.param('id') });
    } catch (err) {
      error = err;
    }
    if (error !== null) {
      return res.send(error);
    } else {
      return res.send('ok');
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
      }else if(nameChannel == 'shopee'){
        let path = '/api/v2/shop/auth_partner';
        let sign = await sails.helpers.channel.shopee.sign(path, [`redirect=https://1ecommerce.app/shopeeauth/${integration}/`]);
        return res.redirect(`https://partner.test-stable.shopeemobile.com${path}?${sign}`);
      }else{
        req.session.validateChannel = await sails.helpers.validatePlan(seller);
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
    let id = req.param('seller');
    let type = req.body.type;
    let tokenMercadopago = req.body.token;
    try {
      const seller = await Seller.findOne({id: id}).populate('mainAddress');
      const user = await User.findOne({seller: id, emailAddress: seller.email});
      const city = await City.findOne({id: seller.mainAddress.city});
      let country = await Country.findOne({id: user.mobilecountry});
      const tokens = await Token.find({user:id});
      if (tokenMercadopago) {
        let customerName = await sails.helpers.parseName(user.fullName);
        if (tokens.length > 0) {
          let customer = await sails.helpers.payment.mercadopago.request(`/v1/customers/${tokens[0].customerId}`);
          if (customer.id) {
            let cardData = {
              'token': tokenMercadopago
            };
            let responseCard = await sails.helpers.payment.mercadopago.request(`/v1/customers/${customer.id}/cards`, cardData, 'POST');
            if (responseCard.id) {
              await Token.create({
                token: tokenMercadopago,
                customerId: customer.id,
                docType: req.body.tid,
                docNumber: req.body.dni,
                mask: `${responseCard.first_six_digits}******${responseCard.last_four_digits}`,
                frch: responseCard.payment_method.name,
                dues: 1,
                name: req.body.cardname,
                user: seller.id,
                default: true
              }).fetch();
              for (const token of tokens) {
                await Token.updateOne({id: token.id}).set({default: false});
              }
            }
          }
        } else {
          const customerData = {
            "email": seller.email,
            "first_name": customerName.name,
            "last_name": customerName.lastName + ' ' + customerName.secondLastName,
            "phone": {
              "area_code": String(country.prefix),
              "number": String(parseInt(user.mobile))
            },
            "identification": {
              "type": req.body.tid,
              "number": req.body.dni
            }
          };
          let responseCustomer = await sails.helpers.payment.mercadopago.request('/v1/customers', customerData, 'POST');
          if (responseCustomer.id) {
            let cardData = {
              'token': tokenMercadopago
            };
            let responseCard = await sails.helpers.payment.mercadopago.request(`/v1/customers/${responseCustomer.id}/cards`, cardData, 'POST');
            if (responseCard.id) {
              await Token.create({
                token: tokenMercadopago,
                customerId: responseCustomer.id,
                docType: req.body.tid,
                docNumber: req.body.dni,
                mask: `${responseCard.first_six_digits}******${responseCard.last_four_digits}`,
                frch: responseCard.payment_method.name,
                dues: 1,
                name: req.body.cardname,
                user: seller.id,
                default: true
              }).fetch();
            }
          }
        }
      } else {
        let creditInfo = {
          'card[number]': req.body.card,
          'card[exp_year]': req.body.year,
          'card[exp_month]': req.body.month,
          'card[cvc]': req.body.cvv
        };
        let token = await sails.helpers.payment.tokenize(creditInfo);
        if (tokens.length > 0) {
          const addDefaultCardCustomer = {
            franchise: token.card.name,
            token: token.id,
            mask: token.card.mask,
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
          }).fetch();
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
          }).fetch();
        }
      }
      return type && type === 'register' ? res.send('ok') : res.redirect(`/sellers/edit/${id}?success=Se agrego correctamente la tarjeta`);
    } catch (err) {
      return type && type === 'register' ? res.send({error: err.message}) : res.redirect(`/sellers/edit/${id}?error=${err.message}`);
    }
  },
  confirmationinvoice: async(req, res)=>{
    let action = req.param('action');
    if (action === 'subscription') {
      let subscription = await Subscription.findOne({reference: req.body.x_extra1});
      if(subscription){
        const epayco = await sails.helpers.payment.init('CC');
        const resultSubscription = await epayco.subscriptions.get(req.body.x_extra1);
        if (resultSubscription.status) {
          let state = await sails.helpers.orderState(req.body.x_response);
          let seller = await Seller.findOne({id: subscription.seller});
          await Subscription.updateOne({id: subscription.id}).set({
            state: resultSubscription.status_plan,
            currentPeriodStart: resultSubscription.current_period_start,
            currentPeriodEnd: resultSubscription.current_period_end
          });
          if (req.body.x_response === 'Aceptada') {
            let invoice = await Invoice.create({
              reference: req.body.x_ref_payco,
              invoice: req.body.x_id_factura,
              state: state,
              paymentMethod: req.body.x_franchise,
              total: req.body.x_amount,
              tax: req.body.x_tax,
              seller: subscription.seller
            }).fetch();

            // se crea factura en Siigo
            let dataSiigo = {
              idInvoice: invoice.id,
              observations: 'Se realiza cobro por suscripción de tu plan',
              code: '1009',
              description: 'Suscripción a plan de la plataforma',
              priceItem: parseFloat(req.body.x_amount),
              total: (parseFloat(req.body.x_amount) + ((parseFloat(req.body.x_amount)*15)/100)).toFixed(2)
            };
            await sails.helpers.siigo.createInvoice(seller.dni, dataSiigo);
          }

        }
      }
    } else {
      let invoice = await Invoice.findOne({reference:req.body.x_ref_payco});
      let state = await sails.helpers.orderState(req.body.x_response);
      if(invoice){
        if(invoice.state !== state){
          await Invoice.updateOne({id:invoice.id}).set({
            state: state
          });
        }
      }
    }
    return res.ok();
  },
  registersellerform: async(req, res)=>{
    let key = req.param('key');
    let countries = await Country.find();
    let currencies = await Currency.find();
    return res.view('pages/configuration/registerseller',{countries, currencies, key});
  },
  registerseller: async(req, res)=>{
    try{
      const moment = require('moment');
      const getMac = require('getmac');
      let country = await Country.findOne({id:req.body.country});

      let filename = null;
      let sellerData = {
        name: req.body.name.trim().toLowerCase(),
        dni: req.body.dni,
        contact: req.body.contact,
        email: req.body.email,
        phone: req.body.phone,
        active: false,
        currency: req.body.currency || null
      };
      try{
        filename = await sails.helpers.fileUpload(req,'logo',2000000,'images/sellers');
        if(filename.length>0){sellerData.logo = filename[0].filename;}
      }catch(err){
        console.log(err);
      }
      if (req.body.seller && req.body.user) {
        if (!seller.idSiigo) {
          await sails.helpers.siigo.createClient(req.body.seller);
        }
        await Seller.updateOne({id: req.body.seller}).set(sellerData);
        await User.updateOne({id: req.body.user}).set({
          emailAddress: req.body.email,
          password: await sails.helpers.passwords.hashPassword(req.body.password),
          fullName: req.body.contact,
          dni: req.body.dni,
          mobilecountry: country.id,
          mobile: req.body.phone,
          active: false
        });
        await TermsAndConditions.updateOne({seller: req.body.seller}).set({
          date: moment().format('YYYY-MM-DD'),
          hour: moment().format('LTS'),
          mac: getMac.default(),
          ip: require('ip').address(),
          accept: req.body.terms,
        });
        return res.send({error: null, seller: req.body.seller, user: req.body.user});
      } else {
        let seller = await Seller.findOrCreate({dni: sellerData.dni}, sellerData);
        let profile = await Profile.findOne({name:'operaciones'});
        let user = await User.findOrCreate({emailAddress: req.body.email},{
          emailAddress: req.body.email,
          emailStatus: 'confirmed',
          password: await sails.helpers.passwords.hashPassword(req.body.password),
          fullName: req.body.contact,
          dniType: 'NIT',
          dni: req.body.dni,
          mobilecountry: country.id,
          mobile: req.body.phone,
          mobileStatus: 'confirmed',
          seller: seller.id,
          profile: profile.id,
          active: false
        });
        await TermsAndConditions.findOrCreate({seller: seller.id}, {
          date: moment().format('YYYY-MM-DD'),
          hour: moment().format('LTS'),
          mac: getMac.default(),
          ip: require('ip').address(),
          accept: req.body.terms,
          seller: seller.id
        });
        if (!seller.idSiigo) {
          await sails.helpers.siigo.createClient(seller.id);
        }
        return res.send({error: null, seller: seller.id, user: user.id});
      }
    }catch(err){
      return res.status(404).send({error: err.message});
    }
  },
  collectregister: async(req, res)=>{
    try {
      const moment = require('moment');
      let id = req.param('seller');
      const key = req.body.key;
      const seller = await Seller.findOne({id: id}).populate('currency');
      const user = await User.findOne({seller: id, emailAddress: seller.email});
      const card = await Token.findOne({user: id, default: true});
      let resultPlan = await sails.helpers.encryptDecryptKey(key, 'decrypt');
      resultPlan = await Plan.findOne({id: resultPlan});
      if (card) {
        if (resultPlan) {
          if (seller.currency.isocode === 'MXN') {
            let exchangeRate = await sails.helpers.currencyConverter('USD', 'MXN');
            let price = (parseInt(resultPlan.price)*exchangeRate.result).toFixed(2);
            const subscriptionInfo = {
              auto_recurring: {
                frequency: 1,
                frequency_type: "months",
                transaction_amount: resultPlan.pricesubscriptionmx,
                currency_id: "MXN",
                start_date: new Date(moment().add(2, 'month').format()),
                end_date: new Date(moment().add(3, 'month').format()),
              },
              back_url: "https://1ecommerce.app",
              reason: 'Suscripcion Seller',
              payer_email: seller.email
            }
            let responseSubscription = await sails.helpers.payment.mercadopago.request(`/preapproval`, subscriptionInfo, 'POST');
            if (responseSubscription.id) {
              await Subscription.create({
                reference: responseSubscription.id,
                currentPeriodStart: moment(responseSubscription.auto_recurring.start_date).format('DD-MM-YYYY'),
                currentPeriodEnd: moment(responseSubscription.auto_recurring.end_date).format('DD-MM-YYYY'),
                state: responseSubscription.status,
                seller: seller.id
              }).fetch();
              const paymentInfo = {
                description: "Cobro por registro de cuenta",
                transaction_amount: price,
                token: card.token,
                installments: 1,
                payer: {
                  type: 'customer',
                  id: card.customerId
                }
              };
              let responsePayment = await sails.helpers.payment.mercadopago.request(`/v1/payments`, paymentInfo, 'POST');
              if (responsePayment.id) {
                if(responsePayment.status === 'approved'){
                  await User.updateOne({id: user.id}).set({active: true});
                  await Seller.updateOne({id: seller.id}).set({active: true, plan: resultPlan.id});
                  let state = await sails.helpers.orderState(responsePayment.status);
                  await Invoice.create({
                    reference: responsePayment.id,
                    invoice: 'CR-Register',
                    state: state,
                    paymentMethod: responsePayment.payment_method_id,
                    total: responsePayment.transaction_amount,
                    tax: responsePayment.taxes_amount,
                    seller: seller.id
                  }).fetch();
                  req.session.user = user;
                  req.session.user.rights = await sails.helpers.checkPermissions(user.profile);
                  return res.send({});
                } else {
                  return res.send({error: 'La transacción no fue aprobada'});
                }
              }
            }
          } else {
            let exchangeRate = await sails.helpers.currencyConverter('USD', 'COP');
            let price = (parseInt(resultPlan.price)*exchangeRate.result).toFixed(2);
            // se crea la subscrion en epayco
            let subscriptionInfo = {
              id_plan: resultPlan.id,
              customer: card.customerId,
              token_card: card.token,
              doc_type: card.docType,
              doc_number: card.docNumber,
              url_confirmation: 'https://1ecommerce.app/confirmationinvoice/subscription',
              method_confirmation: 'POST'
            };
            const subscription = await sails.helpers.payment.subscription(subscriptionInfo, 'CC');
            if (subscription.success) {
              //se hace el cobro del setup
              const paymentInfo = {
                token_card: card.token,
                customer_id: card.customerId,
                doc_type: card.docType,
                doc_number: card.docNumber,
                name: card.name,
                last_name: ' ',
                email: seller.email,
                bill: `CR-Register-${seller.name}`,
                description: `Cobro por registro de cuenta`,
                value: price,
                tax: ((price/1.19)*0.19).toString(),
                tax_base: (price/1.19).toString(),
                currency: 'COP',
                dues: '1',
                ip:require('ip').address(),
                url_confirmation: 'https://1ecommerce.app/confirmationinvoice/payment',
                method_confirmation: 'POST',
              };
              let payment = await sails.helpers.payment.payment({mode:'CC', info:paymentInfo});
              if(payment.success && payment.data.estado === 'Aceptada'){
                let state = await sails.helpers.orderState(payment.data.estado);
                let invoice = await Invoice.create({
                  reference: payment.data.ref_payco,
                  invoice: payment.data.factura,
                  state: state,
                  paymentMethod: payment.data.franquicia,
                  total: payment.data.valor,
                  tax: payment.data.iva,
                  seller: seller.id
                }).fetch();

                // Se crea factura en siigo
                let dataSiigo = {
                  idInvoice: invoice.id,
                  observations: 'Se realiza cobro por registro de cuenta',
                  code: '1009',
                  description: 'Setup de la plataforma',
                  priceItem: parseFloat(price),
                  total: (parseFloat(price) + ((parseFloat(price)*15)/100)).toFixed(2)
                };

                await sails.helpers.siigo.createInvoice(seller.dni, dataSiigo);

                // se activa subscricion en epayco
                const chargeSubscription = {
                  id_plan: resultPlan.id,
                  customer: card.customerId,
                  token_card: card.token,
                  url_confirmation: 'https://1ecommerce.app/confirmationinvoice/subscription',
                  doc_type: card.docType,
                  doc_number: card.docNumber,
                  ip: require('ip').address()
                };

                const epayco = await sails.helpers.payment.init('CC');
                const resultCharge = await epayco.subscriptions.charge(chargeSubscription);

                if (resultCharge.periodEnd) {
                  await Subscription.create({
                    reference: subscription.id,
                    currentPeriodStart: subscription.current_period_start,
                    currentPeriodEnd: resultCharge.periodEnd,
                    state: resultCharge.status,
                    seller: seller.id,
                    plan: resultPlan.id
                  }).fetch();
                }
                let links = ['https://meetings.hubspot.com/juan-pinzon', 'https://meetings.hubspot.com/alejandra-vaquiro-acuna'];
                let position = Math.floor(Math.random() * (2 - 0)) + 0;
                await sails.helpers.sendEmail('email-payments',{seller: seller, date: moment().format('DD-MM-YYYY'),invoice: invoice, plan: resultPlan.name.toUpperCase(), link: links[position]}, seller.email, 'Comfirmación cobro Setup de 1Ecommerce', 'email-notification');
                await User.updateOne({id: user.id}).set({active: true});
                await Seller.updateOne({id: seller.id}).set({active: true, plan: resultPlan.id});
                req.session.user = user;
                req.session.user.rights = await sails.helpers.checkPermissions(user.profile);
                return res.send({});
              } else {
                return res.send({error: payment.status ? payment.data.respuesta : payment.data.description});
              }
            } else {
              return res.send({error: subscription.status ? subscription.data.respuesta : subscription.data.description});
            }
          }
        } else {
          return res.send({error: 'No existe un Plan'});
        }
      } else {
        return res.send({error: 'No cuenta con Tarjeta para hacer el cobro'});
      }
    } catch (error) {
      console.log(error);
      return res.send({error: error.menssage});
    }
  },
  generateKey: async(req, res)=>{
    let error = null;
    let key = '';
    try {
      if (req.body.name) {
        const plan = await Plan.findOne({name: req.body.name});
        key = await sails.helpers.encryptDecryptKey(plan.id, 'encrypt');
      } else{
        key = await sails.helpers.encryptDecryptKey(req.body.text, 'encrypt');
      }
    } catch (err) {
      error = err;
    }
    if (error !== null) {
      return res.send({error, key});
    } else {
      return res.send({error, key});
    }
  },
  generateInvoice: async(req, res)=>{
    try {
      let id = req.param('id') ? req.param('id') : null;
      let invoice = await Invoice.findOne({id: id}).populate('seller');
      let invoicePDF = null;
      if (invoice.idSiigo) {
        invoicePDF = await sails.helpers.siigo.getInvoice(invoice.idSiigo);
      }
      return res.view('pages/pdf',{guia: invoicePDF, label:null});
    } catch (err) {
      return res.view('pages/pdf',{guia: null, label:null});
    }
  },
  subscriptions: async(req, res)=>{
    let seller = req.param('seller');
    let moment = require('moment');
    let invoices = await Invoice.find({seller: seller}).populate('state').sort('createdAt DESC');
    let subscriptions = await Subscription.find({seller: seller}).populate('plan');
    return res.view('pages/sellers/subscriptions',{layout:'layouts/admin', moment, invoices, subscriptions, seller});
  },
  cancelsubscription: async(req, res)=>{
    try {
      let reference = req.body.reference;
      const seller = await Seller.findOne({id: req.body.seller});
      const user = await User.findOne({seller: seller.id, emailAddress: seller.email});
      const epayco = await sails.helpers.payment.init('CC');
      let resultCancel = await epayco.subscriptions.cancel(reference);
      if (resultCancel.success) {
        await User.updateOne({id: user.id}).set({active: false});
        await Seller.updateOne({id: seller.id}).set({active: false});
        await Subscription.updateOne({reference: reference, seller: seller}).set({
          state: 'inactive'
        });
        return res.send({message: resultCancel.menssage});
      } else {
        return res.send({error: resultCancel.status ? resultCancel.data.respuesta : resultCancel.data.description});
      }
    } catch (err) {
      console.log(err);
      return res.send({error: err.menssage});
    }
  },
  upgradepayment: async(req, res)=>{
    try {
      let plan = req.body.plan;
      const seller = await Seller.findOne({id: req.body.seller}).populate('currency');
      const user = await User.findOne({seller: seller.id, emailAddress: seller.email});
      const card = await Token.findOne({user: seller.id, default: true});
      let resultPlan = await Plan.findOne({id: plan});
      let subscriptionsActive = await Subscription.find({seller: seller.id, state: 'active'});

      if (card) {
        if (resultPlan) {
          const epayco = await sails.helpers.payment.init('CC');
          let resultCancel = await epayco.subscriptions.cancel(reference);
          if (resultCancel.success) {
            let exchangeRate = await sails.helpers.currencyConverter('USD', 'COP');
            let price = (parseInt(resultPlan.price)*exchangeRate.result).toFixed(2);
            let subscriptionInfo = {
              id_plan: resultPlan.id,
              customer: card.customerId,
              token_card: card.token,
              doc_type: card.docType,
              doc_number: card.docNumber,
              url_confirmation: 'https://1ecommerce.app/confirmationinvoice/subscription',
              method_confirmation: 'POST'
            };
            const subscription = await sails.helpers.payment.subscription(subscriptionInfo, 'CC');
            if (subscription.success) {
               // se activa subscricion en epayco
               const chargeSubscription = {
                id_plan: resultPlan.id,
                customer: card.customerId,
                token_card: card.token,
                url_confirmation: 'https://1ecommerce.app/confirmationinvoice/subscription',
                doc_type: card.docType,
                doc_number: card.docNumber,
                ip: require('ip').address()
              };
              const resultCharge = await epayco.subscriptions.charge(chargeSubscription);
  
              if (resultCharge.periodEnd) {
                for (const subscrit of subscriptionsActive) {
                  await Subscription.updateOne({id: subscrit.id}).set({state: 'inactive'});
                }
  
                await Subscription.create({
                  reference: subscription.id,
                  currentPeriodStart: subscription.current_period_start,
                  currentPeriodEnd: resultCharge.periodEnd,
                  state: resultCharge.status,
                  seller: seller.id,
                  plan: resultPlan.id
                }).fetch();
  
                // let invoice = await Invoice.create({
                //   reference: payment.data.ref_payco,
                //   invoice: payment.data.factura,
                //   state: state,
                //   paymentMethod: payment.data.franquicia,
                //   total: payment.data.valor,
                //   tax: payment.data.iva,
                //   seller: seller.id
                // }).fetch();
  
                // // Se crea factura en siigo
                // let dataSiigo = {
                //   idInvoice: invoice.id,
                //   observations: 'Se realiza cobro por cambio de plan',
                //   code: '1009',
                //   description: 'Cambio de plan en la plataforma',
                //   priceItem: parseFloat(price),
                //   total: (parseFloat(price) + ((parseFloat(price)*15)/100)).toFixed(2)
                // };
  
                // await sails.helpers.siigo.createInvoice(seller.dni, dataSiigo);
                let links = ['https://meetings.hubspot.com/juan-pinzon', 'https://meetings.hubspot.com/alejandra-vaquiro-acuna'];
                let position = Math.floor(Math.random() * (2 - 0)) + 0;
                await sails.helpers.sendEmail('email-payments',{seller: seller, date: moment().format('DD-MM-YYYY'), invoice: invoice, plan: resultPlan.name.toUpperCase(), link: links[position]}, seller.email, 'Comfirmación de tu nuevo cambio de plan de 1Ecommerce', 'email-notification');
              }
            } else {
              return res.send({error: subscription.status ? subscription.data.respuesta : subscription.data.description});
            }
          } else {
            return res.send({error: resultCancel.status ? resultCancel.data.respuesta : resultCancel.data.description});
          }
        } else {
          return res.send({error: 'No existe un Plan'});
        }
      } else {
        return res.send({error: 'No cuenta con tarjeta para realizar el cambio del plan'});
      }
    } catch (err) {
      console.log(err);
      return res.send({error: err.menssage});
    }
  },
};
