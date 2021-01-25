/**
 * CurrencyController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
    showCurrencies: async function(req, res){
      let rights = await sails.helpers.checkPermissions(req.session.user.profile);
      if(rights.name!=='superadmin' && !_.contains(rights.permissions,'showcurrencies')){
        throw 'forbidden';
      }
      let currency = null;
      let error = null;
      let currencies = await Currency.find();
      let action = req.param('action') ? req.param('action') : null;
      let id = req.param('id') ? req.param('id') : null;

      if(id){
        currency = await Currency.findOne({id:id});
      }

      return res.view('pages/configuration/currencies',{layout:'layouts/admin',currencies:currencies,action:action,error:error,currency:currency});
    },
    createCurrency: async function(req, res){
      let error = null;
      try{
        await Currency.create({name:req.body.name.trim().toLowerCase(),isocode:req.body.isocode.toUpperCase()});
      }catch(err){
        error = err;
      }
      if (error===undefined || error===null){
        return res.redirect('/currencies');
      }else{
        return res.redirect('/currencies?error='+error);
      }
    },
    editcurrency: async function(req, res){
      let rights = await sails.helpers.checkPermissions(req.session.user.profile);
      if(rights.name!=='superadmin' && !_.contains(rights.permissions,'editcurrency')){
        throw 'forbidden';
      }
      let error = null;
      try{
        await Currency.updateOne({id:req.param('id')}).set({name:req.body.name.trim().toLowerCase(),isocode:req.body.isocode.toUpperCase()});
      }catch(err){
        error = err;
      }
      if (error===undefined || error===null){
        return res.redirect('/currencies');
      }else{
        return res.redirect('/currencies?error='+error);
      }
    }
  };
  
  