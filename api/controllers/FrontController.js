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
    if(rights.name!=='superadmin'){
      sliders = await Slider.find({seller:req.session.user.seller});
      sellers = await Seller.find({seller:req.session.user.seller});
    }else{
      sellers = await Seller.find();
      sliders = await Slider.find();
    }
    return res.view('pages/configuration/slider',{layout:'layouts/admin',sliders:sliders,action:action,slide:slide,error:error,sellers:sellers});
  },
  createslider:async(req, res) =>{
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if(rights.name!=='superadmin' && !_.contains(rights.permissions,'sliders')){
      throw 'forbidden';
    }
    let error=null;
    let isActive = (req.body.activo==='on') ? true : false;
    try{
      let filename = await sails.helpers.fileUpload(req,'image',2000000,'assets/images/slides');
      await Slider.create({
        name:req.body.name.trim().toLowerCase(),
        image: filename[0],
        seller:req.body.seller,
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
      let filename = await sails.helpers.fileUpload(req,'image',2000000,'assets/images/slides');
      await Slider.updateOne({id:id}).set({
        name:req.body.name.trim().toLowerCase(),
        image: filename[0],
        seller:req.body.seller,
        active:isActive});
    }catch(err){
      error=err;
      if(err.code==='badRequest'){
        await Slider.updateOne({id:id}).set({
          name:req.body.name.trim().toLowerCase(),
          seller:req.body.seller,
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
  }
};

