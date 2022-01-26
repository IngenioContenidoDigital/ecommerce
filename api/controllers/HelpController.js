/**
 * HelpController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
  findterms: async (req, res) =>{
    if(!req.isSocket){
      return res.badRequest();
    }

    let section = req.param('section');
    let articles = await Help.find({section});
    return res.send(articles);
  },
  helpcontent: async (req, res) => {
    if(!req.isSocket){
      return res.badRequest();
    }
    let article = await Help.findOne({id:req.param('id')});
    return res.send(article);
  },
  listterms: async (req, res) =>{
    let error= req.param('error') ? req.param('error') : null;
    let article=null;
    let articles = await Help.find({});
    let action = req.param('action') ? req.param('action') : null;
    let id = req.param('id') ? req.param('id') : null;
    if(id){
      article = await Help.findOne({id:id});
    }

    return res.view('pages/configuration/help', {layout:'layouts/admin',articles,action,error,article});
  },
  createhelp: async (req, res) => {
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if(rights.name!=='superadmin' && !_.contains(rights.permissions,'createhelp')){
      throw 'forbidden';
    }
    let error = null;
    try{
      let helpData = {
        section: req.body.section,
        name: req.body.name.toLowerCase().trim(),
        source: req.body.source.trim(),
      };
      await Help.create(helpData);
    }catch(err){
      error = err;
    }
    if (!error){
      return res.redirect('/help');
    }else{
      return res.redirect('/help?error='+error);
    }
  },
  edithelp: async (req, res) => {
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if(rights.name!=='superadmin' && !_.contains(rights.permissions,'edithelp')){
      throw 'forbidden';
    }
    let error = null;
    try{
      await Help.updateOne({id: req.param('id')}).set({
        section: req.body.section,
        name: req.body.name.toLowerCase().trim(),
        source: req.body.source.trim(),
      });
    }catch(err){
      console.log(err);
      error = err;
    }
    if (!error){
      return res.redirect('/help');
    }else{
      return res.redirect('/help?error='+error);
    }
  }
};

