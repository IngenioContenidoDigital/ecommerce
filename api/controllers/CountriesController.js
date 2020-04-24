/**
 * CountriesController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
  showcountries: async function(req, res){
    let error= req.param('error') ? req.param('error') : null;
    let country = null;
    let action = req.param('action') ? req.param('action') : null;
    let id = req.param('id') ? req.param('id') : null;
    let countries = await Country.find();
    if(id){
      country = await Country.findOne({id:id});
    }
    res.view('pages/localization/countries',{countries:countries,action:action,country:country,error:error});
  },
  createcountry: async function(req, res){
    let error=null;
    let isActive = (req.body.activo==='on') ? true : false;
    try{
      await Country.create({
        name:req.body.name.trim().toLowerCase(),
        iso:req.body.iso,
        prefix:req.body.prefix,
        active:isActive});
    }catch(err){
      error=err;
    }
    setTimeout(() => { return; }, 2000);
    if (error===undefined || error===null){
      return res.redirect('/countries');
    }else{
      return res.redirect('/countries?error='+error);
    }
  },
  editcountry: async function(req, res){
    let error=null;
    let isActive = (req.body.activo==='on') ? true : false;
    let id = req.param('id');
    try{
      await Country.updateOne({id:id}).set({
        name:req.body.name.trim().toLowerCase(),
        iso:req.body.iso,
        prefix:req.body.prefix,
        active:isActive});
    }catch(err){
      error=err;
    }

    if (error===undefined || error===null){
      return res.redirect('/countries');
    }else{
      return res.redirect('/countries?error='+error);
    }
  },
  countrystate: async function(req, res){
    if (!req.isSocket) {
      return res.badRequest();
    }
    var id = req.param('id');
    var state = req.body.active;
    var updatedCountry = await Country.updateOne({id:id}).set({active:state});
    return res.send(updatedCountry);
  },
};

