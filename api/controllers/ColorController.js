/**
 * ColorController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
  showcolors: async function(req, res){
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if(rights.name!=='superadmin' && !_.contains(rights.permissions,'showcolors')){
      throw 'forbidden';
    }
    let error = null;
    let color=null;
    let colors = await Color.find();
    let action = req.param('action') ? req.param('action') : null;
    let id = req.param('id') ? req.param('id') : null;
    if(id){
      color = await Color.findOne({id:id});
    }
    return res.view('pages/catalog/color',{layout:'layouts/admin',colors:colors,action:action,error:error,color:color});
  },
  createcolor: async function(req, res){
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if(rights.name!=='superadmin' && !_.contains(rights.permissions,'createcolor')){
      throw 'forbidden';
    }
    let error = null;
    try{
      await Color.create({name:req.body.name.trim().toLowerCase(),code:req.body.code.trim()});
    }catch(err){
      error = err;
    }
    if (error===undefined || error===null){
      return res.redirect('/colors');
    }else{
      return res.redirect('/colors?error='+error);
    }
  },
  editcolor: async function(req, res){
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if(rights.name!=='superadmin' && !_.contains(rights.permissions,'editcolor')){
      throw 'forbidden';
    }
    let error = null;
    try{
      await Color.updateOne({id:req.param('id')}).set({name:req.body.name.trim().toLowerCase(),code:req.body.code.trim()});
    }catch(err){
      error = err;
    }
    if (error===undefined || error===null){
      return res.redirect('/colors');
    }else{
      return res.redirect('/colors?error='+error);
    }
  },
  colorindex: async (req, res) => {
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if ((rights.name !== 'superadmin') && !_.contains(rights.permissions,'updateindex')) {
      throw 'forbidden';
    }
    let documents = [];
    let colors = await Color.find();

    colors.forEach(pr => {
      let doc = {
        type: req.param('action'), // add or delete
        id: pr.id
      };

      if (req.param('action') === 'add') {
        doc['fields'] = {
          id: pr.id,
          color: pr.name,
        };
      }
      documents.push(doc);
    });
    let AWS = require('aws-sdk');
    AWS.config.loadFromPath('./config1.json');
    let endpoint = 'doc-preditor1e-ffenvkc2nojr42drhfjrpvevry.us-east-1.cloudsearch.amazonaws.com';
    var csd = new AWS.CloudSearchDomain({ endpoint: endpoint });
    var params = {
      contentType: 'application/json', // required
      documents: JSON.stringify(documents) // required
    };
    csd.uploadDocuments(params, (err, data) => {
      if (err) { console.log(err, err.stack); } // an error occurred
      console.log(data);
      let index = new AWS.CloudSearch();
      index.indexDocuments({ DomainName: 'predictor-1ecommerce' }, (err, data) => {
        if (err) { console.log(err); }
        console.log(data);
        return res.redirect('/inicio');
      });
    });
  },
};

