/**
 * CategoryController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

const Integration = require("../models/Integration");

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
      category = await Category.findOne({id:id}).populate('parent');
      childs = await sails.helpers.categoryChildren(category.id);
      let parent = await Category.findOne({id:category.parent.id});
      parentId = parent.id;
    }else{
      category = await Category.findOne({name:'inicio'});
      childs = await sails.helpers.categoryChildren(category.id);
      parentId = category.id;
    }
    if(req.param('action')){
      action = req.param('action');
      childs['children'] = [await Category.findOne({name:'inicio'})];
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
    if(req.body.activo==='on'){isActive=true;}
    let current = await Category.findOne({id:req.body.current});
    let dafiticat = '';
    let liniocat = '';
    if(req.body['dafiti[]']!==undefined){
      if(typeof req.body['dafiti[]']!=='string'){
        dafiticat = req.body['dafiti[]'].join(',');
      }else{
        dafiticat = req.body['dafiti[]'];
      }
    }
    if(req.body['linio[]']!==undefined){
      if(typeof req.body['linio[]']!=='string'){
        liniocat = req.body['linio[]'].join(',');
      }else{
        liniocat = req.body['linio[]'];
      }
    }
    try{
      let filename = await sails.helpers.fileUpload(req,'logo',2000000,'images/categories');
      await Category.create({
        name:req.body.nombre.trim().toLowerCase(),
        logo:filename[0].filename,
        description:req.body.descripcion,
        dafiti:dafiticat,
        linio: liniocat,
        parent:current.id,
        active:isActive,
        url:(current.name.trim().toLowerCase().replace(/\s/g,'-'))+'-'+(req.body.nombre.trim().toLowerCase()).replace(/\s/g,'-'),
        level:current.level+1
      }).fetch();
    }catch(err){
      error = err.msg;
      if(err.code==='badRequest'){
        await Category.create({
          name:req.body.nombre.trim().toLowerCase(),
          description:req.body.descripcion,
          parent:current.id,
          dafiti:dafiticat,
          linio: liniocat,
          active:isActive,
          url:(current.name.trim().toLowerCase().replace(/\s/g,'-'))+'-'+(req.body.nombre.trim().toLowerCase()).replace(/\s/g,'-'),
          level:current.level+1
        }).fetch();
      }
    }

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
    let dafiticat = '';
    let liniocat = '';
    if(req.body['dafiti[]']!==undefined){
      if(typeof req.body['dafiti[]']!=='string'){
        dafiticat = req.body['dafiti[]'].join(',');
      }else{
        dafiticat = req.body['dafiti[]'];
      }
    }
    if(req.body['linio[]']!==undefined){
      if(typeof req.body['linio[]']!=='string'){
        liniocat = req.body['linio[]'].join(',');
      }else{
        liniocat = req.body['linio[]'];
      }
    }
    if(req.body.activo==='on'){isActive=true;}
    try{
      uploaded = await sails.helpers.fileUpload(req,'logo',2000000,route);
      await Category.updateOne({id:category.id}).set({
        name:req.body.nombre,
        description:req.body.descripcion,
        parent:parent.id,
        dafiti:dafiticat,
        linio: liniocat,
        logo:uploaded[0].filename,
        url:(parent.name.trim().toLowerCase().replace(/\s/g,'-'))+'-'+(category.name.trim().toLowerCase()).replace(/\s/g,'-'),
        active:isActive,
        level:parent.level+1});
    }catch(err){
      error = err.msg;
      if(err.code==='badRequest'){
        await Category.updateOne({id:category.id}).set({
          name:req.body.nombre,
          description:req.body.descripcion,
          parent:parent.id,
          url:(parent.name.trim().toLowerCase().replace(/\s/g,'-'))+'-'+(category.name.trim().toLowerCase()).replace(/\s/g,'-'),
          dafiti:dafiticat,
          linio: liniocat,
          active:isActive,
          level:parent.level+1});
      }
    }
    if(req.body.parent!==parent.id){
      await Category.removeFromCollection(req.body.parent,'children').members([category.id]);
      await Category.addToCollection(parent.id,'children',category.id);
      await Category.updateOne({id:parent.id}).set({hasChildren:true});
    }

    if (error===undefined || error===null || error.code==='badRequest'){
      return res.redirect('/categories/list');
    }else{
      return res.redirect('/categories/list?error='+error);
    }
  },
  deletecategory:async(req, res)=>{
    if (!req.isSocket) {
      return res.badRequest();
    }
    let category = await Category.findOne({id:req.body.category})
    .populate('parent')
    .populate('children')
    .populate('products');
    if(category.children.length>0){
      for(let c in category.children){
        await Category.updateOne({id:category.children[c].id}).set({
          parent:category.parent.id
        });
      }
      await Category.updateOne({id:category.parent.id}).set({hasChildren:true});
    }
    if(category.products.length>0){
      for(let p in category.products){
        await Product.removeFromCollection(category.products[p].id,'categories').members([category.id]);
        await Product.addToCollection(category.products[p].id,'categories').members([category.parent.id]);
      }
    }
    await Category.destroyOne({id:category.id});
    return res.send('deleted');
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

    return res.send(parent);
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
  },
  dafiticategories: async (req,res)=>{
    if(!req.isSocket){
      return res.badrequest();
    }
    try{
      let keys = await Integrations.find({where:{channel:'dafiti'},limit:1});
      if(keys.length>0){
        let route = await sails.helpers.channel.dafiti.sign('GetCategoryTree',keys[0].seller);
        let response = await sails.helpers.request('https://sellercenter-api.dafiti.com.co','/?'+route,'GET');
        return res.ok(JSON.parse(response));
      }else{
        return res.serverError();
      }
    }catch(err){
      return res.serverError(err);
    }
  },
  liniocategories: async (req,res)=>{
    if(!req.isSocket){
      return res.badrequest();
    }
    try{
      let keys = await Integrations.find({where:{channel:'linio'}, limit:1});
      if(keys.length > 0){
        let route = await sails.helpers.channel.linio.sign('GetCategoryTree', keys[0].seller);
        let response = await sails.helpers.request('https://sellercenter-api.linio.com.co','/?'+route,'GET');
        return res.ok(JSON.parse(response));
      }else{
        return res.serverError();
      }
    }catch(err){
      return res.serverError(err);
    }
  },
  categoryindex: async (req, res) => {
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if ((rights.name !== 'superadmin') && !_.contains(rights.permissions,'updateindex')) {
      throw 'forbidden';
    }
    let documents = [];
    let categories = await Category.find({level:{'>=':4}});

    categories.forEach(pr => {
      let doc = {
        type: req.param('action'), // add or delete
        id: pr.id
      };

      if (req.param('action') === 'add') {
        doc['fields'] = {
          id: pr.id,
          category: pr.name
        };
      }
      documents.push(doc);
    });
    let AWS = require('aws-sdk');
    AWS.config.loadFromPath('./config.json');
    let endpoint = 'doc-predictor-1ecommerce-if3tuwyqkbztsy2a2j3voan7bu.us-east-1.cloudsearch.amazonaws.com';
    var csd = new AWS.CloudSearchDomain({ endpoint: endpoint });
    var params = {
      contentType: 'application/json', // required
      documents: JSON.stringify(documents) // required
    };
    csd.uploadDocuments(params, (err, data) => {
      if (err) { console.log(err, err.stack); } // an error occurred
      let index = new AWS.CloudSearch();
      index.indexDocuments({ DomainName: 'predictor-1ecommerce' }, (err, data) => {
        if (err) { console.log(err); }
        console.log(data);
        return res.redirect('/inicio');
      });
    });
  },
};
