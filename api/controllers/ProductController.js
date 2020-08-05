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
    const root = await Category.findOne({name:'inicio'});
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
      .populate('variations')
      .populate('discount');

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
        .populate('mainColor')
        .populate('manufacturer');
      }else{
        products = await Product.find()
        .populate('images')
        .populate('tax')
        .populate('mainColor')
        .populate('manufacturer');
      }
    }
    let moment = require('moment');
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
      moment:moment
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
    try{
      let response = await sails.helpers.fileUpload(req,'file',12000000,route);
      for(let i=0; i<response.length; i++){
        let hascover = await ProductImage.findOne({product:id, cover:1});
        if (!hascover){cover = 1;}else{cover=0;}
        await ProductImage.create({file:response[i].filename,position:i,cover:cover,product:id});
      }
      result = await ProductImage.find({product:id});
    }catch(err){
      console.log(err);
    }

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
    let product = await Product.findOne({id:req.param('id')}).populate('categories',{level:2});
    let level2 = product.categories.map(c => c.id);
    let variations = await Variation.find({where:{gender:product.gender,category:{in:level2}}});
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
      let response = await sails.helpers.channel.dafiti.product(req.param('product'),action);
      if(response){
        await Product.updateOne({id:req.param('product')}).set({
          dafiti:true,
          dafitistatus:(product.dafitistatus) ? false : true,
          dafitiprice:req.body.dafitiprice,
        });
      }
      return res.send(response);
    }catch(err){
      await Product.updateOne({id:req.param('product')}).set({
        dafiti:false,
        dafitistatus:false,
        dafitiprice:0,
      });
      return res.send(err);
    }
  },
  mercadolibreadd:async(req,res)=>{
    if (!req.isSocket) {
      return res.badRequest();
    }
    try{
      let variations = [];
      let images = [];
      let vimages=[];
      let categories = [];
      let product = await Product.findOne({id:req.param('product')})
      .populate('manufacturer')
      .populate('gender')
      .populate('mainColor')
      .populate('categories')
      .populate('tax');

      let key = await Integrations.findOne({channel:'mercadolibre',seller:product.seller});
      let mercadolibre = await sails.helpers.channel.mercadolibre.init(key);
      let action='Create';
      let response = null;
      let body = null;

      let productimages = await ProductImage.find({product:product.id});
      productimages.forEach(image =>{
        images.push({'source':sails.config.views.locals.imgurl+'/images/products/'+product.id+'/'+image.file});
        vimages.push(sails.config.views.locals.imgurl+'/images/products/'+product.id+'/'+image.file);
      });

      let productvariations = await ProductVariation.find({product:product.id}).populate('variation');

      productvariations.forEach(variation =>{
        let v = {
          'attribute_combinations':[
            {
              'id':'SIZE',
              'value_name':variation.variation.col,
            }
          ],
          'available_quantity':variation.quantity,
          'price':Math.round(parseFloat(variation.price)*(1+parseFloat(req.body.pricemercadolibre))),
          'attributes':[{
            'id':'SELLER_SKU',
            'value_name':variation.id
          }],
          'picture_ids':vimages
        };
        variations.push(v);
      });
      body ={
        //'official_store_id':'123',
        'title':product.name.substring(0,59),
        'price':Math.round((parseFloat(product.price)*(1+(parseFloat(product.tax.value)/100)))*(1+parseFloat(req.body.pricemercadolibre))),
        'currency_id':'COP',
        'buying_mode':'buy_it_now',
        'condition':'new',
        'listing_type_id':'gold_special',
        'description':{
          'plain_text':(product.descriptionShort+' '+product.description).replace(/(<[^>]+>|<[^>]>|<\/[^>]>)/gi,'')
        },
        'sale_terms':[
          {
            'id':'WARRANTY_TYPE',
            'value_name':'Garantía del vendedor'
          },
          {
            'id':'WARRANTY_TIME',
            'value_name':'30 días'
          }
        ],
        'pictures':images,
        'attributes':[
          {
            'id':'BRAND',
            'value_name':product.manufacturer.name
          },
          {
            'id':'MODEL',
            'value_name':product.reference
          },
          {
            'id':'GENDER',
            'value_name':product.gender.name
          },
          {
            'id':'COLOR',
            'value_name':product.mainColor.name
          },
        ],
        //'shipping':[
        //  {
        //    'mode':'me2',
        //    'local_pick_up':false,
        //    'free_shipping':true,
        //    'free_methods':[]
        //  }
        //],
        'variations':variations,
      };

      key = await Integrations.findOne({id:key.id});
      if(product.ml && product.mlstatus){
        action='Update';
        body = {
          'status' : 'paused',
        };
        response = await sails.helpers.channel.mercadolibre.product(mercadolibre,body,key.secret,action,product.mlid);
        await Product.updateOne({id:product.id}).set({mlstatus:false});
      }else if(product.ml && !product.mlstatus){
        body = {'status' : 'active'};
        key = await Integrations.findOne({id:key.id});
        response = await sails.helpers.channel.mercadolibre.product(mercadolibre,body,key.secret,'Get',product.mlid);
        body['variations']=[];
        response.variations.forEach(mlv =>{
          for(let v in variations){
            if(variations[v].attribute_combinations[0].value_name===mlv.attribute_combinations[0].value_name){
              body.variations.push({id:mlv.id,price:variations[v].price});
            }
          }
        });
        response = await sails.helpers.channel.mercadolibre.product(mercadolibre,body,key.secret,'Update',product.mlid);
        await Product.updateOne({id:product.id}).set({mlstatus:true});
      }else{
        for(let c in product.categories){
          categories.push(product.categories[c].name);
        }
        categories = categories.join(' ');
        body['category_id']= await sails.helpers.channel.mercadolibre.findCategory(mercadolibre,categories);
        response = await sails.helpers.channel.mercadolibre.product(mercadolibre,body,key.secret);
        await Product.updateOne({id:product.id}).set({
          mlprice:req.body.pricemercadolibre,
          mlstatus:true,
          ml:true,
          mlid:response.id
        });
      }
      return res.ok();
    }catch(err){
      return res.send(err);
    }
  },
  import: async (req, res)=>{
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if(rights.name!=='superadmin' && !_.contains(rights.permissions,'createproduct')){
      throw 'forbidden';
    }

    let integrations = [];
    let sellers = [];
    let seller = req.session.user.seller;

    if(seller){
      integrations = await Integrations.find({ seller : seller});
    }else{
      integrations = await Integrations.find({});
      sellers = await Seller.find({});
    }

    let error = req.param('error') ? req.param('error') : null;
    return res.view('pages/configuration/import',{layout:'layouts/admin',error:error, integrations : integrations, sellers : sellers});
  },

  importexecute:async (req,res)=>{
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if(rights.name!=='superadmin' && !_.contains(rights.permissions,'createproduct')){
      throw 'forbidden';
    }

    let images = [];
    let variations = [];
    let errors = [];

    if(req.body.channel){
          let importedProducts = await sails.helpers.commerceImporter(
              req.body.channel,
              req.body.pk,
              req.body.sk,
              req.body.apiUrl
        ).catch((e)=>console.log(e));


        let each = async (array, callback) => {
          for (let index = 0; index < array.length; index++) {
            await callback(array[index], index, array);
          }
        }


        let checkdata = async (p)=>{
          return new Promise(async (resolve, reject)=>{
            let pro = {}

            let categorize = async (categoryList)=>{
              
              let clist = categoryList.map(c => c.name.toLowerCase().replace('amp;', ''));
              clist.push('inicio');
              //agregar categoria inicio
              let categories = await Category.find({
                where: {name: clist},
                sort: 'level DESC'
              });

              let categoriesids = [];

              for(let c in categories){
                if(!categoriesids.includes(categories[c].id)){
                    categoriesids.push(categories[c].id);
                }
              }

              let realcats = categories.filter(cat => categoriesids.includes(cat.parent));
              let rcatsids=[];

              for(let rc in realcats){
                if(!rc.includes(realcats[rc].id)){
                    rcatsids.push(realcats[rc].id);
                }
              }

              return rcatsids;
            }

            try {

              pro.name = p.name.toUpperCase().trim();
              pro.reference = p.reference.toUpperCase().trim();
              pro.description = p.description.toLowerCase().trim();
              pro.descriptionShort = p.descriptionShort.toLowerCase().trim();

              if(p.images){
                images.push({
                  reference : p.reference,
                  images: p.images
                })
              }

              pro.categories = await categorize(p.categories);
              
              if( pro.categories.length  > 0){
                pro.mainCategory = pro.categories[0];
              }
              
              Manufacturer.findOrCreate({ name : p.manufacturer}, { name : p.manufacturer, active : true}).exec( async (err, record, wasCreated)=>{
                if(err){return console.log(err)}

                pro.manufacturer = (await Manufacturer.findOne({name:p.manufacturer.toLowerCase()})).id
              });

              Color.findOrCreate({ name : p.mainColor.toLowerCase().trim()}, { name : p.mainColor.toLowerCase(), active : true}).exec( async (err, record, wasCreated)=>{
                if(err){return console.log(err)}

                pro.mainColor = (await Color.findOne({name:p.mainColor.toLowerCase()})).id
              });

              pro.gender = (await Gender.findOne({name:p.gender.toLowerCase()})).id;
              
              if(p.tax){
                  pro.tax = (await Tax.findOne({ value:p.tax.rate})).id;
              }else{
                  pro.tax = (await Tax.findOne({ value:0 })).id;
              }

              pro.mainColor = (await Color.findOne({name:p.mainColor.toLowerCase()})).id;
              pro.seller = req.session.user.seller || req.body.seller; 
              pro.active = p.active;
              pro.width = p.width;
              pro.width = p.height;
              pro.length = p.length;
              pro.weight = p.weight;
              pro.price = p.price;

              if(p.variations && p.variations.length > 0){
                  variations.push({
                    reference : p.reference,
                    variations : p.variations
                  });
              }

              return resolve(pro);

            } catch (error) {
              errors.push({p, error});
              reject(errors);
            }
          });
    }

           let cols = [];

          await each(importedProducts, async (p)=>{
              pro = await checkdata(p).catch(e=>errors.push(e));
              cols.push(pro);
          });
          
          let result = await Product.createEach(cols).fetch();

          await each(result, async(p)=>{
              let source = images.filter((i)=>i.reference == p.reference)[0].images;
              let hasCover = (source.filter(c=>c.cover).length > 0);
              
              if(!hasCover)
                  (source[0].cover = 1);

              await each(source, async (s)=>{
                (s.uploaded = await sails.helpers.uploadImageUrl(s.src, s.file, p.id));
                return s;
              });

              await ProductImage.createEach(source.map((s)=>{
                      let img = {};
                          img.file = s.uploaded.filename;
                          img.cover = s.cover || 0;
                          img.product = p.id;
                          
                          if(img.position)
                            (img.position = s.position);

                  return img; 
              })).catch((e)=>errors.push(e));

              try {
                      if(variations.length > 0){
                        if(variations.filter(v=>v.reference == p.reference).length > 0 ){
                          let productVariations = variations.filter(v=>v.reference == p.reference)[0].variations;

                          each(productVariations, async (pv)=>{
                            let variation = {};
                            variation.seller = req.session.user.seller || req.body.seller;
                            variation.supplierreference = p.reference;
                            
                            if(pv.ean13)
                                variation.ean13 = pv.ean13;
                            if(variation.upc)
                                variation.upc = pv.upc;
                            
                            variation.quantity  = pv.quantity || 0;
                            let product = await Product.findOne({reference:variation.supplierreference, seller:variation.seller}).populate('tax').populate('categories');
                            let categories = [];
                            
                            if(product){
                              product.categories.forEach(category =>{
                                if(!categories.includes(category.id)){
                                    categories.push(category.id);
                                }
                              });

                              variation.product = product.id;
                              variation.price = parseInt(product.price*(1+product.tax.value/100));

                              if(!pv.gender && pv.talla){
                                let  uniqueSize = await Variation.find({
                                  where:{ name:pv.talla.trim().toLowerCase()},
                                  limit:1
                                })

                                (variation.variation = uniqueSize[0].id);

                              }else if(pv.gender && !pv.talla){

                                let gender = await Gender.findOne({ name : pv.gender.toLowerCase()});
                                
                                let  uniqueGender = await Variation.find({
                                  where:{ gender : gender.id, name:"único"}
                                })

                                if(uniqueGender){
                                  (variation.variation = uniqueGender[0].id);
                                }

                              }else if(!pv.talla && !pv.gender){
                                
                                let unique = await Variation.find({
                                  where:{ name:"único"},
                                  limit:1
                                });

                                (variation.variation = unique[0].id);

                              }else{
                                let v = await Variation.find({
                                  where:{ name:pv.talla.trim().toLowerCase(),gender:product.gender,category:{'in':categories}},
                                  limit:1
                                });
                              
                                (variation.variation = v[0].id);
                              }

                              await ProductVariation.create(variation);

                            }else{
                              throw { name:'NOPRODUCT', message:'Producto '+ p.name +' no localizado'};
                            }
                        });
                      }else{
                        throw { name:'NOPRODUCT', message:'Producto '+ p.name +' no localizado'};
                      }
                  }                
              } catch (error) {
                  errors.push(error);
              }
      });

      if(errors.length > 0){
        return res.view('pages/configuration/import',{ layout:'layouts/admin', error:null, resultados:{ items : result, errors : errors}, integrations : []});
      }else{
        res.view('pages/configuration/import',{ layout:'layouts/admin', error:null, resultados:{ items : result}, integrations : []});
      }

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
    req.setTimeout(300000);
    let findFromReference = async(reference) =>{
      return await Product.findOne({reference:reference});
    };
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
                    result[header[i]] = row[i].toString();
                    break;
                }
              }

              let product = await Product.findOne({reference:result['supplierreference'],seller:result['seller']})
              .populate('tax')
              .populate('categories');
              let categories = [];
              if(product){
                product.categories.forEach(category =>{
                  if(!categories.includes(category.id)){
                    categories.push(category.id);
                  }
                });
                result['product'] = product.id;
                result['price'] = parseInt(product.price*(1+product.tax.value/100));
                let variation = await Variation.find({
                  where:{name:result['variation'].replace(',','.').trim().toLowerCase(),gender:product.gender,category:{'in':categories}},
                  limit:1
                });
                if(variation){
                  result['variation'] = (variation[0]).id;
                  delete result['seller'];
                }else{
                  let v = result['variation'];
                  delete result['variation'];
                  result = null;
                  throw {name:'NOVARIATION',message:'Variación '+v+' no disponible para este producto'};
                }
              }else{
                let r = result['supplierreference'];
                result = null;
                throw {name:'NOPRODUCT',message:'Producto '+r+' no localizado'};
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
                    row[i]+=',Inicio';
                    row[i]=row[i].replace(/\,(\s)+/gi,',');
                    let clist = row[i].toLowerCase().split(',');
                    clist = clist.map(r => r.trim());
                    let categories = await Category.find({
                      where: {name: clist},
                      sort: 'level DESC'
                    });
                    let categoriesids = [];
                    for(let c in categories){
                      if(!categoriesids.includes(categories[c].id)){
                        categoriesids.push(categories[c].id);
                      }
                    }
                    let realcats = categories.filter(cat => categoriesids.includes(cat.parent));
                    let rcatsids=[];
                    for(let rc in realcats){
                      if(!rc.includes(realcats[rc].id)){
                        rcatsids.push(realcats[rc].id);
                      }
                    }
                    result[header[i]] = rcatsids;
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
      if(req.body.entity==='ProductImage'){
        let result={
          items:[],
          errors:[]
        };
        let imageslist = await sails.helpers.fileUpload(req,'file',200000000,'images/products/tmp');
        let AWS = require('aws-sdk');
        AWS.config.loadFromPath('./config.json');
        var s3 = new AWS.S3();
        let params = {
          Bucket: 'iridio.co',
          ContentType: 'image/jpeg'
        };
        let fila = 1;
        for(let r in imageslist){
          try{
            let file = imageslist[r].original.split('.');
            let info = file[0].split('_');
            let reference = info[0].trim().toUpperCase();
            let position = info[1];
            let cover = (position===1 || position==='1') ? 1 : 0;
            let product = await findFromReference(reference);
            let productimage = {
              file:imageslist[r].filename,
              position:parseInt(position),
              cover:parseInt(cover),
              product:product.id
            };

            params['Key'] = 'images/products/'+product.id+'/'+imageslist[r].filename;
            params['CopySource'] = '/iridio.co/images/products/tmp/'+imageslist[r].filename;

            s3.copyObject(params, async (err, data) => {
              if(err){result['errors'].push('Archivo '+fila+': '+err.message);}
              if(data){
                await ProductImage.create(productimage);
              }
            });
            result['items'].push({fila:fila,archivo:imageslist[r].original});
          }catch(err){
            result['errors'].push('Archivo '+imageslist[r].original+': '+err.message);
          }
          fila++;
        }
        return res.view('pages/configuration/import',{layout:'layouts/admin',error:null, resultados:result});
      }else{
        let filename = await sails.helpers.fileUpload(req,'file',2000000,'uploads');
        https.get(route+'/uploads/'+filename[0].filename, response => {
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
            try{
              if(checked){
                rows.shift();
                rowdata = rows;
                checkdata(header,rowdata).then(async result =>{
                  try{
                    if(req.body.entity==='Product'){await Product.createEach(result.items);}
                    if(req.body.entity==='ProductVariation'){await ProductVariation.createEach(result.items);}
                  }catch(cerr){
                    return res.redirect('/import?error='+cerr.message);
                  }
                  return res.view('pages/configuration/import',{layout:'layouts/admin',error:null, resultados:result});
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
      }
    }catch(err){
      return res.redirect('/import?error='+err.message);
    }
  },
  searchindex: async (req,res)=>{
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if(rights.name!=='superadmin' && !_.contains(rights.permissions,'updateindex')){
      throw 'forbidden';
    }
    let documents = [];
    let products = await Product.find()
    .populate('tax')
    .populate('manufacturer')
    .populate('mainColor')
    .populate('seller')
    .populate('gender')
    .populate('categories');

    products.forEach(pr =>{
      let doc = {
        type:req.param('action'), // add or delete
        id:pr.id
      };
      let categories = [];
      pr.categories.forEach(cat =>{
        if(!categories.includes(cat.name)){
          categories.push(cat.name);
        }
      });

      if(req.param('action')==='add'){
        doc['fields'] = {
          id:pr.id,
          name:pr.name,
          reference:pr.reference,
          price:pr.price,
          description:pr.description,
          shortdescription:pr.descriptionShort,
          brand:pr.manufacturer.name,
          color:pr.mainColor.name,
          gender:pr.gender.name,
          categories:categories
        };
      }
      documents.push(doc);
    });
    let AWS = require('aws-sdk');
    AWS.config.loadFromPath('./config.json');
    let endpoint = 'doc-iridio-kqxoxbqunm62wui765a5ms5nca.us-east-1.cloudsearch.amazonaws.com';
    var csd = new AWS.CloudSearchDomain({endpoint:endpoint});
    var params = {
      contentType: 'application/json', // required
      documents:  JSON.stringify(documents) // required
    };
    csd.uploadDocuments(params, (err, data) => {
      if (err){console.log(err, err.stack);} // an error occurred
      console.log(data);
      let index = new AWS.CloudSearch();
      index.indexDocuments({DomainName:'iridio'},(err,data) =>{
        if(err){console.log(err);}
        console.log(data);
        return res.redirect('/iridio');
      });
    });
  },
  multiple: async (req, res)=>{
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if(rights.name!=='superadmin' && !_.contains(rights.permissions,'createproduct')){
      throw 'forbidden';
    }
    let sellers = null;
    if(rights.name==='superadmin'){
      let integrations = await Integrations.find({channel:'dafiti'});
      let slist = integrations.map(i => i.seller);
      sellers = await Seller.find({where:{id:{in:slist}},select: ['id', 'name']});
    }
    let error = req.param('error') ? req.param('error') : null;
    return res.view('pages/configuration/multiple',{layout:'layouts/admin',error:error,sellers:sellers});
  },
  multipleexecute: async (req, res) =>{
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if(rights.name!=='superadmin' && !_.contains(rights.permissions,'createproduct')){
      throw 'forbidden';
    }
    let seller = null;
    let sellers = null;
    if(rights.name==='superadmin'){
      let integrations = await Integrations.find({channel:'dafiti'});
      let slist = integrations.map(i => i.seller);
      sellers = await Seller.find({where:{id:{in:slist}},select: ['id', 'name']});
    }
    if(req.body.seller===undefined){seller = req.session.user.seller}else{seller=req.body.seller;}
    let response = {items:{}};
    try{
      let result = await sails.helpers.channel.dafiti.multiple(seller,req.body.action);
      response.items=result;
      return res.view('pages/configuration/multiple',{layout:'layouts/admin',error:null, sellers:sellers,resultados:response});
    }catch(err){
      console.log(err);
      response.errors=err;
      return res.view('pages/configuration/multiple',{layout:'layouts/admin',error:null, sellers:sellers,resultados:response});
    }
  }
};
