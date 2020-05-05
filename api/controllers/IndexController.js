/**
 * IndexController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
  index: async function(req, res){
    return res.view('pages/homepage');
  },
  checkout: async function(req, res){
    if(req.session.cart===undefined || req.session.cart===null){
      return res.redirect('/cart');
    }
    let addresses = null;
    addresses = await Address.find({user:req.session.user.id})
    .populate('country')
    .populate('region')
    .populate('city');
    let error = req.param('error') ? req.param('error') : null;

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

    return res.view('pages/front/checkout', {addresses:addresses, cart:cart, error:error});
  },
  list: async function(req, res){

    let entity = req.param('entity');
    let ename = req.param('name');
    let object = null;
    switch(entity){
      case 'categoria':
        try{
          object = await Category.findOne({url:ename}).populate('products')
          object.route = '/images/categories/';
        }catch(err){
          return res.notFound(err);
        }
        break;
      case 'marca':
        try{
          object = await Manufacturer.findOne({url:ename}).populate('products');
          object.route = '/images/brands/';
        }catch(err){
          return res.notFound(err);
        }
        break;
      default:
        return res.notFound();
    }

    let colorlist = [];
    let brandlist = [];
    for(let p of object.products){
      p.cover= await ProductImage.findOne({product:p.id,cover:1});
      if(!colorlist.includes(p.mainColor)){
        colorlist.push(p.mainColor);
      }
      p.mainColor=await Color.findOne({id:p.mainColor});
      if(!brandlist.includes(p.manufacturer)){
        brandlist.push(p.manufacturer);
      }
      p.manufacturer=await Manufacturer.findOne({id:p.manufacturer});
      p.seller=await Seller.findOne({id:p.seller});
      p.tax=await Tax.findOne({id:p.tax});
      p.productvariation=await ProductVariation.find({product:p.id}).populate('variation');
      p.discount = await sails.helpers.discount(p.id);
    }
    let colors = await Color.find({where:{id:{'in':colorlist}}});
    let brands = await Manufacturer.find({where:{id:{'in':brandlist}}});
    return res.view('pages/front/list',{object:object,colors:colors,brands:brands});
  }
};

