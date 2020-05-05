/**
 * ProductController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
  showproducts: async function(req,res){
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if(rights.name!=='superadmin' && !_.contains(rights.permissions,'showproducts')){
      throw 'forbidden';
    }
    const root = await Category.findOne({name:'Inicio'});
    const brands = await Manufacturer.find();
    const colors = await Color.find();
    let sellers = null;
    if(rights.name!=='superadmin'){
      sellers = await Seller.find({id:req.session.user.seller});
    }else{
      sellers = await Seller.find();
    }

    const taxes = await Tax.find();
    const variations = await Variation.find();
    let error=null;
    let product; let products=null;
    let action = req.param('action') ? req.param('action') : null;
    let id = (req.param('id')!==undefined) ? req.param('id') : null;
    if(id!==undefined){
      product = await Product.findOne({id:id})
      .populate('images')
      .populate('tax')
      .populate('mainCategory')
      .populate('mainColor')
      .populate('categories')
      .populate('variations');
    }
    if(action===null){
      if(rights.name!=='superadmin'){
        products = await Product.find({seller:req.session.user.seller})
        .populate('images')
        .populate('tax')
        .populate('mainColor');
      }else{
        products = await Product.find()
        .populate('images')
        .populate('tax')
        .populate('mainColor');
      }
    }
    return res.view('pages/catalog/product',{layout:'layouts/admin',
      products:products,
      root:root,
      brands:brands,
      colors:colors,
      sellers:sellers,
      taxes:taxes,
      variations:variations,
      action:action,
      product:product,
      error:error,
    });
  },
  createproduct: async function(req, res){
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if(rights.name!=='superadmin' && !_.contains(rights.permissions,'createproduct')){
      throw 'forbidden';
    }
    if (!req.isSocket) {
      return res.badRequest();
    }
    var error = null;
    let product = null;
    try{
      let exists = await Product.findOne({reference:req.body.reference.toUpperCase().trim(),seller:req.body.seller});
      if(!exists){
        product = await Product.create({
          name: req.body.name.toLowerCase().trim(),
          reference: req.body.reference.toUpperCase().trim(),
          description: req.body.description,
          descriptionShort: req.body.descriptionshort,
          active: req.body.active,
          price: req.body.price,
          tax: req.body.tax,
          mainCategory: req.body.mainCategory,
          mainColor: req.body.mainColor,
          manufacturer: req.body.manufacturer,
          seller: req.body.seller
        }).fetch();
        await Product.addToCollection(product.id,'categories').members(JSON.parse(req.body.categories));
      }else{
        product = await Product.updateOne({id:exists.id}).set({
          name: req.body.name.toLowerCase().trim(),
          reference: req.body.reference.toUpperCase().trim(),
          description: req.body.description,
          descriptionShort: req.body.descriptionshort,
          active: req.body.active,
          price: req.body.price,
          tax: req.body.tax,
          mainCategory: req.body.mainCategory,
          mainColor: req.body.mainColor,
          manufacturer: req.body.manufacturer,
          seller: req.body.seller
        });
        await Product.replaceCollection(product.id,'categories').members(JSON.parse(req.body.categories));
      }
    }catch(err){
      error = err.msg;
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (error===undefined || error===null){
      return res.send(product.id);
    }else{
      return res.send(error);
    }
  },
  productimages: async function(req,res){
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if(rights.name!=='superadmin' && !_.contains(rights.permissions,'productimages')){
      throw 'forbidden';
    }
    let id = req.body.id;
    let route ='assets/images/products/'+id;
    let cover=0;
    let result = null;
    let response = await sails.helpers.fileUpload(req,'file',12000000,route);
    for(let i=0; i<response.length; i++){
      let hascover = await ProductImage.findOne({product:id, cover:1});
      if (!hascover){cover = 1;}else{cover=0;}
      await ProductImage.create({file:response[i],position:i,cover:cover,product:id});
    }
    result = await ProductImage.find({product:id});

    res.send(result);
  },
  setcover: async function(req,res){
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if(rights.name!=='superadmin' && !_.contains(rights.permissions,'setcover')){
      throw 'forbidden';
    }
    if (!req.isSocket) {
      return res.badRequest();
    }
    let image = await ProductImage.updateOne({id:req.param('id')}).set({cover:1});
    await ProductImage.update({where:{product:image.product, id:{'!=':req.param('id')}},}).set({cover:0});

    return res.send(image.id);
  },
  removeimage: async function(req,res){
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if(rights.name!=='superadmin' && !_.contains(rights.permissions,'removeimage')){
      throw 'forbidden';
    }
    let image = await ProductImage.findOne({id:req.param('id')});
    let route ='assets/images/products/'+image.product;
    let ext = image.file.split('.').pop();
    let filename = image.file.replace(ext,'');
    let error=null;
    let newcover = [];
    var fs = require('fs');
    await ProductImage.destroyOne({id:req.param('id')});
    try{
      fs.unlinkSync(route+'/'+image.file);
      fs.unlinkSync(route+'/'+filename+'webp');
      let images = await ProductImage.find({product:image.product});
      if(image.cover===1 && images.length>0){
        newcover = await ProductImage.find({
          where: { product: image.product, id:{'!=':image.id} },
          limit: 1,
          sort: 'createdAt ASC'
        });
        await ProductImage.updateOne({id:newcover[0].id}).set({cover:1});
        await ProductImage.update({where:{product:newcover[0].product, id:{'!=':newcover[0].id}},}).set({cover:0});
      }
    }catch(err){
      error = err;
    }
    if(error !== null){
      return res.send(error);
    }else if(newcover.length>0){
      return res.send(newcover[0].id);
    }else{
      return res.send('ok');
    }
  },
  productvariations: async function(req,res){
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if(rights.name!=='superadmin' && !_.contains(rights.permissions,'productvariations')){
      throw 'forbidden';
    }
    let rows = [];
    for(let row in req.body){
      rows.push(JSON.parse(req.body[row]));
    }
    for(let list in rows){
      if(rows[list].productvariation>0){
        await ProductVariation.updateOne({id:parseInt(rows[list].productvariation)}).set({product:rows[list].product,variation:rows[list].variation,reference:rows[list].reference,supplierreference:rows[list].supplierreference,ean13:rows[list].ean13,upc:rows[list].upc,price:rows[list].price,quantity:rows[list].quantity});
      }else{
        await ProductVariation.create({product:rows[list].product,variation:rows[list].variation,reference:rows[list].reference,supplierreference:rows[list].supplierreference,ean13:rows[list].ean13,upc:rows[list].upc,price:rows[list].price,quantity:rows[list].quantity});
      }
    }
    return res.send('ok');
  },
  deletevariations: async function(req, res){
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if(rights.name!=='superadmin' && !_.contains(rights.permissions,'deletevariations')){
      throw 'forbidden';
    }
    if (!req.isSocket) {
      return res.badRequest();
    }
    var id = req.param('id');
    var deletedVariation = await ProductVariation.destroyOne({id:id});
    return res.send(deletedVariation);
  },
  productstate: async function(req, res){
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if(rights.name!=='superadmin' && !_.contains(rights.permissions,'productstate')){
      throw 'forbidden';
    }
    if (!req.isSocket) {
      return res.badRequest();
    }
    var id = req.param('id');
    var state = req.param('active');
    var updatedProduct = await Product.updateOne({id:id}).set({active:state});
    return res.send(updatedProduct);
  },
  listproduct: async function(req, res){
    let product = await Product.findOne({id:req.param('id')})
    .populate('manufacturer')
    .populate('mainColor')
    .populate('tax')
    .populate('variations')
    .populate('images');

    let discount = await sails.helpers.discount(product.id);

    for(let size of product.variations){
      size.variation=await Variation.findOne({id:size.variation});
    }

    return res.view('pages/front/product',{product:product, discount:discount});
  }

};

