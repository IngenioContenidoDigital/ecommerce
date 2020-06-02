/**
 * IndexController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
  index: async function(req, res){
    //let moment = require('moment');
    //await sails.helpers.channel.dafiti.orders('5ec570dd855a321811d1735b',['CreatedBefore='+moment().toISOString(true),'CreatedAfter='+moment().subtract(6,'hours').toISOString(true),'Status=pending','SortDirection=ASC']);

    let slider = await Slider.find({active:true}).populate('textColor');
    return res.view('pages/homepage',{slider:slider,tag:await sails.helpers.getTag(req.hostname),menu:await sails.helpers.callMenu()});
  },
  admin: async function(req, res){
    return res.view('pages/homeadmin',{layout:'layouts/admin'});
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

    let tokens = await Token.find({user:req.session.user.id});

    return res.view('pages/front/checkout', {addresses:addresses, cart:cart, error:error, tokens:tokens,tag:await sails.helpers.getTag(req.hostname)});
  },
  list: async function(req, res){

    let entity = req.param('entity');
    let ename = req.param('name');
    let object = null;
    switch(entity){
      case 'categoria':
        try{
          object = await Category.findOne({url:ename}).populate('products').populate('children');
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
    let genderlist = [];
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
      p.gender = await Gender.findOne({id:p.gender});
      if(!genderlist.includes(p.gender.id)){
        genderlist.push(p.gender.id);
      }
    }
    let colors = await Color.find({where:{id:{'in':colorlist}}});
    let brands = await Manufacturer.find({where:{id:{'in':brandlist}}});
    let genders = await Gender.find({where:{id:{'in':genderlist}}});
    return res.view('pages/front/list',{object:object,colors:colors,brands:brands,genders:genders,tag:await sails.helpers.getTag(req.hostname),menu:await sails.helpers.callMenu()});
  },
  search: async(req, res) =>{
    let terms = req.body.search.toLowerCase().split(' ');
    let products = await Product.find()
    .populate('tax')
    .populate('manufacturer')
    .populate('mainColor')
    .populate('seller')
    .populate('gender');

    let result={
      search:req.body.search,
      products:[]
    };
    let colorlist = [];
    let brandlist = [];
    let genderlist = [];

    let found = (terms, products,i)=>{
      products = products.filter(product =>
        product.active===true && (
          product.reference.includes(terms[i].toUpperCase()) ||
          product.name.includes(terms[i]) ||
          product.manufacturer.name.includes(terms[i]) ||
          product.mainColor.name.includes(terms[i]) ||
          product.description.toLowerCase().includes(terms[i]) ||
          product.descriptionShort.toLowerCase().includes(terms[i]) ||
          product.seller.name.includes(terms[i])
        )
      );
      i++;
      if(terms.length>i){
        return found(terms,products,i);
      }else{
        return products;
      }
    };

    let set = found(terms,products,0);

    for(let p of set){
      if(!result.products.includes(p.id)){
        p.cover= await ProductImage.findOne({product:p.id,cover:1});
        p.productvariation=await ProductVariation.find({product:p.id}).populate('variation');
        p.discount = await sails.helpers.discount(p.id);
        result.products.push(p);
        if(!colorlist.includes(p.mainColor.id)){
          colorlist.push(p.mainColor.id);
        }
        if(!brandlist.includes(p.manufacturer.id)){
          brandlist.push(p.manufacturer.id);
        }
        if(!genderlist.includes(p.gender.id)){
          genderlist.push(p.gender.id);
        }
      }
    }

    let colors = await Color.find({where:{id:{'in':colorlist}}});
    let brands = await Manufacturer.find({where:{id:{'in':brandlist}}});
    let genders = await Gender.find({where:{id:{'in':genderlist}}});

    return res.view('pages/front/list',{object:result,colors:colors,brands:brands,genders:genders,tag:await sails.helpers.getTag(req.hostname),menu:await sails.helpers.callMenu()});

  },
  listproduct: async function(req, res){
    let product = await Product.findOne({name:decodeURIComponent(req.param('name'))})
      .populate('manufacturer')
      .populate('mainColor')
      .populate('tax')
      .populate('variations')
      .populate('images');

    let discount = await sails.helpers.discount(product.id);
    let title = product.name;
    let description = product.descriptionShort.replace(/<\/?[^>]+(>|$)/g, '')+' '+product.description.replace(/<\/?[^>]+(>|$)/g, '');
    let words = product.name.split(' ');
    let keywords = [product.manufacturer.name, product.reference, product.mainColor.name];
    for(let word of words){
      keywords.push(word);
    }
    keywords = keywords.join(',');

    for(let size of product.variations){
      size.variation=await Variation.findOne({id:size.variation});
    }

    return res.view('pages/front/product',{
      product:product,
      discount:discount,
      title:title,
      description:description,
      keywords:keywords,
      tag:await sails.helpers.getTag(req.hostname), 
      menu:await sails.helpers.callMenu()});
  }
};

