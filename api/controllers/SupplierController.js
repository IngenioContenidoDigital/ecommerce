/**
 * SupplierController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
  showsuppliers: async function(req, res){
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if(rights.name!=='superadmin' && !_.contains(rights.permissions,'showsuppliers')){
      throw 'forbidden';
    }
    let error= req.param('error') ? req.param('error') : null;
    let supplier = null;
    let action = req.param('action') ? req.param('action') : null;
    let id = req.param('id') ? req.param('id') : null;
    let suppliers = await Supplier.find();
    if(id){
      supplier = await Supplier.findOne({id:id});
    }
    res.view('pages/catalog/suppliers',{layout:'layouts/admin',suppliers:suppliers,action:action,supplier:supplier,error:error});
  },
  createsupplier: async function(req, res){
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if(rights.name!=='superadmin' && !_.contains(rights.permissions,'createsupplier')){
      throw 'forbidden';
    }
    let error=null;
    let isActive = (req.body.activo==='on') ? true : false;
    try{
      await Supplier.create({
        name:req.body.name.trim().toLowerCase(),
        dni:req.body.dni,
        contact:req.body.contact,
        email:req.body.email,
        phone:req.body.phone,
        active:isActive});
    //Agregar la Colección Seller para Habilitar los Proveedores únicamente a los Sellers autorizados
    }catch(err){
      error=err;
    }
    if (error===undefined || error===null){
      return res.redirect('/suppliers');
    }else{
      return res.redirect('/suppliers?error='+error);
    }
  },
  editsupplier: async function(req, res){
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if(rights.name!=='superadmin' && !_.contains(rights.permissions,'editsupplier')){
      throw 'forbidden';
    }
    let error=null;
    let isActive = (req.body.activo==='on') ? true : false;
    let id = req.param('id');
    try{
      await Supplier.updateOne({id:id}).set({
        name:req.body.name.trim().toLowerCase(),
        dni:req.body.dni,
        contact:req.body.contact,
        email:req.body.email,
        phone:req.body.phone,
        active:isActive});
    }catch(err){
      error=err;
    }

    if (error===undefined || error===null){
      return res.redirect('/suppliers');
    }else{
      return res.redirect('/suppliers?error='+error);
    }
  },
  supplierstate: async function(req, res){
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if(rights.name!=='superadmin' && !_.contains(rights.permissions,'supplierstate')){
      throw 'forbidden';
    }
    if (!req.isSocket) {
      return res.badRequest();
    }
    var id = req.param('id');
    var state = req.body.active;
    var updatedSupplier = await Supplier.updateOne({id:id}).set({active:state});
    return res.send(updatedSupplier);
  },
};

