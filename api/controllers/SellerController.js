/**
 * SellerController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
  showsellers: async function(req, res){
    let error= req.param('error') ? req.param('error') : null;
    let seller = null;
    let action = req.param('action') ? req.param('action') : null;
    let id = req.param('id') ? req.param('id') : null;
    let sellers = await Seller.find();
    if(id){
      seller = await Seller.findOne({id:id});
    }
    res.view('pages/sellers/sellers',{sellers:sellers,action:action,seller:seller,error:error});
  },
  createseller: async function(req, res){
    let error=null;
    let isActive = (req.body.activo==='on') ? true : false;
    try{
      let filename = await sails.helpers.fileUpload(req,'logo',2000000,'assets/images/sellers');
      await Seller.create({
        name:req.body.name.trim().toLowerCase(),
        dni:req.body.dni,
        contact:req.body.contact,
        email:req.body.email,
        phone:req.body.phone,
        domain:req.body.url,
        logo: filename[0],
        active:isActive});
    }catch(err){
      error=err;
      if(err.code==='badRequest'){
        await Seller.create({
          name:req.body.name.trim().toLowerCase(),
          dni:req.body.dni,
          contact:req.body.contact,
          email:req.body.email,
          phone:req.body.phone,
          domain:req.body.url,
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
    let error=null;
    let isActive = (req.body.activo==='on') ? true : false;
    let id = req.param('id');
    try{
      let filename = await sails.helpers.fileUpload(req,'logo',2000000,'assets/images/sellers');
      await Seller.updateOne({id:id}).set({
        name:req.body.name.trim().toLowerCase(),
        dni:req.body.dni,
        contact:req.body.contact,
        email:req.body.email,
        phone:req.body.phone,
        domain:req.body.url,
        logo: filename[0],
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
          domain:req.body.url,
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
    if (!req.isSocket) {
      return res.badRequest();
    }
    var id = req.param('id');
    var state = req.body.active;
    var updatedSeller = await Seller.updateOne({id:id}).set({active:state});
    return res.send(updatedSeller);
  },
};

