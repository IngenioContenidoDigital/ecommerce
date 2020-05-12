/**
 * DiscountController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
  discounts: async function(req, res){
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if(rights.name!=='superadmin' && !_.contains(rights.permissions,'discounts')){
      throw 'forbidden';
    }
    let moment = require('moment');
    let error = req.param('error') ? req.param('error') : null;
    let action = req.param('action') ? req.param('action') : null;
    let id = req.param('id') ? req.param('id') : null;
    let root = await Category.findOne({name:'Inicio'});
    let discount = null;
    if(id){
      discount = await CatalogDiscount.findOne({id:id}).populate('products');
    }
    let discounts = await CatalogDiscount.find().sort([{createdAt: 'DESC'}]);
    return res.view('pages/discounts/discounts', {layout:'layouts/admin',error:error, discounts:discounts, action:action, discount:discount, moment:moment, root:root});
  },
  creatediscount: async (req, res) => {
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if(rights.name!=='superadmin' && !_.contains(rights.permissions,'discounts')){
      throw 'forbidden';
    }
    let moment = require('moment');
    let range = req.body.range.split(' - ');

    try{
      let discount = await CatalogDiscount.create({
        name:req.body.name.toLowerCase().trim(),
        from:moment(range[0]).valueOf(),
        to:moment(range[1]).valueOf(),
        type:req.body.type,
        value:req.body.value
      }).fetch();

      req.body.categories.forEach(async item =>{
        let cat = await Category.findOne({id:item}).populate('products');
        let products = [];
        cat.products.forEach(product =>{
          products.push(product.id);
        });
        await CatalogDiscount.addToCollection(discount.id,'products').members(products);
      });
    }catch(err){
      return res.redirect('/discounts?error='+err);
    }
    return res.redirect('/discounts');
  },
  coupons: async function(req, res){
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if(rights.name!=='superadmin' && !_.contains(rights.permissions,'discounts')){
      throw 'forbidden';
    }
    let moment = require('moment');
    let error = req.param('error') ? req.param('error') : null;
    let action = req.param('action') ? req.param('action') : null;
    let id = req.param('id') ? req.param('id') : null;
    let discount = null;
    if(id){
      discount = await CartDiscount.findOne({id:id});
    }
    let discounts = await CartDiscount.find().sort([{createdAt: 'DESC'}]);
    return res.view('pages/discounts/coupons', {layout:'layouts/admin',error:error, discounts:discounts, action:action, discount:discount, moment:moment, root:root});
  },
  createcoupon:async (req, res)=>{
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if(rights.name!=='superadmin' && !_.contains(rights.permissions,'discounts')){
      throw 'forbidden';
    }
    let moment = require('moment');
    let range = req.body.range.split(' - ');

    try{
      await CartDiscount.create({
        name:req.body.name.toLowerCase().trim(),
        code: req.body.code,
        from:moment(range[0]),
        to:moment(range[1]),
        type:req.body.type,
        value:req.body.value
      });
    }catch(err){
      return res.redirect('/coupons?error='+err);
    }
    return res.redirect('/coupons');
  },
  editcoupon:async (req, res)=>{
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if(rights.name!=='superadmin' && !_.contains(rights.permissions,'discounts')){
      throw 'forbidden';
    }
    let moment = require('moment');
    let range = req.body.range.split(' - ');

    try{
      await CartDiscount.updateOne({id:req.param('id')}).set({
        name:req.body.name.toLowerCase().trim(),
        code: req.body.code,
        from:moment(range[0]),
        to:moment(range[1]),
        type:req.body.type,
        value:req.body.value
      });
    }catch(err){
      return res.redirect('/coupons?error='+err);
    }
    return res.redirect('/coupons');
  },
  random:async(req,res)=>{
    if (!req.isSocket) {
      return res.badRequest();
    }
    let random = sails.helpers.strings.random();
    return res.send(random);
  }

};

