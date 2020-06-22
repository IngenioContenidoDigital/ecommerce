/**
 * SellerController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
  showsellers: async function(req, res){
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if(rights.name!=='superadmin' && !_.contains(rights.permissions,'showsellers')){
      throw 'forbidden';
    }
    let error= req.param('error') ? req.param('error') : null;
    let seller = null;
    let action = req.param('action') ? req.param('action') : null;
    let id = req.param('id') ? req.param('id') : null;
    let sellers = await Seller.find();
    if(id){
      seller = await Seller.findOne({id:id}).populate('mainAddress');
      if(seller.mainAddress!==undefined && seller.mainAddress!==null){
        seller.mainAddress = await Address.findOne({id:seller.mainAddress.id})
        .populate('country')
        .populate('region')
        .populate('city');
      }
    }
    let countries = await Country.find();
    res.view('pages/sellers/sellers',{layout:'layouts/admin',sellers:sellers,action:action,seller:seller,error:error,countries:countries});
  },
  createseller: async function(req, res){
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if(rights.name!=='superadmin' && !_.contains(rights.permissions,'createseller')){
      throw 'forbidden';
    }
    let error=null;
    let isActive = (req.body.activo==='on') ? true : false;
    let address = await Address.create({
      name:'Principal '+req.body.name.trim().toLowerCase(),
      addressline1:req.body.addressline1,
      addressline2:req.body.addressline2,
      country:req.body.country,
      region:req.body.region,
      city:req.body.city,
      zipcode:req.body.zipcode,
      notes:req.body.notes
    }).fetch();
    try{
      let filename = await sails.helpers.fileUpload(req,'logo',2000000,'images/sellers');
      await Seller.create({
        name:req.body.name.trim().toLowerCase(),
        dni:req.body.dni,
        contact:req.body.contact,
        email:req.body.email,
        tagManager: req.body.tagManager,
        phone:req.body.phone,
        domain:req.body.url,
        logo: filename[0].filename,
        mainAddress:address.id,
        active:isActive});
    }catch(err){
      error=err;
      if(err.code==='badRequest'){
        await Seller.create({
          name:req.body.name.trim().toLowerCase(),
          dni:req.body.dni,
          contact:req.body.contact,
          email:req.body.email,
          tagManager: req.body.tagManager,
          phone:req.body.phone,
          domain:req.body.url,
          mainAddress:address.id,
          active:isActive});
      }
    }
    setTimeout(() => { return; }, 2000);
    if (error===undefined || error===null || error.code==='badRequest'){
      return res.redirect('/sellers');
    }else{
      return res.redirect('/sellers?error='+error);
    }
  },
  editseller: async function(req, res){
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if(rights.name!=='superadmin' && !_.contains(rights.permissions,'editseller')){
      throw 'forbidden';
    }
    let error=null;
    let isActive = (req.body.activo==='on') ? true : false;
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
        active:isActive});
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
          active:isActive});
      }
    }
    setTimeout(() => { return; }, 2000);
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
    let seller = await Seller.findOne({id:req.param('id')});
    let integrations = await Integrations.find({seller:seller.id});
    return res.view('pages/sellers/integrations',{layout:'layouts/admin',seller:seller,integrations:integrations});
  },
  setintegration:async (req,res)=>{
    let seller = req.param('seller');
    let channel = req.param('channel');
    Integrations.findOrCreate({seller:seller,channel:channel},{
      channel:channel,
      url:req.body.url,
      user:req.body.user,
      key:req.body.key,
      secret:req.body.secret ? req.body.secret : '',
      seller:seller
    }).exec(async (err, record, created)=>{
      if(err){return res.redirect('/sellers?error='+err);}
      if(!created){
        await Integrations.updateOne({id:record.id}).set({
          channel:channel,
          url:req.body.url,
          user:req.body.user,
          key:req.body.key,
          secret:req.body.secret ? req.body.secret : '',
          seller:seller
        });
      }
      return res.redirect('/sellers');
    });
  }
};

