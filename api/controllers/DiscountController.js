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
    if(rights.name!=='superadmin' && !_.contains(rights.permissions,'creatediscount')){
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
  }

};

