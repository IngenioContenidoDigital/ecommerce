/**
 * CartController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
  viewcart: async function(req, res){
    let cart = null;
    if(req.session.cart!==undefined){
      cart = await CartProduct.find({cart:req.session.cart.id})
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
    return res.view('pages/front/cart',{cart:cart});
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
      cart = await Cart.findOne({id:req.session.cart.id});
    }
    let productvariation = await ProductVariation.findOne({id:req.body.variation});

    if(action==='remove'){
      await CartProduct.destroyOne({cart:cart.id,product:productvariation.product,productvariation:productvariation.id});
    }else{
      let record = await CartProduct.findOrCreate({cart:cart.id,product:productvariation.product,productvariation:productvariation.id},{cart:cart.id,product:productvariation.product,productvariation:productvariation.id});
      await CartProduct.updateOne({id:record.id}).set({quantity:parseInt(req.body.quantity)});
    }

    let items = await CartProduct.find({cart:cart.id}).populate('productvariation');
    let cartvalue = 0;
    for(let item of items){
      let discount = await sails.helpers.discount(item.productvariation.product);
      if(discount!==null){
        cartvalue += parseFloat(discount.price*item.quantity);
      }else{
        cartvalue += parseFloat(item.productvariation.price*item.quantity);
      }
    }
    req.session.cart.total = cartvalue;

    let totalincart = await CartProduct.sum('quantity').where({cart:cart.id});
    if(totalincart<1){
      await Cart.destroyOne({id:cart.id});
      delete req.session.cart;
    }else{
      req.session.cart.items = totalincart;
    }
    sails.sockets.blast('addtocart', {items: totalincart, value:cartvalue});
    return res.send({items: totalincart, value:cartvalue});
  },
};

