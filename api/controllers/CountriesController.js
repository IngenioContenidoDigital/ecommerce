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
  showregions: async function(req, res){
    let error= req.param('error') ? req.param('error') : null;
    let action = req.param('action') ? req.param('action') : null;
    let region = null;
    let id = req.param('id') ? req.param('id') : null;
    let regions = await Region.find()
    .populate('country')
    .populate('cities');
    let countries = await Country.find();
    if(id){
      region = await Region.findOne({id:id});
    }
    res.view('pages/localization/regions',{regions:regions,action:action,region:region,countries:countries,error:error});
  },
  createregion: async function(req, res){
    let error=null;
    let isActive = (req.body.activo==='on') ? true : false;
    try{
      await Region.create({
        name:req.body.name.trim().toLowerCase(),
        iso:req.body.iso,
        country:req.body.country,
        active:isActive});
    }catch(err){
      error=err;
    }
    setTimeout(() => { return; }, 2000);
    if (error===undefined || error===null){
      return res.redirect('/regions');
    }else{
      return res.redirect('/regions?error='+error);
    }
  },
  editregion: async function(req, res){
    let error=null;
    let isActive = (req.body.activo==='on') ? true : false;
    let id = req.param('id');
    try{
      await Region.updateOne({id:id}).set({
        name:req.body.name.trim().toLowerCase(),
        iso:req.body.iso,
        country:req.body.country,
        active:isActive});
    }catch(err){
      error=err;
    }

    if (error===undefined || error===null){
      return res.redirect('/regions');
    }else{
      return res.redirect('/regions?error='+error);
    }
  },
  regionstate: async function(req, res){
    if (!req.isSocket) {
      return res.badRequest();
    }
    var id = req.param('id');
    var state = req.body.active;
    var updatedRegion = await Region.updateOne({id:id}).set({active:state});
    return res.send(updatedRegion);
  },
  showcities: async function(req, res){
    let error= req.param('error') ? req.param('error') : null;
    let action = req.param('action') ? req.param('action') : null;
    let city = null;
    let id = req.param('id') ? req.param('id') : null;
    if(id){
      city = await City.findOne({id:id});
    }
    let region = await Region.findOne({id:req.param('region')})
    .populate('country')
    .populate('cities');
    if (region.cities.length<1){
      return res.view('pages/localization/cities',{region:region,city:city,action:'create',error:error});
    }else{
      return res.view('pages/localization/cities',{region:region,city:city,action:action,error:error});
    }
    /*for(let c of cities){
      c.region = await Region.findOne({id:c.region.id}).populate('country');
    }*/
  },
  createcity: async function(req, res){
    let error=null;
    let isActive = (req.body.activo==='on') ? true : false;
    try{
      await City.create({
        name:req.body.name.trim().toLowerCase(),
        code:req.body.code,
        region:req.body.region,
        active:isActive});
    }catch(err){
      error=err;
    }
    if (error===undefined || error===null){
      return res.redirect('/cities/'+req.body.region);
    }else{
      return res.redirect('/cities/'+req.body.region+'?error='+error);
    }
  },
  editcity: async function(req, res){
    let error=null;
    let isActive = (req.body.activo==='on') ? true : false;
    let id = req.param('id');
    try{
      await City.updateOne({id:id}).set({
        name:req.body.name.trim().toLowerCase(),
        code:req.body.code,
        region:req.body.region,
        active:isActive});
    }catch(err){
      error=err;
    }

    if (error===undefined || error===null){
      return res.redirect('/cities/'+req.body.region);
    }else{
      return res.redirect('/cities/'+req.body.region+'?error='+error);
    }
  },
  citystate: async function(req, res){
    if (!req.isSocket) {
      return res.badRequest();
    }
    var id = req.param('id');
    var state = req.body.active;
    var updatedCity = await City.updateOne({id:id}).set({active:state});
    return res.send(updatedCity);
  },
  countryregions: async function(req, res){
    if (!req.isSocket) {
      return res.badRequest();
    }
    var id = req.param('id');
    var regions = await Country.findOne({id:id}).populate('regions');
    return res.send(regions);
  },
  regioncities: async function(req, res){
    if (!req.isSocket) {
      return res.badRequest();
    }
    var id = req.param('id');
    var region = await Region.findOne({id:id}).populate('cities');
    return res.send(region);
  },
};

