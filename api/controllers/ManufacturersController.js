/**
 * ManufacturersController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {

  listbrands: async function(req, res){
    let error=null;
    let action = req.param('action') ? req.param('action') : null;
    let id = req.param('id') ? req.param('id') : null;
    let marcas = await Manufacturer.find();
    let marca=null;
    if(id){
      marca = await Manufacturer.findOne({id:id});
    }
    res.view('pages/catalog/manufacturers',{marcas:marcas,action:action,error:error,marca:marca});
  },
  addbrand: async function(req, res){
    let error=null;
    let isActive = (req.body.activo==='on') ? true : false;
    try{
      let filename = await sails.helpers.fileUpload(req,'logo',2000000,'assets/images/brands');
      await Manufacturer.create({
        name:req.body.nombre.trim().toLowerCase(),
        logo: filename[0],
        description:req.body.descripcion,
        active:isActive});
    }catch(err){
      error=err;
      if(err.code==='badRequest'){
        await Manufacturer.create({
          name:req.body.nombre.trim().toLowerCase(),
          description:req.body.descripcion,
          active:isActive});
      }
    }

    if (error===undefined || error===null || error.code==='badRequest'){
      return res.redirect('/manufacturers');
    }else{
      return res.redirect('/manufacturers?error='+error);
    }
  },
  brandstate: async function(req, res){
    if (!req.isSocket) {
      return res.badRequest();
    }
    var id = req.param('id');
    var state = req.param('active');
    var updatedBrand = await Manufacturer.updateOne({id:id}).set({active:state});
    return res.send(updatedBrand);
  },
};

