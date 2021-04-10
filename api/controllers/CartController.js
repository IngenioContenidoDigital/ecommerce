/**
 * CartController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
  viewcart: async function(req, res){
    let cart = null;
    let seller = null;
    if(req.hostname!=='iridio.co' && req.hostname!=='localhost' && req.hostname!=='1ecommerce.app'){seller = await Seller.findOne({domain:req.hostname/*'sanpolos.com'*/});}
    if(req.session.cart!==undefined){
      cart = await CartProduct.find({cart:req.session.cart.id}).sort('createdAt ASC')
      .populate('product')
      .populate('productvariation');

      for(let cartproduct of cart){
        cartproduct.product = await Product.findOne({id:cartproduct.product.id})
        .populate('images')
        .populate('mainColor')
        .populate('manufacturer')
        .populate('tax');
        cartproduct.product.discount = await sails.helpers.discount(cartproduct.product.id);
        cartproduct.productvariation.variation = await Variation.findOne({id:cartproduct.productvariation.variation});
      }
    }
    return res.view('pages/front/cart',{cart:cart,tag:await sails.helpers.getTag(req.hostname),menu:await sails.helpers.callMenu(seller!==null ? seller.domain : undefined), seller:seller});
  },
  addtocart: async function(req, res){
    if (!req.isSocket) {
      return res.badRequest();
    }
    let cart = null;
    let action = req.body.action;
    if(req.session.cart === undefined){
      cart = await Cart.create().fetch();
      req.session.cart = cart;
    }else{
      cart = await Cart.findOne({id:req.session.cart.id}).populate('discount');
    }
    let productvariation = await ProductVariation.findOne({id:req.body.variation});

    if(action==='remove'){
      await CartProduct.destroy({cart:cart.id,product:productvariation.product,productvariation:productvariation.id});
    }else{
      await CartProduct.destroy({cart:cart.id,product:productvariation.product,productvariation:productvariation.id});
      let discount = await sails.helpers.discount(productvariation.product,productvariation.id);
      for(let i=0; i<req.body.quantity; i++){
        if(discount){
          await CartProduct.create({cart:cart.id,product:productvariation.product,productvariation:productvariation.id,totalDiscount:discount.amount,totalPrice:discount.price});
        }else{
          await CartProduct.create({cart:cart.id,product:productvariation.product,productvariation:productvariation.id,totalDiscount:0,totalPrice:productvariation.price});
        }
      }
    }

    let cartvalue = await CartProduct.sum('totalPrice',{cart:cart.id});
    let items = await CartProduct.count({cart:cart.id});
    req.session.cart.totalProducts = cartvalue ? cartvalue : 0;
    if(cart.discount!==undefined && cart.discount!==null){
      if(cart.discount.type==='P'){
        discount = cartvalue*(cart.discount.value/100);
      }else{
        discount = cart.discount.value;
      }
      req.session.cart.discount = discount;
      req.session.cart.total = cartvalue-discount;
    }else{
      req.session.cart.total = cartvalue;
    }

    if(items<1){
      await Cart.destroyOne({id:cart.id});
      delete req.session.cart;
    }else{
      req.session.cart.items = items;
    }
    sails.sockets.blast('addtocart', {items: items, value:cartvalue});
    return res.send({items: items, value:cartvalue});
  },
  applycoupon: async (req,res)=>{
    if (!req.isSocket) {
      return res.badRequest();
    }
    let moment = require('moment');
    let now = moment().valueOf();

    let discount = null;
    let code = await CartDiscount.findOne({where:{
      code:req.body.c,
      from:{'<=':now},
      to:{'>=':now},
      active:true
    }});

    if(code){
      await Cart.updateOne({id:req.session.cart.id}).set({discount:code.id});

      if(code.type==='P'){
        discount = req.session.cart.total*(code.value/100);
      }else{
        discount = code.value;
      }
      req.session.cart.code = code.code;
      req.session.cart.discount = discount;
      req.session.cart.total -= discount;
      sails.sockets.blast('couponapplied', {cart: req.session.cart});
      return res.send(code.code);
    }else{
      return res.send('error');
    }
  }
};

