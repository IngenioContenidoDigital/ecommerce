/**
 * VariationController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
  showvariations: async function(req, res){
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if(rights.name!=='superadmin' && !_.contains(rights.permissions,'showvariations')){
      throw 'forbidden';
    }
    let error = null;
    let variation=null;
    let variations = await Variation.find();
    let action = req.param('action') ? req.param('action') : null;
    let id = req.param('id') ? req.param('id') : null;
    if(id){
      variation = await Variation.findOne({id:id});
    }
    return res.view('pages/catalog/variations',{layout:'layouts/admin',variations:variations,action:action,error:error,variation:variation});
  },
  createvariation: async function(req, res){
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if(rights.name!=='superadmin' && !_.contains(rights.permissions,'createvariation')){
      throw 'forbidden';
    }
    let error = null;
    try{
      await Variation.create({name:req.body.name.trim().toLowerCase()});
    }catch(err){
      error = err;
    }
    if (error===undefined || error===null){
      return res.redirect('/variations');
    }else{
      return res.redirect('/variations?error='+error);
    }
  },
  editvariation: async function(req, res){
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if(rights.name!=='superadmin' && !_.contains(rights.permissions,'editvariation')){
      throw 'forbidden';
    }
    let error = null;
    try{
      await Variation.updateOne({id:req.param('id')}).set({name:req.body.name.trim().toLowerCase()});
    }catch(err){
      error = err;
    }
    if (error===undefined || error===null){
      return res.redirect('/variations');
    }else{
      return res.redirect('/variations?error='+error);
    }
  }
};

