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
    const genders = await Gender.find();
    let sellers = null;
    if(rights.name!=='superadmin'){
      sellers = await Seller.find({id:req.session.user.seller});
    }else{
      sellers = await Seller.find();
    }

    const taxes = await Tax.find();
    let variations = null;
    let error=null;
    let product; let products=null;
    let action = req.param('action') ? req.param('action') : null;
    let id = (req.param('id')!==undefined) ? req.param('id') : null;

    if(id!==undefined && id!==null){
      product = await Product.findOne({id:id})
      .populate('images')
      .populate('tax')
      .populate('mainCategory')
      .populate('mainColor')
      .populate('categories')
      .populate('variations');

      if(product.gender!==undefined && product.gender!==null){
        variations = await Variation.find({gender:product.gender});
      }
      for(let pv in product.variations){
        product.variations[pv].variation = await Variation.findOne({id:product.variations[pv].variation});
      }
      //return a.variation.name.localeCompare(b.variation.name)
      product.variations.sort((a,b)=>{return parseFloat(a.variation.name) - parseFloat(b.variation.name);});

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
      genders:genders,
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
          gender:req.body.gender,
          seller: req.body.seller,
          width:req.body.width,
          height:req.body.height,
          length:req.body.length,
          weight:req.body.weight
        }).fetch();
        await Product.addToCollection(product.id,'categories',JSON.parse(req.body.categories));
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
          gender:req.body.gender,
          seller: req.body.seller,
          width:req.body.width,
          height:req.body.height,
          length:req.body.length,
          weight:req.body.weight
        });
        await Product.replaceCollection(product.id,'categories').members(JSON.parse(req.body.categories));
      }
      product.priceWt= product.price*(1+((await Tax.findOne({id:product.tax})).value/100));
    }catch(err){
      error = err.msg;
    }
    if (error===undefined || error===null){
      return res.send(product);
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
    let route ='images/products/'+id;
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
    let error=null;
    let newcover = [];
    await ProductImage.destroyOne({id:req.param('id')});
    try{
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
      ProductVariation.findOrCreate({id:rows[list].productvariation},{product:rows[list].product,variation:rows[list].variation,reference:rows[list].reference,supplierreference:rows[list].supplierreference,ean13:rows[list].ean13,upc:rows[list].upc,price:rows[list].price,quantity:rows[list].quantity})
      .exec(async (err, record, wasCreated)=>{
        if(err){return res.send('error');}
        if(!wasCreated){
          await ProductVariation.updateOne({id:record.id}).set({product:rows[list].product,variation:rows[list].variation,reference:rows[list].reference,supplierreference:rows[list].supplierreference,ean13:rows[list].ean13,upc:rows[list].upc,price:rows[list].price,quantity:rows[list].quantity});
        }
      });
    }
    return res.send('ok');
  },
  findvariations:async(req,res)=>{
    if (!req.isSocket) {
      return res.badRequest();
    }
    let product = await Product.findOne({id:req.param('id')});
    let variations = await Variation.find({gender:product.gender});
    return res.send(variations);
  },
  findproductvariations:async(req,res)=>{
    if (!req.isSocket) {
      return res.badRequest();
    }
    let productvariations = await ProductVariation.find({product:req.param('id'), quantity:{'>':0}})
    .populate('variation');

    return res.send(productvariations);
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
  dafitiadd:async (req, res) =>{
    if (!req.isSocket) {
      return res.badRequest();
    }
    try{
      let action = null;
      let product = await Product.findOne({id:req.param('product')});
      if(!product.dafiti){
        action='ProductCreate';
      }else{
        action='ProductUpdate';
      }
      await Product.updateOne({id:req.param('product')}).set({
        dafiti:true,
        dafitistatus:req.body.status,
        dafitiprice:req.body.dafitiprice,
      });
      let response = await sails.helpers.channel.dafiti.product(req.param('product'),action);
      return res.send(response);
    }catch(err){
      return res.send(err);
    }
  },
  import: async (req, res)=>{
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if(rights.name!=='superadmin' && !_.contains(rights.permissions,'createproduct')){
      throw 'forbidden';
    }
    let error = req.param('error') ? req.param('error') : null;
    return res.view('pages/configuration/import',{layout:'layouts/admin',error:error});
  },
  importexecute:async (req,res)=>{
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if(rights.name!=='superadmin' && !_.contains(rights.permissions,'createproduct')){
      throw 'forbidden';
    }
    let header = null;
    let checkheader={
      product:['name','reference','description','descriptionShort','active','price','tax','manufacturer','width','height','length','weight','gender','seller','mainColor','categories','mainCategory'],
      productvariation:['supplierreference','reference','ean13','upc','quantity','variation','seller'],
      productimage:['reference','seller','route','files']
    };
    let checked = false;
    const https = require('https');
    let route = sails.config.views.locals.imgurl;
    let checkdata = async (header, data) => {
      let body = {
        items:[],
        errors:[],
      };
      try{
        let fila = 2;
        for(let d in data){
          let row = data[d].split(';');
          let result = {};
          try{
            if(req.body.entity==='ProductVariation'){
              for(let i in header){
                switch(header[i]){
                  case 'reference':
                    result[header[i]] = row[i] ? row[i].trim().toUpperCase() : '';
                    break;
                  case 'supplierreference':
                    result[header[i]] = row[i].trim().toUpperCase();
                    break;
                  case 'ean13':
                    result[header[i]] = row[i] ? parseInt(row[i]) : 0;
                    break;
                  case 'upc':
                    result[header[i]] = row[i] ? parseInt(row[i]) : 0;
                    break;
                  case 'quantity':
                    result[header[i]] = row[i] ? parseInt(row[i]) : 0;
                    break;
                  case 'seller':
                    result[header[i]] = (await Seller.findOne({domain:row[i].trim().toLowerCase()})).id;
                    break;
                  default:
                    result[header[i]] = row[i];
                    break;
                }
              }

              let product = await Product.findOne({reference:result['supplierreference'],seller:result['seller']}).populate('tax');
              if(product){
                result['product'] = product.id;
                result['price'] = parseInt(product.price*(1+product.tax.value/100));
                let variation = await Variation.findOne({name:result['variation'].replace(',','.').trim().toLowerCase(),gender:product.gender});
                if(variation){
                  result['variation'] = variation.id;
                  delete result['seller'];
                }else{
                  let v = result['variation'];
                  result = null;
                  throw {name:'NOVARIATION',message:'Variación '+v+' no disponible para este producto'};
                }
              }
            }
            if(req.body.entity==='Product'){
              for(let i in header){
                switch(header[i]){
                  case 'reference':
                    result[header[i]] = row[i].trim().toUpperCase();
                    break;
                  case 'name':
                    result[header[i]] = row[i].trim().toLowerCase();
                    break;
                  case 'tax':
                    result[header[i]] = (await Tax.findOne({value:row[i]})).id;
                    break;
                  case 'categories':
                    let categories = await Category.find({
                      where: {name: row[i].trim().toLowerCase().split(',')},
                      sort: 'level DESC'
                    });
                    let categoriesids = [];
                    for(let c in categories){
                      if(!categoriesids.includes(categories[c].id)){
                        categoriesids.push(categories[c].id);
                      }
                    }
                    result[header[i]] = categoriesids;
                    result['mainCategory'] = categories[0].id;
                    break;
                  case 'mainCategory':
                    break;
                  case 'mainColor':
                    result[header[i]] = (await Color.findOne({name:row[i].trim().toLowerCase()})).id;
                    break;
                  case 'manufacturer':
                    result[header[i]] = (await Manufacturer.findOne({name:row[i].trim().toLowerCase()})).id;
                    break;
                  case 'gender':
                    result[header[i]] = (await Gender.findOne({name:row[i].trim().toLowerCase()})).id;
                    break;
                  case 'active':
                    let eval = row[i].toLowerCase().trim();
                    result[header[i]] = (eval==='true' || eval==='1' || eval==='verdadero' || eval==='si' || eval==='sí') ? true : false;
                    break;
                  case 'width':
                    result[header[i]] = parseFloat(row[i].replace(',','.'));
                    break;
                  case 'height':
                    result[header[i]] = parseFloat(row[i].replace(',','.'));
                    break;
                  case 'length':
                    result[header[i]] = parseFloat(row[i].replace(',','.'));
                    break;
                  case 'weight':
                    result[header[i]] = parseFloat(row[i].replace(',','.'));
                    break;
                  case 'seller':
                    result[header[i]] = (await Seller.findOne({domain:row[i].trim().toLowerCase()})).id;
                    break;
                  case 'price':
                    result[header[i]] = parseFloat(row[i].replace(',','.'));
                    break;
                  case 'variation':
                    result[header[i]] = parseFloat(row[i].replace(',','.'));
                    break;
                  default:
                    result[header[i]] = row[i];
                    break;
                }
              }
            }
            if(req.body.entity==='ProductImage'){
              for(let i in header){
                switch(header[i]){
                  case 'reference':
                    result[header[i]] = row[i].trim().toUpperCase();
                    break;
                  case 'seller':
                    result[header[i]] = (await Seller.findOne({domain:row[i].trim().toLowerCase()})).id;
                    break;
                  case 'files':
                    let files = row[i].trim().split(',').sort();
                    result[header[i]] = files;
                    break;
                  default:
                    result[header[i]] = row[i].trim();
                    break;
                }
              }
              result['product'] = (await Product.findOne({reference:result['reference'],seller:result['seller']})).id;
            }
            if(result!==null){
              body['items'].push(result);
            }
          }catch(err){
            body['errors'].push('Fila '+fila+': '+err.message);
          }
          fila++;
        }
        return body;
      }catch(err){
        return err;
      }
    };
    try{
      let filename = await sails.helpers.fileUpload(req,'csv',3000000,'uploads');
      https.get(route+'/uploads/'+filename[0], response => {
        let str ='';
        response.on('data', chunk=>{str += chunk.toString();});
        response.on('end', ()=>{
          let rows = str.split('\n');
          header = rows[0].split(';');
          if(req.body.entity==='Product'){
            header.push('mainCategory');
            if(JSON.stringify(header)===JSON.stringify(checkheader.product)){checked=true;}
          }
          if(req.body.entity==='ProductVariation'){
            for(let h in header){
              if(header[h]==='reference'){header[h]='supplierreference';}
              if(header[h]==='reference2'){header[h]='reference';}
            }
            if(JSON.stringify(header)===JSON.stringify(checkheader.productvariation)){checked=true;}
          }
          if(req.body.entity==='ProductImage'){if(JSON.stringify(header)===JSON.stringify(checkheader.productimage)){checked=true;}}
          try{
            if(checked){
              rows.shift();
              rowdata = rows;
              checkdata(header,rowdata).then(async result =>{
                try{
                  if(req.body.entity==='Product'){await Product.createEach(result.items);}
                  if(req.body.entity==='ProductVariation'){await ProductVariation.createEach(result.items);}
                  if(req.body.entity==='ProductImage'){
                    let fs = require('fs');
                    let AWS = require('aws-sdk');
                    AWS.config.loadFromPath('./config.json');
                    var s3 = new AWS.S3();
                    let params = {
                      Bucket: 'iridio.co',
                      ContentType: 'image/jpeg'
                    };
                    for(let r in result.items){
                      let position=1;
                      let cover = 1;
                      for(let f in result.items[r].files){
                        if(position>1){cover=0;}
                        let productimage = {
                          file:result.items[r].files[f],
                          position:position,
                          cover:cover,
                          product:result.items[r].product
                        };
                        fs.readFile(result.items[r].route+result.items[r].files[f], (err,data)=>{
                          if(err){console.log(err);}
                          if(data){
                            params['Key'] = 'images/products/'+result.items[r].product+'/'+result.items[r].files[f];
                            params['Body'] = new Buffer(data, 'binary');
                            s3.upload(params, async (err, data) => {
                              if(err){console.log(err);}
                              if(data){await ProductImage.create(productimage);}
                            });
                          }
                        });
                        position++;
                      }
                    }
                  }
                  return res.view('pages/configuration/import',{layout:'layouts/admin',error:null, resultados:result});
                }catch(cerr){
                  return res.redirect('/import?error='+cerr.message);
                }
              }).catch(err=>{
                return res.redirect('/import?error='+err.message);
              });
            }else{
              throw {name:'E_FORMATO',message:'El Archivo no cumple con el formato requerido para ser procesado.'};
            }
          }catch(err){
            return res.redirect('/import?error='+err.message);
          }
        });
      });
    }catch(err){
      return res.redirect('/import?error='+err.message);
    }
  }
};

