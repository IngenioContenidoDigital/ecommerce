/**
 * CategoryController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
  showcategories: async function (req,res) {
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if(rights.name!=='superadmin' && !_.contains(rights.permissions,'showcategories')){
      throw 'forbidden';
    }
    var error = null;
    let action = null;
    let childs = null;
    let id = null;
    let category = null;
    let parentId = 0;
    if(req.param('id')){
      id = req.param('id');
      category = await Category.findOne({id:id});
      childs = await sails.helpers.categoryChildren(category.id);
      let parent = await Category.findOne({id:id}).populate('parent');
      parentId = parent.parent[0].id;
    }else{
      category = await Category.findOne({name:'Inicio'});
      childs = await sails.helpers.categoryChildren(category.id);
      parentId = category.id;
    }
    if(req.param('action')){
      action = req.param('action');
      childs['children'] = [await Category.findOne({name:'Inicio'})];
    }
    return res.view('pages/catalog/categories',{layout:'layouts/admin',categories:childs.children,action:action,error:error,current:category,parent:parentId});
  },
  addcategory: async function(req,res){
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if(rights.name!=='superadmin' && !_.contains(rights.permissions,'addcategory')){
      throw 'forbidden';
    }
    var isActive=false;
    var error = null;
    let newcat = null;
    if(req.body.activo==='on'){isActive=true;}
    let current = await Category.findOne({id:req.body.current});
    try{
      let filename = await sails.helpers.fileUpload(req,'logo',2000000,'images/categories');
      newcat = await Category.create({
        name:req.body.nombre.trim().toLowerCase(),
        logo:filename[0],
        description:req.body.descripcion,
        active:isActive,
        url:(req.body.nombre.trim().toLowerCase()).replace(' ','-'),
        level:current.level+1
      }).fetch();
    }catch(err){
      error = err.msg;
      if(err.code==='badRequest'){
        newcat = await Category.create({
          name:req.body.nombre.trim().toLowerCase(),
          description:req.body.descripcion,
          active:isActive,
          url:(req.body.nombre.trim().toLowerCase()).replace(' ','-'),
          level:current.level+1
        }).fetch();
      }
    }

    await Category.addToCollection(newcat.id,'parent', current.id);
    await Category.updateOne({id:current.id}).set({hasChildren:true});

    if (error===undefined || error===null || error.code==='badRequest'){
      return res.redirect('/categories/list');
    }else{
      return res.redirect('/categories/list?error='+error);
    }
  },
  editcategory: async function(req,res){
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if(rights.name!=='superadmin' && !_.contains(rights.permissions,'editcategory')){
      throw 'forbidden';
    }
    var isActive=false;
    var error = null;
    const route = 'images/categories';
    let category = await Category.findOne({id:req.param('id')});
    let parent = await Category.findOne({id:req.body.current});
    if(req.body.activo==='on'){isActive=true;}
    try{
      uploaded = await sails.helpers.fileUpload(req,'logo',2000000,route);

      await Category.updateOne({id:category.id}).set({name:req.body.nombre, description:req.body.descripcion, logo:uploaded[0], active:isActive,level:parent.level+1});
    }catch(err){
      console.log(err);
      error = err.msg;
      if(err.code==='badRequest'){
        await Category.updateOne({id:category.id}).set({name:req.body.nombre, description:req.body.descripcion, active:isActive,level:parent.level+1});
      }
    }
    if(req.body.parent!==parent.id){
      await Category.removeFromCollection(req.body.parent,'children').members([category.id]);
      await Category.addToCollection(category.id,'parent',parent.id);
      await Category.addToCollection(parent.id,'children',category.id);
      await Category.updateOne({id:parent.id}).set({hasChildren:true});
    }

    if (error===undefined || error===null || error.code==='badRequest'){
      return res.redirect('/categories/list');
    }else{
      return res.redirect('/categories/list?error='+error);
    }
  },
  getchildren: async function(req,res){
    if (!req.isSocket) {
      return res.badRequest();
    }
    var id = req.param('id');
    var childs = await Category.findOne({id:id}).populate('children');

    return res.send(childs.children);
  },
  getparent: async function(req,res){
    if (!req.isSocket) {
      return res.badRequest();
    }
    var id = req.param('id');
    var parent = await Category.findOne({id:id}).populate('parent');

    return res.send(parent.parent);
  },
  categorystate: async function(req, res){
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if(rights.name!=='superadmin' && !_.contains(rights.permissions,'categorystate')){
      throw 'forbidden';
    }
    if (!req.isSocket) {
      return res.badRequest();
    }
    var id = req.param('id');
    var state = req.param('active');
    var updatedCategory = await Category.updateOne({id:id}).set({active:state});
    return res.send(updatedCategory);
  }
};
