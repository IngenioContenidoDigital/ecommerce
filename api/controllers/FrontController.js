/**
 * SliderController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
  listslider: async (req, res) =>{
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if(rights.name!=='superadmin' && !_.contains(rights.permissions,'sliders')){
      throw 'forbidden';
    }
    let error= req.param('error') ? req.param('error') : null;
    let slide = null;
    let sellers = null;
    let action = req.param('action') ? req.param('action') : null;
    let id = req.param('id') ? req.param('id') : null;
    let sliders = null;
    if(id){
      slide = await Slider.findOne({id:id});
    }
    if(rights.name!=='superadmin' && rights.name!=='admin'){
      sliders = await Slider.find({seller:req.session.user.seller});
      sellers = await Seller.find({seller:req.session.user.seller});
    }else{
      sellers = await Seller.find();
      sliders = await Slider.find();
    }
    let colors = await Color.find();
    let positions = [{id:'main',name:'Principal'}, {id:'featured',name:'Destacado'},{id:'vertical',name:'Vertical'},{id:'bottom',name:'Abajo'},{id:'wide',name:'Ancho'},{id:'middle',name:'Medio'},{id:'tall',name:'Alto'}];
    return res.view('pages/configuration/slider',{layout:'layouts/admin',sliders:sliders,action:action,slide:slide,colors:colors,positions:positions,error:error,sellers:sellers});
  },
  createslider:async(req, res) =>{
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if(rights.name!=='superadmin' && !_.contains(rights.permissions,'sliders')){
      throw 'forbidden';
    }
    let error=null;
    let isActive = (req.body.activo==='on') ? true : false;
    try{
      let filename = await sails.helpers.fileUpload(req,'image',2000000,'images/slides');
      await Slider.create({
        name:req.body.name.trim().toLowerCase(),
        image: filename[0].filename,
        text:req.body.text,
        textColor:(req.body.color) ? req.body.color : (await Color.findOne({name:'negro'})).id,
        position:req.body.position,
        seller:req.body.seller,
        url:req.body.url,
        active:isActive});
    }catch(err){
      error=err;
    }
    setTimeout(() => { return; }, 3500);
    if (error===undefined || error===null){
      return res.redirect('/sliders');
    }else{
      return res.redirect('/sliders?error='+error);
    }
  },
  editslider:async(req,res)=>{
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    let id = req.param('id');
    if(rights.name!=='superadmin' && !_.contains(rights.permissions,'sliders')){
      throw 'forbidden';
    }
    let error=null;
    let isActive = (req.body.activo==='on') ? true : false;
    try{
      let filename = await sails.helpers.fileUpload(req,'image',2000000,'images/slides');
      await Slider.updateOne({id:id}).set({
        name:req.body.name.trim().toLowerCase(),
        image: filename[0].filename,
        position:req.body.position,
        text:req.body.text,
        textColor:(req.body.color) ? req.body.color : (await Color.findOne({name:'negro'})).id,
        seller:req.body.seller,
        url:req.body.url,
        active:isActive});
    }catch(err){
      error=err;
      if(err.code==='badRequest'){
        await Slider.updateOne({id:id}).set({
          name:req.body.name.trim().toLowerCase(),
          position:req.body.position,
          text:req.body.text,
          textColor:(req.body.color) ? req.body.color : (await Color.findOne({name:'negro'})).id,
          seller:req.body.seller,
          url:req.body.url,
          active:isActive});
      }
    }
    setTimeout(() => { return; }, 3500);
    if (error===undefined || error===null || error.code==='badRequest'){
      return res.redirect('/sliders');
    }else{
      return res.redirect('/sliders?error='+error);
    }
  },
  sliderstate: async function(req, res){
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if(rights.name!=='superadmin' && !_.contains(rights.permissions,'sliders')){
      throw 'forbidden';
    }
    if (!req.isSocket) {
      return res.badRequest();
    }
    var id = req.param('id');
    var state = req.body.active;
    var updatedSlider = await Slider.updateOne({id:id}).set({active:state});
    return res.send(updatedSlider);
  },
  sliderdelete:async(req,res)=>{
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if(rights.name!=='superadmin' && !_.contains(rights.permissions,'sliders')){
      throw 'forbidden';
    }
    let error = null;
    let id = req.param('id');
    try{
      await Slider.destroyOne({id:id});
    }catch(err){
      error=err;
    }
    if (error===undefined || error===null){
      return res.redirect('/sliders');
    }else{
      return res.redirect('/sliders?error='+error);
    }
  },
  account: async (req, res)=>{
    let seller = null;
    if(req.hostname!=='iridio.co' && req.hostname!=='demo.1ecommerce.app' && req.hostname!=='localhost' && req.hostname!=='1ecommerce.app'){seller = await Seller.findOne({domain:req.hostname/*'sanpolos.com'*/});}
    return res.view('pages/account/account',{seller:seller});
  },
  user: async (req, res)=>{
    let seller = null;
    if(req.hostname!=='iridio.co' && req.hostname!=='demo.1ecommerce.app' && req.hostname!=='localhost' && req.hostname!=='1ecommerce.app'){seller = await Seller.findOne({domain:req.hostname/*'sanpolos.com'*/});}
    let user = await User.findOne({id:req.param('id')});
    return res.view('pages/account/user',{user:user, seller:seller});
  },
  orders: async (req, res)=>{
    let moment = require('moment');
    let seller = null;
    if(req.hostname!=='iridio.co' && req.hostname!=='demo.1ecommerce.app' && req.hostname!=='localhost' && req.hostname!=='1ecommerce.app'){seller = await Seller.findOne({domain:req.hostname/*'sanpolos.com'*/});}
    let orders = await Order.find({customer:req.session.user.id})
    .populate('currentstatus')
    .populate('seller')
    .populate('addressDelivery')
    .sort('createdAt DESC');

    for(let o of orders){
      o.currentstatus = await OrderState.findOne({id:o.currentstatus.id}).populate('color');
      o.items = await OrderItem.find({order:o.id}).populate('product').populate('productvariation');
      for(let i of o.items){
        i.product.images = (await ProductImage.find({product:i.product.id,cover:1}))[0];
        i.productvariation.variation = await Variation.findOne({id:i.productvariation.variation});
      }
      o.carrier = await Carrier.findOne({id:o.carrier});
      o.history = await OrderHistory.find({order:o.id}).sort('createdAt ASC').populate('state');
    }
    return res.view('pages/account/orders',{orders:orders,moment:moment,seller:seller});
  }
};

