/**
 * ManufacturersController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {

  listfeatures: async function(req, res){
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if(rights.name!=='superadmin' && !_.contains(rights.permissions,'listfeatures')){
      throw 'forbidden';
    }
    let error=null;
    let action = req.param('action') ? req.param('action') : null;
    let id = req.param('id') ? req.param('id') : null;
    let features = await Feature.find();
    let feature=null;
    if(id){
      feature = await Feature.findOne({id:id}).populate('categories');
    }
    let category = await Category.findOne({name:'inicio'});

    res.view('pages/catalog/features',{layout:'layouts/admin',features:features, action:action, error:error, feature:feature, category:category});
  },
  addfeature: async function(req, res){
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if(rights.name!=='superadmin' && !_.contains(rights.permissions,'addfeature')){
      throw 'forbidden';
    }
    let error=null;
    let isActive = (req.body.activo==='on') ? true : false;
    let categories = req.body.categories;
    try{
      if(categories.length>0){
        let feature = await Feature.create({
          name:req.body.nombre.trim().toLowerCase(),
          description:req.body.descripcion,
          active: isActive
        }).fetch();
        await Feature.addToCollection(feature.id,'categories').members(categories);
      }
    }catch(err){
      error=err;
    }

    if (error===undefined || error===null || error.code==='badRequest'){
      return res.redirect('/features');
    }else{
      return res.redirect('/features?error='+error);
    }
  },
  editfeature: async (req,res)=>{
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if(rights.name!=='superadmin' && !_.contains(rights.permissions,'editfeature')){
      throw 'forbidden';
    }
    let error=null;
    let isActive = (req.body.activo==='on') ? true : false;
    let id = req.param('id');
    let categories = req.body.categories;

    try{
      let feature = await Feature.updateOne({id:id}).set({
        name:req.body.nombre.trim().toLowerCase(),
        description:req.body.description,
        active:isActive
      });
      await Feature.replaceCollection(feature.id,'categories').members(categories);

    }catch(err){
      error=err;
    }
    if (error===undefined || error===null || error.code==='badRequest'){
      return res.redirect('/features');
    }else{
      return res.redirect('/features?error='+error);
    }
  },
  featurestate: async function(req, res){
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if(rights.name!=='superadmin' && !_.contains(rights.permissions,'featurestate')){
      throw 'forbidden';
    }
    if (!req.isSocket) {
      return res.badRequest();
    }
    var id = req.param('id');
    var state = req.param('active');
    var updatedFeature = await Feature.updateOne({id:id}).set({active:state});
    return res.send(updatedFeature);
  },
  deletefeature:async(req, res)=>{
    if (!req.isSocket) {
      return res.badRequest();
    }
    let feature = await Feature.findOne({id:req.body.feature}).populate('categories');
    let result = feature.categories.map(a => a.id);
    await Feature.removeFromCollection(feature.id,'categories').members(result);
    await Feature.destroyOne({id:feature.id});
    await ProductFeature.destroy({feature:feature.id});
    return res.send('deleted');
  },
  addproductfeature:async(req, res)=>{
    if (!req.isSocket) {
      return res.badRequest();
    }
    let data = req.body.data;
    try{
      for (let index = 0; index < data.length; index++) {
        const element = data[index];
        let product = element.product;
        let feature = element.feature;
        let value = element.value;
        let product_feature = null;

        let exists = await ProductFeature.findOne({product:product, feature:feature});
        if (!exists) {
          product_feature = await ProductFeature.create({
            product:product,
            feature:feature,
            value:value
          });
        } else {
          product_feature = await ProductFeature.updateOne({product:product, feature:feature}).set({
            product:product,
            feature:feature,
            value:value
          });
        }
        
      }

    }catch(err){
      console.log(err);
      return res.badRequest();
    }
    return res.send();
  }
};

