/**
 * ChannelController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
  showchannels: async function(req, res){
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if(rights.name!=='superadmin' && !_.contains(rights.permissions,'showchannels')){
      throw 'forbidden';
    }
    let error= req.param('error') ? req.param('error') : null;
    let channel=null;
    let channels = await Channel.find();
    let action = req.param('action') ? req.param('action') : null;
    let id = req.param('id') ? req.param('id') : null;
    if(id){
      channel = await Channel.findOne({id:id});
    }
    let currencies = await Currency.find();
    return res.view('pages/localization/channels',{layout:'layouts/admin',channels,action,error,channel,currencies});
  },
  createchannel: async function(req, res){
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if(rights.name!=='superadmin' && !_.contains(rights.permissions,'createchannel')){
      throw 'forbidden';
    }
    let error = null;
    let filename = null;
    try{
      let channelData = {
        name: req.body.name.trim().toLowerCase(),
        endpoint: req.body.endpoint.trim(),
        currency: req.body.type === 'marketplace' ? req.body.currency : null,
        type: req.body.type
      };
      filename = await sails.helpers.fileUpload(req, 'logo', 2000000,'images/channels');
      if(filename.length>0){channelData.logo = filename[0].filename;}
      await Channel.create(channelData);
    }catch(err){
      error = err;
    }
    if (error===undefined || error===null){
      return res.redirect('/channels');
    }else{
      return res.redirect('/channels?error='+error);
    }
  },
  editchannel: async function(req, res){
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if(rights.name!=='superadmin' && !_.contains(rights.permissions,'editchannel')){
      throw 'forbidden';
    }
    let error = null;
    try{
      let filename = await sails.helpers.fileUpload(req,'logo',2000000,'images/channels');
      await Channel.updateOne({id: req.param('id')}).set({
        name: req.body.name.trim().toLowerCase(),
        endpoint: req.body.endpoint.trim(),
        logo: filename[0].filename,
        currency: req.body.type === 'marketplace' ? req.body.currency : null,
        type: req.body.type
      });
    }catch(err){
      if(err.code==='badRequest'){
        await Channel.updateOne({id: req.param('id')}).set({
          name: req.body.name.trim().toLowerCase(),
          endpoint: req.body.endpoint.trim(),
          currency: req.body.type === 'marketplace' ? req.body.currency : null,
          type: req.body.type
        });
      } else {
        error = err;
      }
    }
    if (error===undefined || error===null){
      return res.redirect('/channels');
    }else{
      return res.redirect('/channels?error='+error);
    }
  }
};

