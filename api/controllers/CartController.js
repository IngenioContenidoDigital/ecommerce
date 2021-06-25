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
    let iridio = null;
    if(req.hostname!=='iridio.co' && req.hostname!=='demo.1ecommerce.app' && req.hostname!=='localhost' && req.hostname!=='1ecommerce.app'){
      seller = await Seller.findOne({domain:req.hostname/*'sanpolos.com'*/});
    }else{
      iridio = await Channel.findOne({name:'iridio'});
    }
    if(req.session.cart!==undefined){
      cart = await CartProduct.find({cart:req.session.cart.id}).sort('createdAt ASC')
      .populate('product')
      .populate('productvariation');

      for(let cartproduct of cart){
        cartproduct.product = await Product.findOne({id:cartproduct.product.id})
        .populate('images')
        .populate('mainColor')
        .populate('mainCategory')
        .populate('manufacturer')
        .populate('tax');
        let discounts = await sails.helpers.discount(cartproduct.product.id);
        if(iridio && discounts){
          let integrations = await ProductChannel.find({channel:iridio.id,product:cartproduct.product.id});
          integrations = integrations.map(itg => itg.integration);
          discounts = discounts.filter((ad)=>{if(ad.integrations && ad.integrations.length > 0 && integrations.length>0 && ad.integrations.some(ai => integrations.includes(ai.id))){return ad;}});
        }
        cartproduct.product.discount = discounts ? discounts[0] : null;
        cartproduct.productvariation.variation = await Variation.findOne({id:cartproduct.productvariation.variation});
      }
    }
    return res.view('pages/front/cart',{cart:cart,tag:await sails.helpers.getTag(req.hostname), seller:seller});
  },
  addtocart: async function(req, res){
    if (!req.isSocket) {
      return res.badRequest();
    }
    let iridio = null;
    if(req.body.hostname==='iridio.co' || req.body.hostname==='demo.1ecommerce.app' || req.body.hostname==='localhost' || req.body.hostname==='1ecommerce.app'){
      iridio = await Channel.findOne({name:'iridio'});
    }
    let cart = null;
    let products = null;
    let action = req.body.action;
    let productvariation = await ProductVariation.findOne({id:req.body.variation}).populate('product').populate('seller');
    if (productvariation.product.active && productvariation.seller.active) {
      if(req.session.cart === undefined){
        cart = await Cart.create().fetch();
        req.session.cart = cart;
      }else{
        cart = await Cart.findOne({id:req.session.cart.id}).populate('discount');
      }
      if(action==='remove'){
        await CartProduct.destroy({cart:cart.id,product:productvariation.product.id,productvariation:productvariation.id});
      }else{
        await CartProduct.destroy({cart:cart.id,product:productvariation.product.id,productvariation:productvariation.id});
        let discounts = await sails.helpers.discount(productvariation.product.id,productvariation.id);
        if(iridio && discounts){
          let integrations = await ProductChannel.find({channel:iridio.id,product:productvariation.product.id});
          integrations = integrations.map(itg => itg.integration);
          discounts = discounts.filter((ad)=>{if(ad.integrations && ad.integrations.length > 0 && integrations.length>0 && ad.integrations.some(ai => integrations.includes(ai.id))){return ad;}});
        }
        let discount = discounts ? discounts[0] : null;
        for(let i=0; i<req.body.quantity; i++){
          if(discount){
            await CartProduct.create({cart:cart.id,product:productvariation.product.id,productvariation:productvariation.id,totalDiscount:discount.amount,totalPrice:discount.price});
          }else{
            await CartProduct.create({cart:cart.id,product:productvariation.product.id,productvariation:productvariation.id,totalDiscount:0,totalPrice:productvariation.price});
          }
        }
      }

      let cartvalue = await CartProduct.sum('totalPrice',{cart:cart.id});
      let items = await CartProduct.count({cart:cart.id});
      req.session.cart.totalProducts = cartvalue ? cartvalue : 0;
      products = await sails.helpers.tools.cart(req,cart.id);
      if(cart.discount!==undefined && cart.discount!==null){
        if(cart.discount.type==='P'){
          discount = cartvalue*(cart.discount.value/100);
        }else{
          discount = cart.discount.value;
        }
        req.session.cart.discount = discount;
        req.session.cart.total = cartvalue-discount+cart.shipping;
      }else{
        req.session.cart.total = cartvalue+cart.shipping;
      }
  
      if(items<1){
        await Cart.destroyOne({id:cart.id});
        delete req.session.cart;
        products=null;
      }else{
        req.session.cart.items = items;
      }
      sails.sockets.blast('addtocart', {items: items, value:cartvalue});
      return res.send({items: items, value:cartvalue,products:products});
    } else {
      return res.send({items: 0, value:0, products:[]});
    }
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
  },
  getcart: async (req, res) =>{
    if(!req.isSocket){
      return res.badRequest();
    }
    let cartproducts = await sails.helpers.tools.cart(req,req.session.cart.id);
    return res.send(cartproducts);
  },
  shippingquote: async (req, res) =>{
    if(!req.isSocket){
      return res.badRequest();
    }
    req.session.cart.shipping = 0;
    let quotation = await sails.helpers.carrier.coordinadora.quotation(req.body.address,req.session.cart.id);
    req.session.cart.shipping = quotation.shipping;
    return res.send(quotation);
  }
};

