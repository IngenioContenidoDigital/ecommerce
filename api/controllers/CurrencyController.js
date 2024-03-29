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
      let action = req.param('action') ? req.param('action') : null;

      try{

        let exist  = await Currency.count({ isocode:req.body.isocode.toUpperCase() });
        
        if(exist > 0 ){
            throw new Error('Error creating new currency duplicate ISO code');
        }

        await Currency.create({name:req.body.name.trim().toLowerCase(),isocode:req.body.isocode.toUpperCase()});
      }catch(err){
        error = err;
      }

      let currencies = await Currency.find();

      return res.view('pages/configuration/currencies',{layout:'layouts/admin',currencies:currencies,action:null,error:error,currency:null});
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
        return res.render('/currencies');
      }else{
        return res.render('/currencies?error='+error);
      }
    }
  };
  
  