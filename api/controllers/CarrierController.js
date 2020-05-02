/**
 * CarrierController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
  showcarriers: async function(req, res){
    let error= req.param('error') ? req.param('error') : null;
    let carrier = null;
    let action = req.param('action') ? req.param('action') : null;
    let id = req.param('id') ? req.param('id') : null;
    let carriers = await Carrier.find();
    if(id){
      carrier = await Carrier.findOne({id:id});
    }
    res.view('pages/carriers/carriers',{carriers:carriers,action:action,carrier:carrier,error:error});
  },
  createcarrier: async function(req, res){
    let error=null;
    let isActive = (req.body.activo==='on') ? true : false;
    try{
      let filename = await sails.helpers.fileUpload(req,'logo',2000000,'assets/images/carriers');
      await Carrier.create({
        name:req.body.name.trim().toLowerCase(),
        url:req.body.url,
        logo: filename[0],
        active:isActive});
    }catch(err){
      error=err;
    }
    if (error===undefined || error===null){
      return res.redirect('/carriers');
    }else{
      return res.redirect('/carriers?error='+error);
    }
  },
  editcarrier: async function(req, res){
    let error=null;
    let isActive = (req.body.activo==='on') ? true : false;
    let id = req.param('id');
    let route = 'assets/images/carriers';
    let carrier = await Carrier.findOne({id:id});
    let filename = [carrier.logo];
    try{
      uploaded = await sails.helpers.fileUpload(req,'logo',2000000,route);

      var fs = require('fs');
      if(filename[0].length>0){
        if (fs.existsSync(route+'/'+filename[0])) { fs.unlinkSync(route+'/'+filename[0]);}
        if (fs.existsSync(route+'/'+filename[0].replace(filename[0].split('.').pop(),'webp'))) { fs.unlinkSync(route+'/'+filename[0].replace(filename[0].split('.').pop(),'webp'));}
      }

      await Carrier.updateOne({id:id}).set({
        name:req.body.name.trim().toLowerCase(),
        url: req.body.url,
        logo: uploaded[0],
        active:isActive});

    }catch(err){
      error=err;
      if(error.code==='badRequest'){
        await Carrier.updateOne({id:id}).set({
          name:req.body.name.trim().toLowerCase(),
          url: req.body.url,
          active:isActive});
      }
    }

    if (error===undefined || error===null || error.code==='badRequest'){
      return res.redirect('/carriers');
    }else{
      return res.redirect('/carriers?error='+error);
    }
  },
  carrierstate: async function(req, res){
    if (!req.isSocket) {
      return res.badRequest();
    }
    var id = req.param('id');
    var state = req.body.active;
    var updatedCarrier = await Carrier.updateOne({id:id}).set({active:state});
    return res.send(updatedCarrier);
  },
  shipment:async (req, res) =>{
    let tracking = req.param('tracking');

    let guia = await sails.helpers.carrier.guia(tracking);
    let label = await sails.helpers.carrier.label(tracking);

    return res.view('pages/pdf',{guia:guia,label:label});
  }

};

