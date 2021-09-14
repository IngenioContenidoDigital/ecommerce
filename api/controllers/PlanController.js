/**
 * PlanController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
  showplans: async function(req, res){
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if(rights.name!=='superadmin' && !_.contains(rights.permissions,'showplans')){
      throw 'forbidden';
    }
    let error= req.param('error') ? req.param('error') : null;
    let plan=null;
    let plans = await Plan.find();
    let action = req.param('action') ? req.param('action') : null;
    let id = req.param('id') ? req.param('id') : null;
    if(id){
      plan = await Plan.findOne({id:id});
    }
    return res.view('pages/configuration/plans',{layout:'layouts/admin',plans,action,error,plan});
  },
  createplan: async function(req, res){
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if(rights.name!=='superadmin' && !_.contains(rights.permissions,'createplan')){
      throw 'forbidden';
    }
    let error = null;
    try{
      let planData = {
        name: req.body.name.trim().toLowerCase(),
        pricecop: req.body.pricecop,
        pricesubscriptioncop: req.body.pricesubscriptioncop,
        pricemx: req.body.pricemx,
        pricesubscriptionmx: req.body.pricesubscriptionmx
      };
      const result = await Plan.create(planData).fetch();
      const planInfo = {
        id_plan: result.id,
        name: req.body.name.trim().toLowerCase(),
        description: `Plan 1Ecommerce ${req.body.name.trim().toLowerCase()}`,
        amount: req.body.pricesubscriptioncop,
        currency: 'cop',
        interval: 'month',
        interval_count: 1,
        trial_days: 0
      }
      await sails.helpers.payment.plan(planInfo, 'CC');
    }catch(err){
      error = err;
    }
    if (error===undefined || error===null){
      return res.redirect('/plans');
    }else{
      return res.redirect('/plans?error='+error);
    }
  },
  editplan: async function(req, res){
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if(rights.name!=='superadmin' && !_.contains(rights.permissions,'editplan')){
      throw 'forbidden';
    }
    let error = null;
    try{
      await Plan.updateOne({id: req.param('id')}).set({
        name: req.body.name.trim().toLowerCase(),
        pricecop: req.body.pricecop,
        pricesubscriptioncop: req.body.pricesubscriptioncop,
        pricemx: req.body.pricemx,
        pricesubscriptionmx: req.body.pricesubscriptionmx
      });
    }catch(err){
      if(err.code==='badRequest'){
        await Plan.updateOne({id: req.param('id')}).set({
          name: req.body.name.trim().toLowerCase(),
          pricecop: req.body.pricecop,
          pricesubscriptioncop: req.body.pricesubscriptioncop,
          pricemx: req.body.pricemx,
          pricesubscriptionmx: req.body.pricesubscriptionmx
        });
      } else {
        error = err;
      }
    }
    if (error===undefined || error===null){
      return res.redirect('/plans');
    }else{
      return res.redirect('/plans?error='+error);
    }
  }
};
