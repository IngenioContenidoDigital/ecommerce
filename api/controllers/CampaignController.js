/**
 * CampaignController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
  showcampaigns: async function(req, res){
    let error = req.param('error') ? req.param('error') : null;
    const seller = req.session.user.seller;
    let campaign=null;
    let campaigns = await Campaign.find({seller: seller});
    let action = req.param('action') ? req.param('action') : null;
    let id = req.param('id') ? req.param('id') : null;
    let channel = await Channel.findOne({name: 'mercadolibre', type: 'marketplace'});
    let integrations = await Integrations.find({seller: seller, channel: channel.id});
    if(id){
      campaign = await Campaign.findOne({id:id});
    }
    return res.view('pages/sellers/campaigns',{layout:'layouts/admin',campaigns,action,error,campaign,integrations});
  },
  createcampaign: async function(req, res){
    let error = null;
    try{
      let integration = await sails.helpers.channel.mercadolibre.sign(req.body.integration);
      let limitBudget = await sails.helpers.channel.mercadolibre.request('/advertising/product_ads_2/budgets/limits',integration.channel.endpoint,integration.secret);
      let budget = parseInt(req.body.budget);
      if (limitBudget.length > 0 && (budget >= limitBudget[0].minimum && budget <= limitBudget[0].maximum)) {
        let body = {
          'name': req.body.name,
          'budget': budget,
          'status': (req.body.status === 'on') ? 'active' : 'paused'
        };
        let campaign = await sails.helpers.channel.mercadolibre.request('/advertising/product_ads_2/campaigns',integration.channel.endpoint,integration.secret,body,'POST');
        if (campaign.id) {
          let campaignData = {
            campaignid: campaign.id,
            name: campaign.name,
            userid: campaign.user_id,
            budget: campaign.budget,
            status: campaign.status,
            integration: integration.id,
            seller: integration.seller
          };
          await Campaign.create(campaignData);
        }
      } else {
        error = 'El límite de presupuesto de tu usuario no esta en el rango ('+ limitBudget[0].minimum +' - '+ limitBudget[0].maximum +')';
      }
    }catch(err){
      error = err;
    }
    if (error===undefined || error===null){
      return res.redirect('/campaigns');
    }else{
      return res.redirect('/campaigns?error='+error);
    }
  },
  editcampaign: async function(req, res){
    let error = null;
    try{
      const id = req.param('id');
      let campaignSeller = await Campaign.findOne({id:id});
      let integration = await sails.helpers.channel.mercadolibre.sign(campaignSeller.integration);
      let limitBudget = await sails.helpers.channel.mercadolibre.request('/advertising/product_ads_2/budgets/limits',integration.channel.endpoint,integration.secret);
      let budget = parseInt(req.body.budget);
      if (limitBudget.length > 0 && (budget >= limitBudget[0].minimum && budget <= limitBudget[0].maximum)) {
        let body = {
          'budget': budget,
          'status': (req.body.status === 'on') ? 'active' : 'paused'
        };
        let response = await sails.helpers.channel.mercadolibre.request('/advertising/product_ads_2/campaigns/'+campaignSeller.campaignid,integration.channel.endpoint,integration.secret,body,'PUT');
        if (response.id) {
          await Campaign.updateOne({id:id}).set({
            name: response.name,
            userid: response.user_id,
            budget: response.budget,
            status: response.status
          });
        }
      } else {
        error = 'El límite de presupuesto de tu usuario no esta en el rango ('+ limitBudget[0].minimum +' - '+ limitBudget[0].maximum +')';
      }
    }catch(err){
      error = err;
    }
    if (error===undefined || error===null){
      return res.redirect('/campaigns');
    }else{
      return res.redirect('/campaigns?error='+error);
    }
  },
  campaignstate: async function(req, res){
    if (!req.isSocket) {
      return res.badRequest();
    }
    const id = req.param('id');
    const state = req.body.active;
    let campaignSeller = await Campaign.findOne({id:id});
    try {
      let integration = await sails.helpers.channel.mercadolibre.sign(campaignSeller.integration);
      let response = await sails.helpers.channel.mercadolibre.request('/advertising/product_ads_2/campaigns/'+campaignSeller.campaignid,integration.channel.endpoint,integration.secret,{status:state},'PUT');
      if (response.id) {
        campaignSeller = await Campaign.updateOne({id:id}).set({status:state});
        return res.send(campaignSeller);
      }
    } catch (err) {
      console.log(err);
      return res.send(campaignSeller);
    }
  },
  campaignshow: async function(req, res){
    const moment = require('moment');
    let error = null;
    const id = req.param('id');
    let campaignSeller = await Campaign.findOne({id:id});
    let response = null;
    try {
      let integration = await sails.helpers.channel.mercadolibre.sign(campaignSeller.integration);
      let dateFrom = moment().subtract(1, 'months').format('YYYY-MM-DD');
      let dateTo = moment().format('YYYY-MM-DD');
      let result = await sails.helpers.channel.mercadolibre.request('/advertising/product_ads_2/campaigns/'+campaignSeller.campaignid+'/metrics?date_from='+dateFrom+'&date_to='+dateTo,integration.channel.endpoint,integration.secret);
      if (result) {
        response = {metrics: result, campaign: campaignSeller};
      }
    } catch(err){
      error = err;
    }
    if (error===undefined || error===null){
      return res.view('pages/sellers/showcampaign',{layout:'layouts/admin', response});
    }else{
      return res.redirect('/campaigns?error='+error);
    }
  }
};
