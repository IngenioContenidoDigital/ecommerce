/**
 * TaxController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
  showtaxes: async function(req, res){
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if(rights.name!=='superadmin' && !_.contains(rights.permissions,'showtaxes')){
      throw 'forbidden';
    }
    let tax = null;
    let error = null;
    let taxes = await Tax.find();
    let action = req.param('action') ? req.param('action') : null;
    let id = req.param('id') ? req.param('id') : null;
    if(id){
      tax = await Tax.findOne({id:id});
    }
    return res.view('pages/configuration/taxes',{layout:'layouts/admin',taxes:taxes,action:action,error:error,tax:tax});
  },
  createtax: async function(req, res){
    let error = null;
    try{
      await Tax.create({name:req.body.name.trim().toLowerCase(),value:req.body.value});
    }catch(err){
      error = err;
    }
    if (error===undefined || error===null){
      return res.redirect('/taxes');
    }else{
      return res.redirect('/taxes?error='+error);
    }
  },
  edittax: async function(req, res){
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if(rights.name!=='superadmin' && !_.contains(rights.permissions,'edittax')){
      throw 'forbidden';
    }
    let error = null;
    try{
      await Tax.updateOne({id:req.param('id')}).set({name:req.body.name.trim().toLowerCase(),value:req.body.value});
    }catch(err){
      error = err;
    }
    if (error===undefined || error===null){
      return res.redirect('/taxes');
    }else{
      return res.redirect('/taxes?error='+error);
    }
  }
};

