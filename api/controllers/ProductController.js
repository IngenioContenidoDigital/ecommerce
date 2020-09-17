
/**
 * ProductController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
const constants = {
  PRODUCT_TYPE: sails.config.custom.PRODUCT_TYPE,
  PRODUCT_VARIATION: sails.config.custom.PRODUCT_VARIATION,
  IMAGE_TYPE: sails.config.custom.IMAGE_TYPE,
  STATUS_UPLOADED : sails.config.custom.STATUS_UPLOADED,
  SHOPIFY_CHANNEL : sails.config.custom.SHOPIFY_CHANNEL,
  SHOPIFY_PAGESIZE : sails.config.custom.SHOPIFY_PAGESIZE,
  WOOCOMMERCE_PAGESIZE : sails.config.custom.WOOCOMMERCE_PAGESIZE,
  WOOCOMMERCE_CHANNEL : sails.config.custom.WOOCOMMERCE_CHANNEL,
  TIMEOUT_PRODUCT_TASK : 4000000,
  TIMEOUT_IMAGE_TASK : 8000000,
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

module.exports = {
  showproducts: async function (req, res) {
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if (rights.name !== 'superadmin' && !_.contains(rights.permissions, 'showproducts')) {
      throw 'forbidden';
    }
    const root = await Category.findOne({ name: 'inicio' });
    const brands = await Manufacturer.find();
    const colors = await Color.find();
    const genders = await Gender.find();
    let sellers = null;
    let integrations = null;
    if(rights.name!=='superadmin' && rights.name!=='admin'){
      sellers = await Seller.find({id: req.session.user.seller});
      integrations = await Integrations.find({seller: req.session.user.seller});
    }else{
      sellers = await Seller.find();
      integrations = await Integrations.find();
    }

    const taxes = await Tax.find();
    let variations = null;
    let error = null;
    let product; let products = null;
    let action = req.param('action') ? req.param('action') : null;
    let id = (req.param('id') !== undefined) ? req.param('id') : null;

    if (id !== undefined && id !== null) {
      product = await Product.findOne({ id: id })
        .populate('images')
        .populate('tax')
        .populate('mainCategory')
        .populate('mainColor')
        .populate('categories')
        .populate('variations')
        .populate('discount');

      if (product.gender !== undefined && product.gender !== null) {
        variations = await Variation.find({ gender: product.gender });
      }
      for (let pv in product.variations) {
        product.variations[pv].variation = await Variation.findOne({ id: product.variations[pv].variation });
      }
      //return a.variation.name.localeCompare(b.variation.name)
      product.variations.sort((a, b) => { return parseFloat(a.variation.name) - parseFloat(b.variation.name); });

    }
    if (action === null) {
      if(rights.name!=='superadmin' && rights.name!=='admin'){
        products = await Product.find({ seller: req.session.user.seller })
          .populate('images')
          .populate('tax')
          .populate('mainColor')
          .populate('manufacturer');
      } else {
        products = await Product.find()
          .populate('images')
          .populate('tax')
          .populate('mainColor')
          .populate('manufacturer')
          .populate('seller');
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
      integrations:integrations,
      taxes:taxes,
      variations:variations,
      action:action,
      product:product,
      error:error,
      moment:moment
    });
  },
  createproduct: async function (req, res) {
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if (rights.name !== 'superadmin' && !_.contains(rights.permissions, 'createproduct')) {
      throw 'forbidden';
    }
    if (!req.isSocket) {
      return res.badRequest();
    }
    var error = null;
    let product = null;
    try {
      let exists = await Product.findOne({ reference: req.body.reference.toUpperCase().trim(), seller: req.body.seller });
      if (!exists) {
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
          gender: req.body.gender,
          seller: req.body.seller,
          width: req.body.width,
          height: req.body.height,
          length: req.body.length,
          weight: req.body.weight
        }).fetch();
        await Product.addToCollection(product.id, 'categories', JSON.parse(req.body.categories));
      } else {
        product = await Product.updateOne({ id: exists.id }).set({
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
          gender: req.body.gender,
          seller: req.body.seller,
          width: req.body.width,
          height: req.body.height,
          length: req.body.length,
          weight: req.body.weight
        });
        await Product.replaceCollection(product.id, 'categories').members(JSON.parse(req.body.categories));
      }
      product.priceWt = product.price * (1 + ((await Tax.findOne({ id: product.tax })).value / 100));
    } catch (err) {
      error = err.msg;
    }
    if (error === undefined || error === null) {
      return res.send(product);
    } else {
      return res.send(error);
    }
  },
  productimages: async function (req, res) {
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if (rights.name !== 'superadmin' && !_.contains(rights.permissions, 'productimages')) {
      throw 'forbidden';
    }
    let id = req.body.id;
    let route = 'images/products/' + id;
    let cover = 0;
    let result = null;
    try {
      let response = await sails.helpers.fileUpload(req, 'file', 12000000, route);
      for (let i = 0; i < response.length; i++) {
        let hascover = await ProductImage.findOne({ product: id, cover: 1 });
        if (!hascover) { cover = 1; } else { cover = 0; }
        await ProductImage.create({ file: response[i].filename, position: i, cover: cover, product: id });
      }
      result = await ProductImage.find({ product: id });
    } catch (err) {
      console.log(err);
    }

    res.send(result);
  },
  setcover: async function (req, res) {
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if (rights.name !== 'superadmin' && !_.contains(rights.permissions, 'setcover')) {
      throw 'forbidden';
    }
    if (!req.isSocket) {
      return res.badRequest();
    }
    let image = await ProductImage.updateOne({ id: req.param('id') }).set({ cover: 1 });
    await ProductImage.update({ where: { product: image.product, id: { '!=': req.param('id') } }, }).set({ cover: 0 });

    return res.send(image.id);
  },
  removeimage: async function (req, res) {
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if (rights.name !== 'superadmin' && !_.contains(rights.permissions, 'removeimage')) {
      throw 'forbidden';
    }
    let image = await ProductImage.findOne({ id: req.param('id') });
    let error = null;
    let newcover = [];
    await ProductImage.destroyOne({ id: req.param('id') });
    try {
      let images = await ProductImage.find({ product: image.product });
      if (image.cover === 1 && images.length > 0) {
        newcover = await ProductImage.find({
          where: { product: image.product, id: { '!=': image.id } },
          limit: 1,
          sort: 'createdAt ASC'
        });
        await ProductImage.updateOne({ id: newcover[0].id }).set({ cover: 1 });
        await ProductImage.update({ where: { product: newcover[0].product, id: { '!=': newcover[0].id } }, }).set({ cover: 0 });
      }
    } catch (err) {
      error = err;
    }
    if (error !== null) {
      return res.send(error);
    } else if (newcover.length > 0) {
      return res.send(newcover[0].id);
    } else {
      return res.send('ok');
    }
  },
  productvariations: async function (req, res) {
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if (rights.name !== 'superadmin' && !_.contains(rights.permissions, 'productvariations')) {
      throw 'forbidden';
    }
    let rows = [];
    for (let row in req.body) {
      rows.push(JSON.parse(req.body[row]));
    }
    for (let list in rows) {
      ProductVariation.findOrCreate({ id: rows[list].productvariation }, { product: rows[list].product, variation: rows[list].variation, reference: rows[list].reference, supplierreference: rows[list].supplierreference, ean13: rows[list].ean13, upc: rows[list].upc, price: rows[list].price, quantity: rows[list].quantity })
        .exec(async (err, record, wasCreated) => {
          if (err) { return res.send('error'); }
          if (!wasCreated) {
            await ProductVariation.updateOne({ id: record.id }).set({ product: rows[list].product, variation: rows[list].variation, reference: rows[list].reference, supplierreference: rows[list].supplierreference, ean13: rows[list].ean13, upc: rows[list].upc, price: rows[list].price, quantity: rows[list].quantity });
          }
        });
    }
    return res.send('ok');
  },
  findvariations: async (req, res) => {
    if (!req.isSocket) {
      return res.badRequest();
    }
    let product = await Product.findOne({ id: req.param('id') }).populate('categories', { level: 2 });
    let level2 = product.categories.map(c => c.id);
    let variations = await Variation.find({ where: { gender: product.gender, category: { in: level2 } } });
    return res.send(variations);
  },
  findproductvariations: async (req, res) => {
    if (!req.isSocket) {
      return res.badRequest();
    }
    let productvariations = await ProductVariation.find({ product: req.param('id'), quantity: { '>': 0 } })
      .populate('variation');

    productvariations = productvariations.sort((a, b) => a.variation.name - b.variation.name);

    return res.send(productvariations);
  },
  deletevariations: async function (req, res) {
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if (rights.name !== 'superadmin' && !_.contains(rights.permissions, 'deletevariations')) {
      throw 'forbidden';
    }
    if (!req.isSocket) {
      return res.badRequest();
    }
    var id = req.param('id');
    var deletedVariation = await ProductVariation.destroyOne({ id: id });
    return res.send(deletedVariation);
  },
  productstate: async function (req, res) {
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if (rights.name !== 'superadmin' && !_.contains(rights.permissions, 'productstate')) {
      throw 'forbidden';
    }
    if (!req.isSocket) {
      return res.badRequest();
    }
    var id = req.param('id');
    var state = req.param('active');
    var updatedProduct = await Product.updateOne({ id: id }).set({ active: state });
    return res.send(updatedProduct);
  },
  dafitiadd: async (req, res) => {
    if (!req.isSocket) {
      return res.badRequest();
    }
    try {
      let action = null;
      let product = await Product.findOne({ id: req.param('product') });
      if (!product.dafiti) {
        action = 'ProductCreate';
      } else {
        action = 'ProductUpdate';
      }
      let response = await sails.helpers.channel.dafiti.product(req.param('product'), action, req.body.dafitiprice);
      if (response) {
        await Product.updateOne({ id: req.param('product') }).set({
          dafiti: true,
          dafitistatus: (product.dafitistatus) ? false : true,
          dafitiprice: req.body.dafitiprice,
        });
      }
      return res.send(response);
    } catch (err) {
      await Product.updateOne({ id: req.param('product') }).set({
        dafiti: false,
        dafitistatus: false,
        dafitiprice: 0,
      });
      return res.send(err);
    }
  },
  mercadolibreadd: async (req, res) => {
    if (!req.isSocket) {
      return res.badRequest();
    }
    try {
      let action = null;
      let product = await Product.findOne({ id: req.body.product });
      if (product.ml) {
        action = 'Update';
      } else {
        action = 'Post';
      }
      let response = await sails.helpers.channel.mercadolibre.product(product.id,action,req.body.pricemercadolibre);
      if(response){
        await Product.updateOne({id:req.param('product')}).set({
          ml:true,
          mlstatus:(req.body.status) ? true : false,
          mlid:response.id,
          mlprice:req.body.pricemercadolibre,
        });
      }
      return res.send(response);
    } catch (err) {
      return res.send(err);
    }
  },
  linioadd:async (req, res) =>{
    if (!req.isSocket) {
      return res.badRequest();
    }
    try {
      let action = null;
      let product = await Product.findOne({id: req.param('product')});
      if(!product.linio){
        action = 'ProductCreate';
      } else {
        action = 'ProductUpdate';
      }
      let response = await sails.helpers.channel.linio.product(req.param('product'), action, req.body.pricelinio);
      if(response){
        await Product.updateOne({id: req.param('product')}).set({
          linio: true,
          liniostatus: (product.liniostatus) ? false : true,
          linioprice: req.body.linioprice,
        });
      }
      return res.send(response);
    } catch(err) {
      await Product.updateOne({id: req.param('product')}).set({
        linio: false,
        liniostatus: false,
        linioprice: 0,
      });
      return res.send(err);
    }
  },
  import: async (req, res)=>{
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if (rights.name !== 'superadmin' && !_.contains(rights.permissions, 'createproduct')) {
      throw 'forbidden';
    }

    let integrations = [];
    let sellers = [];
    let seller = req.session.user.seller;

    if (seller) {
      integrations = await Integrations.find({ seller: seller });
    } else {
      integrations = await Integrations.find({});
      sellers = await Seller.find({});
    }

    let error = req.param('error') ? req.param('error') : null;
    return res.view('pages/configuration/import', { layout: 'layouts/admin', error: error, integrations: integrations, sellers: sellers, rights:rights.name });
  },

  importexecute: async (req, res) => {
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if (rights.name !== 'superadmin' && !_.contains(rights.permissions, 'createproduct')) {
      throw 'forbidden';
    }

    if(rights.name!=='superadmin' && rights.name!=='admin'){
      sellers = await Seller.find({ id: req.session.user.seller });
    } else {
      sellers = await Seller.find();
    }

    let result = [];
    let errors = [];
    let imageErrors = [];
    let imageItems = [];

    let seller = req.session.user.seller || req.body.seller;
    let integrations = await Integrations.find({ seller: seller });
    if (req.body.channel) {
      
      let each = async (array, callback) => {
        for (let index = 0; index < array.length; index++) {
          await callback(array[index], index, array).catch((e) => errors.push(e));
        }
      }

      switch (req.body.importType) {
        case constants.PRODUCT_TYPE:
        req.setTimeout(constants.TIMEOUT_PRODUCT_TASK);
        let page =  1;
        let pageSize;
        let next;

        switch (req.body.channel) {
          case constants.SHOPIFY_CHANNEL:
              pageSize =  constants.SHOPIFY_PAGESIZE;
            break;
          case constants.WOOCOMMERCE_CHANNEL:
              pageSize = constants.WOOCOMMERCE_PAGESIZE;
            break;
        
          default:
            break;
        }


        do{

          let importedProducts = await sails.helpers.commerceImporter(
            req.body.channel,
            req.body.pk,
            req.body.sk,
            req.body.apiUrl,
            req.body.version,
            {page : page, pageSize  : pageSize, next : next || null}
          ).catch((e) => console.log(e));

          if(importedProducts && importedProducts.pagination)
              next = importedProducts.pagination;

          isEmpty = (!importedProducts || !importedProducts.data || importedProducts.data.length == 0) ? true : false;
          
          if(!isEmpty){
            rs = await sails.helpers.createBulkProducts(importedProducts.data, seller).catch((e)=>console.log(e));
            result = [...result, ...rs.result]
            errors = [...errors, ...rs.errors];
            await sleep(5000);
          }else{
            break;
          }

          console.log("PAGE NUM : ", page);
          console.log("importedProducts : ", importedProducts);
          
          page++;

        }while((!isEmpty));
        
          break;
        case constants.IMAGE_TYPE:
          req.setTimeout(constants.TIMEOUT_IMAGE_TASK);
          let imageTasks = await ImageUploadStatus.find({ uploaded : !constants.STATUS_UPLOADED});

          await each(imageTasks, async (source)=>{
            await each(source.images, async (s) => {
              
              let uploaded =  await sails.helpers.uploadImageUrl(s.src, s.file, source.product).catch((e)=>console.log("Error subiendo imagen"));
              
              if(uploaded.filename)
                (s.filename = uploaded.filename);
                await sleep(3000);
            
              }).catch(e=>imageErrors.push(e));
          
          }).catch(e=>errors.push(e));

          await each(imageTasks, async (task)=>{
            let coltemp = task.images.filter(i=>i.filename).map((s) => {
              let img = {};
              img.file = s.filename;
              img.cover = s.cover || 0;
              img.product = task.product;

              if (img.position)
                (img.position = task.position);
    
              return img;
            });

            let hasCover = (coltemp.filter((img)=>img.cover === 1).length > 0);
            
            if(!hasCover){
                coltemp[0].cover = 1;
            }
            
            let uploaded  = await ProductImage.createEach(coltemp).fetch();

            each(uploaded, async (image)=>{
              await ImageUploadStatus.update({ product : image.product}).set({ uploaded : constants.STATUS_UPLOADED}).fetch();
            });
            
            imageItems.push(task);
         
          });

          break;
        default:
          break;
      }

      return res.view('pages/configuration/import', { layout: 'layouts/admin', error: null, resultados: { items: result, errors: (errors.length > 0) ? errors : [], imageErrors : imageErrors, imageItems : imageItems }, integrations: integrations, sellers : sellers, rights:rights.name});
    }

    let header = null;
    let checkheader = {
      product: ['name', 'reference', 'description', 'descriptionShort', 'active', 'price', 'tax', 'manufacturer', 'width', 'height', 'length', 'weight', 'gender', 'mainColor', 'categories', 'mainCategory'],
      productvariation: ['supplierreference', 'reference', 'ean13', 'upc', 'quantity', 'variation'],
      productimage: ['reference', 'seller', 'route', 'files']
    };
    let checked = false;
    const https = require('https');
    let route = sails.config.views.locals.imgurl;
    let findFromReference = async (reference) => {
      return await Product.findOne({ reference: reference });
    };
    let checkdata = async (header, data) => {
      let body = {
        items: [],
        errors: [],
      };
      try {
        let fila = 2;
        for (let d in data) {
          let row = data[d].split(';');
          let result = {};
          try {
            if (req.body.entity === 'ProductVariation') {
              for (let i in header) {
                switch (header[i]) {
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
                    result[header[i]] = (await Seller.findOne({ id: seller})).id;
                    break;
                  default:
                    result[header[i]] = row[i].toString();
                    break;
                }
              }

              let product = await Product.findOne({ reference: result['supplierreference'], seller: result['seller'] })
                .populate('tax')
                .populate('categories');
              let categories = [];
              if (product) {
                product.categories.forEach(category => {
                  if (!categories.includes(category.id)) {
                    categories.push(category.id);
                  }
                });
                result['product'] = product.id;
                result['price'] = parseInt(product.price * (1 + product.tax.value / 100));
                let variation = await Variation.find({
                  where: { name: result['variation'].replace(',', '.').trim().toLowerCase(), gender: product.gender, category: { 'in': categories } },
                  limit: 1
                });
                if (variation) {
                  result['variation'] = (variation[0]).id;
                  delete result['seller'];
                } else {
                  let v = result['variation'];
                  delete result['variation'];
                  result = null;
                  throw { name: 'NOVARIATION', message: 'Variación ' + v + ' no disponible para este producto' };
                }
              } else {
                let r = result['supplierreference'];
                result = null;
                throw { name: 'NOPRODUCT', message: 'Producto ' + r + ' no localizado' };
              }
            }
            if (req.body.entity === 'Product') {
              for (let i in header) {
                switch (header[i]) {
                  case 'reference':
                    result[header[i]] = row[i].trim().toUpperCase();
                    break;
                  case 'name':
                    result[header[i]] = row[i].trim().toLowerCase();
                    break;
                  case 'tax':
                    result[header[i]] = (await Tax.findOne({ value: row[i] })).id;
                    break;
                  case 'categories':
                    let categories = await sails.helpers.categorize(row[i]);
                    result[header[i]] = categories.categories;
                    result['mainCategory'] = categories.mainCategory;
                    break;
                  case 'mainCategory':
                    break;
                  case 'mainColor':
                    result[header[i]] = (await sails.helpers.tools.findColor(row[i].trim().toLowerCase()))[0];
                    break;
                  case 'manufacturer':
                    result[header[i]] = (await Manufacturer.findOne({ name: row[i].trim().toLowerCase() })).id;
                    break;
                  case 'gender':
                    result[header[i]] = (await sails.helpers.tools.findGender(row[i].trim().toLowerCase()))[0];
                    break;
                  case 'active':
                    let eval = row[i].toLowerCase().trim();
                    result[header[i]] = (eval === 'true' || eval === '1' || eval === 'verdadero' || eval === 'si' || eval === 'sí') ? true : false;
                    break;
                  case 'width':
                    result[header[i]] = parseFloat(row[i].replace(',', '.'));
                    break;
                  case 'height':
                    result[header[i]] = parseFloat(row[i].replace(',', '.'));
                    break;
                  case 'length':
                    result[header[i]] = parseFloat(row[i].replace(',', '.'));
                    break;
                  case 'weight':
                    result[header[i]] = parseFloat(row[i].replace(',', '.'));
                    break;
                  case 'seller':
                    result[header[i]] = (await Seller.findOne({ id: seller})).id;
                    break;
                  case 'price':
                    result[header[i]] = parseFloat(row[i].replace(',', '.'));
                    break;
                  case 'variation':
                    result[header[i]] = parseFloat(row[i].replace(',', '.'));
                    break;
                  default:
                    result[header[i]] = row[i];
                    break;
                }
              }
            }
            if (result !== null) {
              body['items'].push(result);
            }
          } catch (err) {
            body['errors'].push('Fila ' + fila + ': ' + err.message);
          }
          fila++;
        }
        return body;
      } catch (err) {
        return err;
      }
    };
    try {
      if (req.body.entity === 'ProductImage') {
        let result = {
          items: [],
          errors: []
        };
        let imageslist = await sails.helpers.fileUpload(req, 'file', 200000000, 'images/products/tmp');
        let AWS = require('aws-sdk');
        AWS.config.loadFromPath('./config.json');
        var s3 = new AWS.S3();
        let params = {
          Bucket: 'iridio.co',
          ContentType: 'image/jpeg'
        };
        let fila = 1;
        for (let r in imageslist) {
          try {
            let file = imageslist[r].original.split('.');
            let info = file[0].split('_');
            let reference = info[0].trim().toUpperCase();
            let position = info[1];
            let cover = (position === 1 || position === '1') ? 1 : 0;
            let product = await findFromReference(reference);
            let productimage = {
              file: imageslist[r].filename,
              position: parseInt(position),
              cover: parseInt(cover),
              product: product.id
            };

            params['Key'] = 'images/products/' + product.id + '/' + imageslist[r].filename;
            params['CopySource'] = '/iridio.co/images/products/tmp/' + imageslist[r].filename;

            s3.copyObject(params, async (err, data) => {
              if (err) { result['errors'].push('Archivo ' + fila + ': ' + err.message); }
              if (data) {
                await ProductImage.create(productimage);
              }
            });
            result['items'].push({ fila: fila, archivo: imageslist[r].original });
          } catch (err) {
            result['errors'].push('Archivo ' + imageslist[r].original + ': ' + err.message);
          }
          fila++;
        }
        return res.view('pages/configuration/import', { layout: 'layouts/admin', error: null, resultados: result, rights:rights.name });
      } else {
        let filename = await sails.helpers.fileUpload(req, 'file', 2000000, 'uploads');
        https.get(route + '/uploads/' + filename[0].filename, response => {
          let str = '';
          response.on('data', chunk => { str += chunk.toString(); });
          response.on('end', () => {
            let rows = str.split('\n');
            header = rows[0].split(';');
            if (req.body.entity === 'Product') {
              header.push('mainCategory');
              if (JSON.stringify(header) === JSON.stringify(checkheader.product)) { 
                checked = true;
                header.push('seller');
              }
            }
            if (req.body.entity === 'ProductVariation') {
              for (let h in header) {
                if (header[h] === 'reference') { header[h] = 'supplierreference'; }
                if (header[h] === 'reference2') { header[h] = 'reference'; }
              }
              if (JSON.stringify(header) === JSON.stringify(checkheader.productvariation)) { 
                checked = true;
                header.push('seller'); 
              }
            }
            try {
              if (checked) {
                rows.shift();
                rowdata = rows;
                checkdata(header, rowdata).then(async result => {
                  try {
                    if (req.body.entity === 'Product') {
                      result.items.forEach(element => {
                        Product.findOrCreate({ reference: element.reference, seller: element.seller }, element)
                        .exec(async(err, product, wasCreated)=> {
                          if (err) { return res.serverError(err); }
                          if(!wasCreated) {
                            let updateProduct = {
                              name: element.name,
                              reference: element.reference,
                              description: element.description,
                              descriptionShort: element.descriptionShort,
                              active: element.active,
                              price: element.price,
                              tax: element.tax,
                              manufacturer: element.manufacturer,
                              width: element.width,
                              height: element.height,
                              length: element.length,
                              weight: element.weight,
                              gender: element.gender,
                              mainColor: element.mainColor,
                              categories: element.categories,
                              mainCategory: element.mainCategory,
                              seller: element.seller
                            };
                            await Product.updateOne({id: product.id}).set(updateProduct);
                          }
                        });
                      });
                    }
                    if (req.body.entity === 'ProductVariation') {
                      result.items.forEach(element => {
                        ProductVariation.findOrCreate({product: element.product, variation: element.variation}, element)
                        .exec(async(err, productVariat, wasCreated)=> {
                          if (err) { return res.serverError(err); }
                          if(!wasCreated) {
                            let updateVariation = {
                              supplierreference: element.supplierreference,
                              reference: element.reference,
                              ean13: element.ean13,
                              upc: element.upc,
                              quantity: element.quantity,
                              variation: element.variation,
                              product: element.product,
                              price: element.price
                            };
                            try{
                              await ProductVariation.updateOne({id: productVariat.id}).set(updateVariation);
                            }catch(err){
                              console.log(err);
                            }
                          }
                        });
                      });
                    }
                  } catch (cerr) {
                    return res.redirect('/import?error=' + cerr.message);
                  }
                  return res.view('pages/configuration/import', { layout: 'layouts/admin', error: null, resultados: result, rights:rights.name });
                }).catch(err => {
                  return res.redirect('/import?error=' + err.message);
                });
              } else {
                throw { name: 'E_FORMATO', message: 'El Archivo no cumple con el formato requerido para ser procesado.' };
              }
            } catch (err) {
              return res.redirect('/import?error=' + err.message);
            }
          });
        });
      }
    } catch (err) {
      return res.redirect('/import?error=' + err.message);
    }
  },
  searchindex: async (req, res) => {
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if (rights.name !== 'superadmin' && !_.contains(rights.permissions, 'updateindex')) {
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

    products.forEach(pr => {
      let doc = {
        type: req.param('action'), // add or delete
        id: pr.id
      };
      let categories = [];
      pr.categories.forEach(cat => {
        if (!categories.includes(cat.name)) {
          categories.push(cat.name);
        }
      });

      if (req.param('action') === 'add') {
        doc['fields'] = {
          id: pr.id,
          name: pr.name,
          reference: pr.reference,
          price: pr.price,
          description: pr.description,
          shortdescription: pr.descriptionShort,
          brand: pr.manufacturer.name,
          color: pr.mainColor.name,
          gender: pr.gender.name,
          categories: categories
        };
      }
      documents.push(doc);
    });
    let AWS = require('aws-sdk');
    AWS.config.loadFromPath('./config.json');
    let endpoint = 'doc-iridio-kqxoxbqunm62wui765a5ms5nca.us-east-1.cloudsearch.amazonaws.com';
    var csd = new AWS.CloudSearchDomain({ endpoint: endpoint });
    var params = {
      contentType: 'application/json', // required
      documents: JSON.stringify(documents) // required
    };
    csd.uploadDocuments(params, (err, data) => {
      if (err) { console.log(err, err.stack); } // an error occurred
      console.log(data);
      let index = new AWS.CloudSearch();
      index.indexDocuments({ DomainName: 'iridio' }, (err, data) => {
        if (err) { console.log(err); }
        console.log(data);
        return res.redirect('/inicio');
      });
    });
  },
  multiple: async (req, res) => {
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if (rights.name !== 'superadmin' && !_.contains(rights.permissions, 'createproduct')) {
      throw 'forbidden';
    }
    let seller = req.session.user.seller ? req.session.user.seller : '';
    let data = await sails.helpers.checkChannels(rights.name, seller);
    let error = req.param('error') ? req.param('error') : null;
    return res.view('pages/configuration/multiple',{layout: 'layouts/admin',error: error, sellers: data.sellers, channelDafiti: data.channelDafiti, channelLinio: data.channelLinio, channelMercadolibre: data.channelMercadolibre});
  },
  multipleexecute: async (req, res) => {
    req.setTimeout(800000);
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if (rights.name !== 'superadmin' && !_.contains(rights.permissions, 'createproduct')) {
      throw 'forbidden';
    }
    let seller = null;
    let error = null;
    let channel = req.body.channel;
    let result = [];
    if(req.body.seller === undefined){seller = req.session.user.seller;}else{seller = req.body.seller;}
    let data = await sails.helpers.checkChannels(rights.name, seller);

    let response = {};
    try{
      if (channel === 'dafiti') {
          result = await sails.helpers.channel.dafiti.multiple(seller, req.body.action);
          response.items = result;
      } else if(channel === 'linio'){
        result = await sails.helpers.channel.linio.multiple(seller, req.body.action);
        response.items = result;
      } else if(channel === 'mercadolibre'){
        result = await sails.helpers.channel.mercadolibre.multiple(seller, req.body.action);
        response.items = result;
      }
      result = JSON.parse(result);
      if (result.ErrorResponse){
        response.errors[0] = result.ErrorResponse.Head.ErrorMessage;
        error = result.ErrorResponse.Head.ErrorMessage;
      }
      return res.view('pages/configuration/multiple',{layout:'layouts/admin', error: error, sellers: data.sellers, resultados: response, channelDafiti: data.channelDafiti, channelLinio: data.channelLinio, channelMercadolibre: data.channelMercadolibre});
    }catch(err){
      response.errors = err;
      return res.view('pages/configuration/multiple',{layout:'layouts/admin', error: null, sellers: data.sellers, resultados: response, channelDafiti: data.channelDafiti, channelLinio: data.channelLinio, channelMercadolibre: data.channelMercadolibre});
    }
  },
  getcover: async (req,res) =>{
    if (!req.isSocket) {
      return res.badRequest();
    }
    let product = await Product.findOne({id:req.param('productid')});
    let cover = await ProductImage.findOne({product:req.param('productid'),cover:1});
    let response = {};
    response.name=product.name;
    response.reference=product.reference;
    if(cover){
      let image = sails.config.views.locals.imgurl+'/images/products/'+req.param('productid')+'/'+cover.file;
      response.image=image;
    }
    return res.send(response);
  },
  genderindex: async (req, res) => {
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if ((rights.name !== 'superadmin') && !_.contains(rights.permissions,'updateindex')) {
      throw 'forbidden';
    }
    let documents = [];
    let genders = await Gender.find();

    genders.forEach(pr => {
      let doc = {
        type: req.param('action'), // add or delete
        id: pr.id
      };

      if (req.param('action') === 'add') {
        doc['fields'] = {
          id: pr.id,
          gender: pr.name
        };
      }
      documents.push(doc);
    });
    let AWS = require('aws-sdk');
    AWS.config.loadFromPath('./config.json');
    let endpoint = 'doc-predictor-1ecommerce-if3tuwyqkbztsy2a2j3voan7bu.us-east-1.cloudsearch.amazonaws.com';
    var csd = new AWS.CloudSearchDomain({ endpoint: endpoint });
    var params = {
      contentType: 'application/json', // required
      documents: JSON.stringify(documents) // required
    };
    csd.uploadDocuments(params, (err, data) => {
      if (err) { console.log(err, err.stack); } // an error occurred
      console.log(data);
      let index = new AWS.CloudSearch();
      index.indexDocuments({ DomainName: 'predictor-1ecommerce' }, (err, data) => {
        if (err) { console.log(err); }
        console.log(data);
        return res.redirect('/inicio');
      });
    });
  },
};
