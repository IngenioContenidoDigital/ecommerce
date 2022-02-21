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
    let plans = await Plan.find().sort('createdAt DESC');
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
        price: req.body.price,
        pricesubscription: req.body.pricesubscription,
        trialDays: req.body.trialDays,
        description: req.body.description,
        products: req.body.products,
        channels: req.body.channels,
        onboarding: req.body.onboarding,
        erp: req.body.erp,
        support: req.body.support
      };
      const result = await Plan.create(planData).fetch();
      let exchangeRate = await sails.helpers.currencyConverter('USD', 'COP');
      let price = (parseInt(req.body.pricesubscription)*exchangeRate.result).toFixed(2);
      const planInfo = {
        id_plan: result.id,
        name: req.body.name.trim().toLowerCase(),
        description: `Plan 1Ecommerce ${req.body.name.trim().toLowerCase()}`,
        amount: price,
        currency: 'cop',
        interval: 'month',
        interval_count: 1,
        trial_days: parseInt(req.body.trialDays)
      };
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
        price: req.body.price,
        pricesubscription: req.body.pricesubscription,
        trialDays: req.body.trialDays,
        description: req.body.description,
        products: req.body.products,
        channels: req.body.channels,
        onboarding: req.body.onboarding,
        erp: req.body.erp,
        support: req.body.support
      });
    }catch(err){
      if(err.code==='badRequest'){
        await Plan.updateOne({id: req.param('id')}).set({
          name: req.body.name.trim().toLowerCase(),
          price: req.body.price,
          pricesubscription: req.body.pricesubscription,
          description: req.body.description,
          trialDays: req.body.trialDays,
          products: req.body.products,
          channels: req.body.channels,
          onboarding: req.body.onboarding,
          erp: req.body.erp,
          support: req.body.support
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
  },
  upgradesubscription: async (req, res) =>{
    let seller = req.session.user.seller;
    let subscription = await Subscription.find({seller: seller, state: 'active'}).sort('createdAt DESC').limit(1);
    let filter = subscription.length > 0 ? {id: { '!=': subscription[0].plan }} : {};
    let plans = await Plan.find(filter).sort('createdAt ASC');
    let currentPlan = null;
    if (subscription.length > 0) {
      currentPlan = await Plan.findOne({id: subscription[0].plan});
    }
    let colors = ['is-info', 'is-danger', 'is-primary', 'is-warning', 'is-success'];
    return res.view('pages/configuration/upgradesubscription',{layout:'layouts/admin', plans, colors, seller, currentPlan});
  }
};
