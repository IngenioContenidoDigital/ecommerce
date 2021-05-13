/**
 * MessageController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
  showmessages: async function(req, res){
    let error= req.param('error') ? req.param('error') : null;
    let message=null;
    let action = req.param('action') ? req.param('action') : null;
    let id = req.param('id') ? req.param('id') : null;
    let seller = req.session.user.seller;
    let messages = await Message.find({seller: seller});
    if(id){
      message = await Message.findOne({id:id});
    }
    return res.view('pages/sellers/defaultmessages',{layout:'layouts/admin',messages,action,error,message});
  },
  createmessage: async function(req, res){
    let error = null;
    let seller = req.session.user.seller;
    try{
      let messageData = {
        text: req.body.text,
        type: req.body.type,
        seller: seller
      };
      await Message.create(messageData);
    }catch(err){
      error = err;
    }
    if (error===undefined || error===null){
      return res.redirect('/messages');
    }else{
      return res.redirect('/messages?error='+error);
    }
  },
  editmessage: async function(req, res){
    let error = null;
    try{
      await Message.updateOne({id: req.param('id')}).set({
        text: req.body.text,
        type: req.body.type
      });
    }catch(err){
      error = err;
    }
    if (error===undefined || error===null){
      return res.redirect('/messages');
    }else{
      return res.redirect('/messages?error='+error);
    }
  }
};
