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
      await CartProduct.destroy({cart:cart.id,product:productvariation.product,productvariation:productvariation.id});
    }else{
      await CartProduct.destroy({cart:cart.id,product:productvariation.product,productvariation:productvariation.id});
      let discount = await sails.helpers.discount(productvariation.product);
      for(let i=0; i<req.body.quantity; i++){
        if(discount!==null && discount!==undefined){
          await CartProduct.create({cart:cart.id,product:productvariation.product,productvariation:productvariation.id,totalDiscount:discount.amount,totalPrice:discount.price});
        }else{
          await CartProduct.create({cart:cart.id,product:productvariation.product,productvariation:productvariation.id,totalDiscount:0,totalPrice:productvariation.price});
        }
      }
    }

    let items = await CartProduct.find({cart:cart.id}).populate('productvariation');
    let cartvalue = 0;
    for(let item of items){
      cartvalue += parseFloat(item.totalPrice);
    }
    req.session.cart.total = cartvalue;

    if(items.length<1){
      await Cart.destroyOne({id:cart.id});
      delete req.session.cart;
    }else{
      req.session.cart.items = items.length;
    }
    sails.sockets.blast('addtocart', {items: items.length, value:cartvalue});
    return res.send({items: items.length, value:cartvalue});
  },
};

