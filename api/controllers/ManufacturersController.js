/**
 * ManufacturersController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {

  listbrands: async function(req, res){
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if(rights.name!=='superadmin' && !_.contains(rights.permissions,'listbrands')){
      throw 'forbidden';
    }
    let error=null;
    let action = req.param('action') ? req.param('action') : null;
    let id = req.param('id') ? req.param('id') : null;
    let marcas = await Manufacturer.find();
    let marca=null;
    if(id){
      marca = await Manufacturer.findOne({id:id});
    }
    res.view('pages/catalog/manufacturers',{layout:'layouts/admin',marcas:marcas,action:action,error:error,marca:marca});
  },
  addbrand: async function(req, res){
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if(rights.name!=='superadmin' && !_.contains(rights.permissions,'addbrand')){
      throw 'forbidden';
    }
    let error=null;

    let isActive = (req.body.activo==='on') ? true : false;
    try{
      let filename = await sails.helpers.fileUpload(req,'logo',2000000,'images/brands');
      await Manufacturer.create({
        name:req.body.nombre.trim().toLowerCase(),
        logo: filename[0].filename,
        linioname: await sails.helpers.channel.linio.checkBrand(req.body.nombre.trim().toLowerCase()),
        description:req.body.descripcion,
        url:((req.body.nombre.trim().toLowerCase()).replace(/\s/gi,'-')).replace(/[^a-zA-Z0-9_-]/g,''),
        active:isActive
      });
    }catch(err){
      error=err;
      if(err.code==='badRequest'){
        await Manufacturer.create({
          name:req.body.nombre.trim().toLowerCase(),
          linioname: await sails.helpers.channel.linio.checkBrand(req.body.nombre.trim().toLowerCase()),
          description:req.body.descripcion,
          active:isActive,
          url:((req.body.nombre.trim().toLowerCase()).replace(/\s/gi,'-')).replace(/[^a-zA-Z0-9_-]/g,'')
        });
      }
    }

    if (error===undefined || error===null || error.code==='badRequest'){
      return res.redirect('/manufacturers');
    }else{
      return res.redirect('/manufacturers?error='+error);
    }
  },
  brandstate: async function(req, res){
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if(rights.name!=='superadmin' && !_.contains(rights.permissions,'brandstate')){
      throw 'forbidden';
    }
    if (!req.isSocket) {
      return res.badRequest();
    }
    var id = req.param('id');
    var state = req.param('active');
    var updatedBrand = await Manufacturer.updateOne({id:id}).set({active:state});
    return res.send(updatedBrand);
  },
  editbrand: async (req,res)=>{
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if(rights.name!=='superadmin' && !_.contains(rights.permissions,'editbrand')){
      throw 'forbidden';
    }
    let error=null;
    let isActive = (req.body.activo==='on') ? true : false;
    let id = req.param('id');

    try{
      let filename = await sails.helpers.fileUpload(req,'logo',2000000,'images/brands');
      await Manufacturer.updateOne({id:id}).set({
        name:req.body.nombre.trim().toLowerCase(),
        linioname: await sails.helpers.channel.linio.checkBrand(req.body.nombre.trim().toLowerCase()),
        description:req.body.description,
        logo: filename[0].filename,
        active:isActive,
        url:((req.body.nombre.trim().toLowerCase()).replace(/\s/gi,'-')).replace(/[^a-zA-Z0-9_-]/g,'')});
    }catch(err){
      error=err;
      if(err.code==='badRequest'){
        await Manufacturer.updateOne({id:id}).set({
          name:req.body.nombre.trim().toLowerCase(),
          linioname: await sails.helpers.channel.linio.checkBrand(req.body.nombre.trim().toLowerCase()),
          description:req.body.description,
          url:((req.body.nombre.trim().toLowerCase()).replace(/\s/gi,'-')).replace(/[^a-zA-Z0-9_-]/g,''),
          active:isActive});
      }
    }
    setTimeout(() => { return; }, 2000);
    if (error===undefined || error===null || error.code==='badRequest'){
      return res.redirect('/manufacturers');
    }else{
      return res.redirect('/manufacturers?error='+error);
    }
  },
  findbrands: async (req, res)=>{
    let id = req.param('id');
    const productsSeller = await Product.find({seller: id}).populate('manufacturer');
    let brands = [];
    for (const product of productsSeller) {
      if(brands.length === 0 || !brands.some(brand => brand.id === product.manufacturer.id)){
        brands.push(product.manufacturer);
      }
    }
    return res.send(brands);
  }
};

