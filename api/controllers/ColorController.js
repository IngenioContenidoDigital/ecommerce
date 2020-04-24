/**
 * ColorController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
  showcolors: async function(req, res){
    let error = null;
    let color=null;
    let colors = await Color.find();
    let action = req.param('action') ? req.param('action') : null;
    let id = req.param('id') ? req.param('id') : null;
    if(id){
      color = await Color.findOne({id:id});
    }
    return res.view('pages/catalog/color',{colors:colors,action:action,error:error,color:color});
  },
  createcolor: async function(req, res){
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
  }
};

