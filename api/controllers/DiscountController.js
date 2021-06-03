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
    let root = await Category.findOne({name:'inicio'});
    let discount = null;
    if(id){
      discount = await CatalogDiscount.findOne({id:id});
    }
    let discounts = null;
    let sellers = null;
    if(rights.name!=='superadmin' && rights.name!=='admin'){
      sellers = await Seller.find({id:req.session.user.seller});
      discounts = await CatalogDiscount.find({seller:req.session.user.seller}).sort([{createdAt: 'DESC'}]).populate('seller');
    }else{
      sellers = await Seller.find();
      discounts = await CatalogDiscount.find().sort([{createdAt: 'DESC'}]).populate('seller');
    }
    let genders = await Gender.find();
    let colors = await Color.find();
    let manufacturers = await Manufacturer.find();
    return res.view('pages/discounts/discounts', {layout:'layouts/admin',error:error, discounts:discounts, sellers:sellers, genders:genders, colors:colors,manufacturers:manufacturers,action:action, discount:discount, moment:moment, root:root});
  },
  creatediscount: async (req, res) => {
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if(rights.name!=='superadmin' && !_.contains(rights.permissions,'discounts')){
      throw 'forbidden';
    }
    let moment = require('moment');
    let range = req.body.range.split(' - ');
    let action = req.param('action');
    let discount = null;

    try{

      let products = await Product.find({seller:req.body.seller}).populate('categories');
      if(req.body.category){
        for(let p of products){
          for(let pc of p.categories){
            if(pc.id===req.body.category){
              p.incategory = req.body.category;
            }
          }
        }
        products = products.filter(p => p.incategory === req.body.category);
      }
      if(req.body.manufacturer){products = products.filter(p => p.manufacturer===req.body.manufacturer);}
      if(req.body.color){products = products.filter(p => p.mainColor===req.body.color);}
      if(req.body.gender){products = products.filter(p => p.gender===req.body.gender);}

      if(products.length>0){
        let affected = [];
        for(let pr of products){
          if(!affected.includes(pr.id)){
            affected.push(pr.id);
          }
        }

        if(action==='edit'){
          discount = await CatalogDiscount.updateOne({id:req.param('id')}).set({
            name:req.body.name.toLowerCase().trim(),
            from:moment(range[0]).valueOf(),
            to:moment(range[1]).valueOf(),
            type:req.body.type,
            value:req.body.value,
            seller:req.body.seller,
            category:req.body.category ? req.body.category : null,
            manufacturer:req.body.manufacturer ? req.body.manufacturer : null,
            color:req.body.color ? req.body.color : null,
            gender:req.body.gender ? req.body.gender : null
          });
          await CatalogDiscount.replaceCollection(discount.id,'products').members(affected);
        }else{
          discount = await CatalogDiscount.create({
            name:req.body.name.toLowerCase().trim(),
            from:moment(range[0]).valueOf(),
            to:moment(range[1]).valueOf(),
            type:req.body.type,
            value:req.body.value,
            seller:req.body.seller,
            category:req.body.category ? req.body.category : null,
            manufacturer:req.body.manufacturer ? req.body.manufacturer : null,
            color:req.body.color ? req.body.color : null,
            gender:req.body.gender ? req.body.gender : null
          }).fetch();

          await CatalogDiscount.addToCollection(discount.id,'products').members(affected);
        }
      }else{
        let msg='No hay productos que coincidan con los criterios seleccionados. Por favor intenta nuevamente';
        return res.redirect('/discounts?error='+msg);
      }
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
        from:moment(range[0]).valueOf(),
        to:moment(range[1]).valueOf(),
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
  },
  productdiscount: async (req, res) => {
    if (!req.isSocket) {
      return res.badRequest();
    }
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if(rights.name!=='superadmin' && !_.contains(rights.permissions,'discounts')){
      throw 'forbidden';
    }
    let moment = require('moment');
    let range = req.body.range.split(' - ');
    let discount = null;
    let affected = [];
    let product = await Product.findOne({id:req.body.product});

    discount = await CatalogDiscount.create({
      name:product.name.toLowerCase().trim(),
      from:moment(range[0]).valueOf(),
      to:moment(range[1]).valueOf(),
      type:req.body.type,
      value:req.body.value,
      seller:product.seller
    }).fetch();

    affected.push(product.id);

    await CatalogDiscount.addToCollection(discount.id,'products').members(affected);
    await sails.helpers.channel.channelSync(product);
    //let discounts = await Product.findOne({id:product.id}).populate('discount');

    return res.send(discount);
  },
  removepdiscount: async (req, res) =>{
    if (!req.isSocket) {
      return res.badRequest();
    }
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if(rights.name!=='superadmin' && !_.contains(rights.permissions,'discounts')){
      throw 'forbidden';
    }
    let members = [];
    try{
      members.push(req.body.product);
      await CatalogDiscount.removeFromCollection(req.body.discount,'products').members(members);
      let product = await Product.findOne({id:req.body.product});
      await sails.helpers.channel.channelSync(product);
      return res.send('ok');
    }catch(err){
      console.log(err);
      return res.send(err.message);
    }
  }

};

