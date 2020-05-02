/**
 * AccountController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
  addresses: async function(req, res){
    let error = req.param('error') ? req.param('error') : null;
    let addresses = null;
    addresses = await Address.find({user:req.session.user.id})
    .populate('country')
    .populate('region')
    .populate('city');
    return res.view('pages/account/addresses',{addresses:addresses,error:error});
  },
  address: async function(req, res){
    let id = req.param('id') ? req.param('id') : null;
    let countries = await Country.find();
    let address=null;
    let referrer = req.param('referrer') ? req.param('referrer') : null;
    let error = req.param('error') ? req.param('error') : null;
    if(id){
      address = await Address.findOne({id:id})
      .populate('country')
      .populate('region')
      .populate('city');
    }
    return res.view('pages/account/address',{countries:countries,address:address, error:error, referrer:referrer});
  },
  newaddress: async function(req, res){
    let referrer = req.param('referrer') ? req.param('referrer') : null;
    try{
      await Address.create({
        name:req.body.name.trim().toLowerCase(),
        addressline1:req.body.addressline1,
        addressline2:req.body.addressline2,
        country:req.body.country,
        region:req.body.region,
        city:req.body.city,
        zipcode:req.body.zipcode.trim().toUpperCase(),
        notes:req.body.notes,
        user:req.session.user.id,
      });
      if (referrer===null || referrer===undefined){
        return res.redirect('/addresses');
      }else{
        return res.redirect('/checkout');
      }
    }catch(err){
      return res.redirect('/address?error='+err);
    }
  },
  editaddress: async function(req, res){
    let referrer = req.param('referrer') ? req.param('referrer') : null;
    try{
      await Address.updateOne({id:req.param('id')}).set({
        name:req.body.name.trim().toLowerCase(),
        addressline1:req.body.addressline1,
        addressline2:req.body.addressline2,
        country:req.body.country,
        region:req.body.region,
        city:req.body.city,
        zipcode:req.body.zipcode.trim().toUpperCase(),
        notes:req.body.notes,
        user:req.session.user.id,
      });
      if (referrer===null || referrer===undefined){
        return res.redirect('/addresses');
      }else{
        return res.redirect('/checkout');
      }
    }catch(err){
      return res.redirect('/address/'+req.param('id')+'?error='+err);
    }
  },
  deleteaddress: async function(req, res){
    try{
      await Address.destroyOne({id:req.param('id'), user:req.session.user.id});
      return res.redirect('/addresses');
    }catch(err){
      return res.redirect('/addresses/?error='+err);
    }
  }
};

