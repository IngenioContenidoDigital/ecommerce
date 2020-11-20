const { log } = require('grunt');

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
  STATUS_UPLOADED: sails.config.custom.STATUS_UPLOADED,
  SHOPIFY_CHANNEL: sails.config.custom.SHOPIFY_CHANNEL,
  SHOPIFY_PAGESIZE: sails.config.custom.SHOPIFY_PAGESIZE,
  WOOCOMMERCE_PAGESIZE: sails.config.custom.WOOCOMMERCE_PAGESIZE,
  WOOCOMMERCE_CHANNEL: sails.config.custom.WOOCOMMERCE_CHANNEL,
  VTEX_PAGESIZE: sails.config.custom.VTEX_PAGESIZE,
  VTEX_CHANNEL: sails.config.custom.VTEX_CHANNEL,
  PRESTASHOP_PAGESIZE: sails.config.custom.PRESTASHOP_PAGESIZE,
  PRESTASHOP_CHANNEL: sails.config.custom.PRESTASHOP_CHANNEL,
  TIMEOUT_PRODUCT_TASK: 4000000,
  TIMEOUT_IMAGE_TASK: 8000000,
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

module.exports = {
  showproducts: async function (req, res) {
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if (rights.name !== 'superadmin' && !_.contains(rights.permissions, 'showproducts')) {
      throw 'forbidden';
    }
    let filter = {};
    let error = null;
    let products = null;
    const perPage = sails.config.custom.DEFAULTPAGE;
    if (rights.name !== 'superadmin' && rights.name !== 'admin') { filter.seller = req.session.user.seller; }
    totalproducts = await Product.count(filter);
    let pages = Math.ceil(totalproducts / perPage);
    let moment = require('moment');
    return res.view('pages/catalog/productlist', {
      layout: 'layouts/admin',
      products: products,
      error: error,
      pages: pages,
      moment: moment
    });
  },
  findcatalog: async (req, res) => {
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if (rights.name !== 'superadmin' && !_.contains(rights.permissions, 'showproducts')) {
      throw 'forbidden';
    }
    if (!req.isSocket) { return res.badRequest(); }
    let filter = {};
    let productdata = [];
    let row = [];
    let page = req.param('page') ? parseInt(req.param('page')) : 1;
    const perPage = sails.config.custom.DEFAULTPAGE;
    if (rights.name !== 'superadmin' && rights.name !== 'admin') { filter.seller = req.session.user.seller; }

    productdata = [];
    products = await Product.find({
      where: filter,
      sort: 'createdAt DESC',
      skip: ((page - 1) * perPage),
      limit: perPage,
    })
      .populate('images', { cover: 1 })
      .populate('tax')
      .populate('mainColor')
      .populate('manufacturer')
      .populate('seller');
    for (let p of products) {
      p.stock = await ProductVariation.sum('quantity', { product: p.id });
      let cl = 'bx-x-circle';
      if (p.active) { cl = 'bx-check-circle' }
      let published = '';
      if (p.dafiti) { published += '<li><small>Dafiti</small></li>'; }
      if (p.ml) { published += '<li><small>Mercadolibre</small></li>'; }
      if (p.linio) { published += '<li><small>Linio</small></li>'; }
      row = [
        `<td class="align-middle is-uppercase"><a href="#" class="product-image" data-product="` + p.id + `">` + p.name + `</a></td>`,
        `<td class="align-middle">` + p.reference + `</td>`,
        `<td class="align-middle is-capitalized">` + (p.manufacturer ? p.manufacturer.name : '') + `</td>`,
        `<td class="align-middle">$ ` + (Math.ceil((p.price * (1 + (p.tax.value / 100)))*100)/100) + `</td>`,
        `<td class="align-middle is-capitalized">` + (p.mainColor ? p.mainColor.name : '') + `</td>`,
        `<td class="align-middle">` + p.stock + `</td>`,
        `<td class="align-middle"><span class="action"><i product="` + p.id + `" class="state bx ` + cl + ` is-size-5"></i></span></td>`,
        `<td class="align-middle"><a href="/product/edit/` + p.id + `" target="_blank" class="button"><span class="icon"><i class="bx bx-edit"></i></span></a><a href="/list/product/` + encodeURIComponent((p.name).replace(/\./g, '%2E')) + `/` + encodeURIComponent(p.reference) + `" class="button" target="_blank"><span class="icon"><i class='bx bx-link' ></i></span></a></td>`,
        '<td class="align-middle"><span>' + p.seller.name + '</span></td>',
        `<td class="align-middle"><ul>` + published + `</ul></td>`,
      ];
      if (rights.name !== 'superadmin' && rights.name !== 'admin') { row.splice(8, 1); }
      if(p.images.length<1){row[0]=`<td class="align-middle is-uppercase">` + p.name + `</td>`}
      productdata.push(row);
    }
    return res.send(productdata);
  },
  productmgt: async (req, res) => {
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if (rights.name !== 'superadmin' && !_.contains(rights.permissions, 'createproduct')) {
      throw 'forbidden';
    }

    const root = await Category.findOne({ name: 'inicio' });
    const brands = await Manufacturer.find();
    const colors = await Color.find();
    const genders = await Gender.find();
    let sellers = null;
    let integrations = null;
    if (rights.name !== 'superadmin' && rights.name !== 'admin') {
      sellers = await Seller.find({ id: req.session.user.seller });
      integrations = await Integrations.find({ seller: req.session.user.seller });
    } else {
      sellers = await Seller.find();
      integrations = await Integrations.find();
    }

    const taxes = await Tax.find();
    let variations = null;
    let error = null;
    let product = null;
    let action = req.param('action') ? req.param('action') : null;
    let id = req.param('id') ? req.param('id') : null;

    if (id !== null) {
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
    let moment = require('moment');
    return res.view('pages/catalog/product', {
      layout: 'layouts/admin',
      root: root,
      brands: brands,
      colors: colors,
      genders: genders,
      sellers: sellers,
      integrations: integrations,
      taxes: taxes,
      variations: variations,
      action: action,
      product: product,
      error: error,
      moment: moment
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
          register:req.body.register ? req.body.register : '',
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
          register:req.body.register ? req.body.register : '',
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
      if((await ProductVariation.count({product:product.id}))>0){
        await ProductVariation.update({product:product.id}).set({price:product.priceWt});
      }
      await sails.helpers.channel.channelSync(product);
    } catch (err) {
      error = err.message;
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
    if (!req.isSocket) {
      return res.badRequest();
    }
    let product = await Product.findOne({ id: req.body[0].product });
    for (let list of req.body) {
      ProductVariation.findOrCreate({ id: list.productvariation }, { product: list.product, variation: list.variation, reference: list.reference, supplierreference: list.supplierreference, ean13: list.ean13, upc: list.upc, price: list.price, quantity: list.quantity, seller: product.seller })
        .exec(async (err, record, wasCreated) => {
          if (err) { return res.send('error'); }
          if (!wasCreated) {
            await ProductVariation.updateOne({ id: record.id }).set({ product: list.product, variation: list.variation, reference: list.reference, supplierreference: list.supplierreference, ean13: list.ean13, upc: list.upc, price: list.price, quantity: list.quantity, seller: product.seller });
          }
        });
    }

    await sails.helpers.channel.channelSync(product);

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
    if (!req.isSocket) { return res.badRequest(); }
    try {
      var jsonxml = require('jsontoxml');
      let action = null;
      let product = await Product.find({ id: req.param('product') });
      if (!product[0].dafiti) {
        action = 'ProductCreate';
      } else {
        action = 'ProductUpdate';
      }
      let status = req.body.status ? 'active' : 'inactive';
      let result = await sails.helpers.channel.dafiti.product(product, req.body.dafitiprice, status);      
      var xml = jsonxml(result,true);
      let sign = await sails.helpers.channel.dafiti.sign(action,product[0].seller);
      await sails.helpers.request('https://sellercenter-api.dafiti.com.co','/?'+sign,'POST',xml)
      .then(async (resData)=>{
        resData = JSON.parse(resData);
        if(resData.SuccessResponse){
          await Product.updateOne({ id: req.param('product') }).set({
            dafiti: true,
            dafitistatus: (product[0].dafitistatus) ? false : true,
            dafitiprice: req.body.dafitiprice,
            dafitiqc: false,
          });
          let imgresult = await sails.helpers.channel.dafiti.images(product);      
          var imgxml = jsonxml(imgresult,true);
          let imgsign = await sails.helpers.channel.dafiti.sign('Image',product[0].seller);
          setTimeout(async () => {await sails.helpers.request('https://sellercenter-api.dafiti.com.co','/?'+imgsign,'POST',imgxml);}, 5000);
          return res.send(resData.SuccessResponse.Head.RequestId);
        }else{
          await Product.updateOne({ id: req.param('product') }).set({
            dafiti: false,
            dafitistatus: false,
            dafitiprice: 0,
            dafitiqc: false,
          });
          return res.send(resData.ErrorResponse.Head.ErrorMessage);
        }
      })
      .catch(err =>{
        console.log(err);
        throw new Error (err.message);
      });
    } catch (err) {
      console.log(err);
      return res.send(err.message);
    }
  },
  dafiticheck: async (req, res) => {
    req.setTimeout(900000);
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if (rights.name !== 'superadmin' && !_.contains(rights.permissions, 'productstate')) {
      throw 'forbidden';
    }
    let response = {
      items: [],
      errors: []
    }
    let integrationSellers = await Integrations.find({ channel: 'dafiti' });
    for (let s of integrationSellers) {
      let products = await Product.find({ seller: s.seller, dafiti: true, dafitiqc: false })
      for (let p of products) {
        let result = await sails.helpers.channel.dafiti.checkstatus(p.id)
          .catch(e => {
            response.errors.push({ code: e.raw.code, message: p.reference });
          });

        if (result) {
          response.items.push({ code: 'OK', message: p.reference });
        }
      }
    }
    return res.send(JSON.stringify(response));
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
      let response = await sails.helpers.channel.mercadolibre.product(product.id, action, req.body.pricemercadolibre);
      if (response) {
        console.log(response);
        await Product.updateOne({ id: req.param('product') }).set({
          ml: true,
          mlstatus: (req.body.status) ? true : false,
          mlid: response.id,
          mlprice: req.body.pricemercadolibre,
        });
      }
      return res.send(response);
    } catch (err) {
      return res.send(err);
    }
  },
  linioadd: async (req, res) => {
    if (!req.isSocket) { return res.badRequest(); }
    try {
      var jsonxml = require('jsontoxml');
      let action = null;
      let product = await Product.find({ id: req.param('product') });
      if (!product[0].linio) {
        action = 'ProductCreate';
      } else {
        action = 'ProductUpdate';
      }
      let status = req.body.status ? 'active' : 'inactive';
      let result = await sails.helpers.channel.linio.product(product, req.body.linioprice,status);
      var xml = jsonxml(result,true);
      let sign = await sails.helpers.channel.linio.sign(action,product[0].seller);
      await sails.helpers.request('https://sellercenter-api.linio.com.co','/?'+sign,'POST',xml)
      .then(async (resData)=>{
        resData = JSON.parse(resData);
        if(resData.SuccessResponse){
          await Product.updateOne({ id: req.param('product') }).set({
            linio: true,
            liniostatus: (product[0].liniostatus) ? false : true,
            linioprice: req.body.dafitiprice,
          });
          let imgresult = await sails.helpers.channel.linio.images(product);      
          var imgxml = jsonxml(imgresult,true);
          let imgsign = await sails.helpers.channel.linio.sign('Image',product[0].seller);
          setTimeout(async () => {await sails.helpers.request('https://sellercenter-api.linio.com.co','/?'+imgsign,'POST',imgxml);}, 5000);
          return res.send(resData.SuccessResponse.Head.RequestId);
        }else{
          await Product.updateOne({ id: req.param('product') }).set({
            linio: false,
            liniostatus: false,
            linioprice: 0
          });
          return res.send(resData.ErrorResponse.Head.ErrorMessage);
        }
      })
      .catch(err =>{
        console.log(err);
        throw new Error (err.message);
      });
    } catch (err) {
      console.log(err);
      return res.send(err.message);
    }
  },
  import: async (req, res) => {
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
    return res.view('pages/configuration/import', { layout: 'layouts/admin', error: error, resultados: null, integrations: integrations, sellers: sellers, rights: rights.name, seller: seller, pagination: null });
  },
  importexecute: async (req, res) => {
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if (rights.name !== 'superadmin' && !_.contains(rights.permissions, 'createproduct')) {
      throw 'forbidden';
    }
    let axios = require('axios');
    let seller = null;
    let integrations = [];
    let sellers = [];
    let importType = req.body.importType;

    if (rights.name !== 'superadmin' && rights.name !== 'admin') {
      seller = req.session.user.seller;
      integrations = await Integrations.find({ seller: seller });
    } else {
      seller = req.body.seller;
      integrations = await Integrations.find();
      sellers = await Seller.find();
    }

    let result = [];
    let errors = [];
    let imageErrors = [];
    let imageItems = [];
    let type = req.body.entity ? req.body.entity : null;

    if (req.body.channel) {
      let page = 1;
      let pageSize = 
        req.body.channel === constants.WOOCOMMERCE_CHANNEL ? constants.WOOCOMMERCE_PAGESIZE : 
        req.body.channel === constants.SHOPIFY_CHANNEL ? constants.SHOPIFY_PAGESIZE : 
        req.body.channel === constants.VTEX_CHANNEL ? constants.VTEX_PAGESIZE :
        req.body.channel === constants.PRESTASHOP_CHANNEL ? constants.PRESTASHOP_PAGESIZE : 0;
      let next;

      
      switch (req.body.importType) {
        case constants.PRODUCT_TYPE:
          req.setTimeout(constants.TIMEOUT_PRODUCT_TASK);

          let pagination = await sails.helpers.commerceImporter(
            req.body.channel,
            req.body.pk,
            req.body.sk,
            req.body.apiUrl,
            req.body.version,
            'PAGINATION',
            { page, pageSize, next: next || null }
          ).catch((e) => console.log(e));
          return res.view('pages/configuration/import', { layout: 'layouts/admin', error: null, resultados: [], integrations: integrations, sellers: sellers, rights: rights.name, pagination, pageSize, discount: false, seller:seller, importType : importType, credentials : { channel : req.body.channel, pk : req.body.pk, sk : req.body.sk, apiUrl : req.body.apiUrl, version : req.body.version}});
          break;
        case constants.PRODUCT_VARIATION:
            let paginationVariation = await sails.helpers.commerceImporter(
              req.body.channel,
              req.body.pk,
              req.body.sk,
              req.body.apiUrl,
              req.body.version,
              'PAGINATION',
              { page, pageSize, next: next || null }
            ).catch((e) => console.log(e));
            let discount = req.body.discount && req.body.discount == 'on' ? true : false
            return res.view('pages/configuration/import', { layout: 'layouts/admin', error: null, resultados: null, integrations: integrations, sellers: sellers, rights: rights.name, pagination: paginationVariation, pageSize, discount, seller:seller, importType : importType, credentials : { channel : req.body.channel, pk : req.body.pk, sk : req.body.sk, apiUrl : req.body.apiUrl, version : req.body.version}});
          break;
        case constants.IMAGE_TYPE:
            req.setTimeout(constants.TIMEOUT_IMAGE_TASK);
            let paginationImage = await sails.helpers.commerceImporter(
              req.body.channel,
              req.body.pk,
              req.body.sk,
              req.body.apiUrl,
              req.body.version,
              'PAGINATION',
              { page, pageSize, next: next || null }
            ).catch((e) => console.log(e));

            return res.view('pages/configuration/import', { layout: 'layouts/admin', error: null, resultados: null, integrations: integrations, sellers: sellers, rights: rights.name, pagination: paginationImage, pageSize, discount: false, seller:seller, importType : importType, credentials : { channel : req.body.channel, pk : req.body.pk, sk : req.body.sk, apiUrl : req.body.apiUrl, version : req.body.version}});
          break;
        default:
          break;
      }

      return res.view('pages/configuration/import', { layout: 'layouts/admin', error: null, resultados: { items: result, errors: (errors.length > 0) ? errors : [], imageErrors: imageErrors, imageItems: imageItems }, integrations: integrations, sellers: sellers, seller:seller, rights: rights.name, type:type });
    }
    req.setTimeout(600000);
    let route = sails.config.views.locals.imgurl;
    const csv = require('csvtojson');
    let json = [];
    try {
      if (req.body.entity === 'ProductImage') {
        let imageslist = await sails.helpers.fileUpload(req, 'file', 200000000, 'images/products/tmp');
        json = imageslist;
      } else {
        let filename = await sails.helpers.fileUpload(req, 'file', 2000000, 'uploads')
        let response = await axios.get(route + '/uploads/' + filename[0].filename, { responseType: 'arraybuffer' });
        let buffer = Buffer.from(response.data, 'utf-8');
        json = await csv({ eol: '\n', delimiter: ';' }).fromString(buffer.toString());
      };

      return res.view('pages/configuration/import', { layout: 'layouts/admin', error: null, sellers: sellers, seller: seller, integrations: integrations, resultados: json, rights: rights.name, type: type });
    } catch (err) {
      return res.redirect('/import?error=' + err.message);
    }
  },
  checkdata: async (req, res) => {
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if (rights.name !== 'superadmin' && !_.contains(rights.permissions, 'createproduct')) {
      throw 'forbidden';
    }
    if (!req.isSocket) {
      throw 'forbidden';
    }
    let result = {
      items: [],
      errors: [],
    }
    let seller = null;
    if (rights.name !== 'superadmin' && rights.name !== 'admin') {
      seller = req.session.user.seller;
    } else {
      seller = req.body.seller;
    }

    let prod = {};

    try {
      if (req.body.type === 'ProductImage') {
        let AWS = require('aws-sdk');
        AWS.config.loadFromPath('./config.json');
        var s3 = new AWS.S3();
        let params = {
          Bucket: 'iridio.co',
          ContentType: 'image/jpeg'
        };

        let file = req.body.product.original.split('.');
        let info = file[0].split('_');
        let reference = info[0].trim().toUpperCase();
        let position = info[1];
        let cover = (position === 1 || position === '1') ? 1 : 0;
        let product = await Product.findOne({ reference: reference, seller: seller })
          .catch(err => { throw err });
        if (product) {
          let productimage = {
            file: req.body.product.filename,
            position: parseInt(position),
            cover: parseInt(cover),
            product: product.id
          };

          params['Key'] = 'images/products/' + product.id + '/' + req.body.product.filename;
          params['CopySource'] = '/iridio.co/images/products/tmp/' + req.body.product.filename;

          s3.copyObject(params, async (err, data) => {
            if (err) { throw new Error(err.message); }
            if (data) {
              await ProductImage.create(productimage);
            }
          });
          result['items'].push({ archivo: req.body.product.original });
        } else {
          throw new Error('Ref:' + reference + ' - Carga la imágen en la página de edición del producto.')
        }
      }
      if (req.body.type === 'ProductVariation') {
        prod.reference = req.body.product.reference2 ? req.body.product.reference2.trim().toUpperCase() : '';
        prod.supplierreference = req.body.product.reference.trim().toUpperCase();
        prod.ean13 = req.body.product.ean13 ? req.body.product.ean13.toString() : '';
        prod.upc = req.body.product.upc ? parseInt(req.body.product.upc) : 0;
        prod.quantity = req.body.product.quantity ? parseInt(req.body.product.quantity) : 0;
        prod.seller = seller;


        let product = await Product.findOne({ reference: prod.supplierreference, seller: seller })
          .populate('tax')
          .populate('categories');
        let categories = [];

        if (product) {
          product.categories.forEach(category => {
            if (!categories.includes(category.id)) {
              categories.push(category.id);
            }
          });
          prod.product = product.id;
          prod.price = parseInt(product.price * (1 + product.tax.value / 100));
          let variation = await Variation.find({
            where: { name: req.body.product.variation.replace(',', '.').trim().toLowerCase(), gender: product.gender, category: { 'in': categories } },
            limit: 1
          });
          if (variation) {
            prod.variation = (variation[0]).id;

            ProductVariation.findOrCreate({ product: prod.product, variation: prod.variation }, prod)
              .exec(async (err, productVariat, wasCreated) => {
                if (err) { throw err; }
                if (!wasCreated) {
                  let updateVariation = {
                    supplierreference: prod.supplierreference,
                    reference: prod.reference,
                    ean13: prod.ean13,
                    upc: prod.upc,
                    quantity: prod.quantity,
                    variation: prod.variation,
                    product: prod.product,
                    price: prod.price,
                    seller: prod.seller
                  };
                  await ProductVariation.updateOne({ id: productVariat.id }).set(updateVariation);
                }
              });
            result['items'].push(prod);
          } else {
            throw new Error('Variación ' + req.body.product.variation + ' no disponible para este producto');
          }
        } else {
          throw new Error('Producto principal no localizado');
        }
      }
      if (req.body.type === 'Product') {

        prod.reference = req.body.product.reference.trim().toUpperCase();
        prod.name = req.body.product.name.trim().toLowerCase();
        prod.tax = (await Tax.findOne({ value: req.body.product.tax })).id;

        let mainColor = await sails.helpers.tools.findColor(req.body.product.mainColor.trim().toLowerCase());
        if (mainColor.length > 0) { prod.mainColor = mainColor[0]; } else { throw new Error('No logramos identificar el color.'); }
        let brand = await Manufacturer.findOne({ name: req.body.product.manufacturer.trim().toLowerCase() })
        if (brand) { prod.manufacturer = brand.id; } else { throw new Error('No logramos identificar la marca del producto.'); }
        let gender = await sails.helpers.tools.findGender(req.body.product.gender.trim().toLowerCase());
        if (gender.length > 0) { prod.gender = gender[0]; } else { throw new Error('No logramos identificar el género para este producto.'); }
        let eval = req.body.product.active.toLowerCase().trim();
        prod.active = (eval === 'true' || eval === '1' || eval === 'verdadero' || eval === 'si' || eval === 'sí') ? true : false;;
        prod.width = parseFloat(req.body.product.width.replace(',', '.'));
        prod.height = parseFloat(req.body.product.height.replace(',', '.'));
        prod.length = parseFloat(req.body.product.length.replace(',', '.'));
        prod.weight = parseFloat(req.body.product.weight.replace(',', '.'));
        prod.seller = seller;
        prod.register = req.body.product.register || '';
        prod.price = parseFloat(req.body.product.price.replace(',', '.'));
        prod.description = req.body.product.description;
        prod.descriptionShort = req.body.product.descriptionShort;

        let categories = await sails.helpers.tools.findCategory(prod.name + ' ' + prod.gender);
        if (categories.length > 0) {
          prod.categories = categories;
          let main = await Category.find({ id: categories }).sort('level DESC');
          prod.mainCategory = main[0].id;
        } else {
          throw new Error('Categoria No Localizada');
        }
        Product.findOrCreate({ reference: prod.reference, seller: seller }, prod)
          .exec(async (err, record, wasCreated) => {
            if (err) { throw err; }
            if (!wasCreated) {
              delete prod.mainCategory;
              delete prod.categories;
              await Product.updateOne({ id: record.id }).set(prod)
                .catch(err => {
                  throw err;
                })
            }
          });
        result['items'].push(prod);
      }
      if(req.body.type === 'Discount'){
        if((req.body.product.range && req.body.product.range!=='') && (req.body.product.type && req.body.product.type!=='') && (req.body.product.value && req.body.product.value!=='')){  
          let product;
          let moment = require('moment');
          let range = req.body.product.range.split(' - ');
          let from;
          let to;
          let affected = [];
          if(req.body.product.reference && req.body.product.reference!==''){
            prod.reference=req.body.product.reference.trim().toUpperCase();
            product = await Product.findOne({reference:prod.reference,seller:seller});
            if(!product){
              prod.name=req.body.product.name.trim().toLowerCase();
              product = await Product.findOne({name:prod.name,seller:seller});
            }
          }else if(req.body.product.name && req.body.product.name!==''){
            prod.name=req.body.product.name.trim().toLowerCase();
            product = await Product.findOne({name:prod.name,seller:seller});
          }
          if(range[0] && range[1]){
            let aDatefrom = moment(range[0], 'YYYY-MM-DD HH:mm:ss', true);
            let aDateto = moment(range[1], 'YYYY-MM-DD HH:mm:ss', true);
            let isValidfrom = aDatefrom.isValid();
            let isValidto = aDateto.isValid();
            if(isValidfrom && isValidto){
              from = moment(range[0]).valueOf();
              to = moment(range[1]).valueOf();
            }else{throw new Error('Formato fecha debe ser YYYY-MM-DD HH:mm:ss - YYYY-MM-DD HH:mm:ss');}
          }else{
            throw new Error('Formato fecha debe ser YYYY-MM-DD HH:mm:ss - YYYY-MM-DD HH:mm:ss');
          }
          if(product){
            let discount = await CatalogDiscount.create({
              name:req.body.product.name.trim().toLowerCase(),
              from:from,
              to:to,
              type:req.body.product.type.trim().toUpperCase(),
              value:parseFloat(req.body.product.value),
              seller:seller
            }).fetch();
          
            affected.push(product.id);
            await CatalogDiscount.addToCollection(discount.id,'products').members(affected);
            await sails.helpers.channel.channelSync(product);
            result['items'].push(product);
         }else{
           throw new Error('Producto principal no localizado');
          }
        }
      }
    } catch (err) {
      if (req.body.type === 'ProductVariation') { result['errors'].push('Ref: ' + prod.supplierreference + '- Variación: ' + req.body.product.variation + ' - ' + err.message); }
      if (req.body.type === 'Product') { result['errors'].push('Ref: ' + prod.reference + ': ' + err.message); }
      if (req.body.type === 'ProductImage') { result['errors'].push('Archivo: ' + req.body.product.original + ': ' + err.message); }
    }
    return res.send(result);
  },

  checkProductFromProvider: async (req, res) => {
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);

    if (rights.name !== 'superadmin' && !_.contains(rights.permissions, 'createproduct')) {
      throw 'forbidden';
    }

    if (!req.isSocket) {
      throw 'forbidden';
    }

    let result = {
      items: [],
      errors: [],
    }

    let seller = null;

    if (rights.name !== 'superadmin' && rights.name !== 'admin') {
      seller = req.session.user.seller;
    } else {
      seller = req.body.seller;
    }

    let prod = {};

    try {
      prod.name = req.body.product.name.toLowerCase().trim();

      if(!req.body.product.reference){
          throw new Error('Producto ' + inputs.product.name + ' sin referencia');
      }

      prod.reference = req.body.product.reference.toUpperCase().trim();
      prod.description = req.body.product.description.toLowerCase().trim();
      prod.descriptionShort = req.body.product.descriptionShort.toLowerCase().trim();
      let cats = await sails.helpers.tools.findCategory(req.body.product.name+' '+req.body.product.reference);
      if(cats.length>0){
          prod.categories = cats;
          let main = await Category.find({id:cats}).sort('level DESC');
          prod.mainCategory = main[0].id;
      }

      if(req.body.product.manufacturer){
          prod.manufacturer = (await Manufacturer.findOne({ name: req.body.product.manufacturer.toLowerCase() })).id;
      }else{
          throw new Error('La Marca seleccionada para el producto ' + req.body.product.name + ' no existe');
      }

      let color = await sails.helpers.tools.findColor(req.body.product.name+' '+req.body.product.reference);
      
      if(color && color.length > 0){
          prod.mainColor = color[0];
      }else{
          throw new Error('Producto ' + req.body.product.name + ' sin color');
      }

      if (req.body.product.gender) {
          let gender = await sails.helpers.tools.findGender(req.body.product.name+' '+req.body.product.reference);
          if (gender && gender.length>0) {
              prod.gender = gender[0];
          } else {
              prod.gender = (await Gender.findOne({ name: 'unisex' })).id;
          }
      }
      
      if (req.body.product.tax) {
          tax = (await Tax.findOne({ value: req.body.product.tax.rate }));
          if(tax)
              prod.tax = tax.id;
      } else {
          tax  = (await Tax.findOne({ value: 0 }));
          if(tax)
              prod.tax = tax.id;
      }
      prod.active = req.body.product.active || false;
      prod.externalId = req.body.product.externalId || '';
      prod.register = req.body.product.register || '';
      prod.active = req.body.product.active;
      prod.width = (req.body.product.width === undefined || req.body.product.width === null || req.body.product.width < 1) ? 15 : req.body.product.width;
      prod.height = (req.body.product.height === undefined || req.body.product.height === null || req.body.product.height < 1) ? 15 : req.body.product.height;
      prod.length = (req.body.product.length === undefined || req.body.product.length === null || req.body.product.length < 1) ? 32 : req.body.product.length;
      prod.weight = (req.body.product.weight === undefined || req.body.product.weight === null || req.body.product.weight === 0) ? 1 : req.body.product.weight;
      prod.price =  (req.body.product.price / (1 + (req.body.product.tax.rate/100)));
      prod.description = req.body.product.description;
      prod.descriptionShort = req.body.product.descriptionShort;
      prod.seller = seller;

      let categories = await sails.helpers.tools.findCategory(prod.name + ' ' + prod.gender);
      if (categories.length > 0) {
        prod.categories = categories;
        let main = await Category.find({ id: categories }).sort('level DESC');
        prod.mainCategory = main[0].id;
      } else {
        throw new Error('Categoria No Localizada');
      }
      Product.findOrCreate({ reference: prod.reference, seller: seller }, prod)
        .exec(async (err, record, wasCreated) => {
          if (err) { throw err; }
          if (!wasCreated) {
            delete prod.categories;
            delete prod.mainCategory;
            await Product.updateOne({ id: record.id }).set(prod)
              .catch(err => {
                throw err;
              })
          }
        });
      result['items'].push(prod);
    } catch (err) {
      result['errors'].push('Ref: ' + prod.reference + ': ' + err.message);
    }

    return res.send(result);

  },

  searchindex: async (req, res) => {
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if (rights.name !== 'superadmin' && !_.contains(rights.permissions, 'updateindex')) {
      throw 'forbidden';
    }
    req.setTimeout(600000);
    let documents = [];
    let products = await Product.find({ active: true })
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
          seller: pr.seller.id,
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
    return res.view('pages/configuration/multiple', { layout: 'layouts/admin', error: error, sellers: data.sellers, channelDafiti: data.channelDafiti, channelLinio: data.channelLinio, channelMercadolibre: data.channelMercadolibre });
  },
  multipleexecute: async (req, res) => {
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if (rights.name !== 'superadmin' && !_.contains(rights.permissions, 'createproduct')) {
      throw 'forbidden';
    }
    var jsonxml = require('jsontoxml');
    let seller = (req.body.seller && req.body.seller !== null || req.body.seller !== '' || req.body.seller !== undefined) ? req.body.seller : req.session.user.seller;
    let channel = req.body.channel;
    let result = null;
    let params = { seller: seller };
    let response = { items: [], errors: [] };
    let productlist = [];
    try {
      if (channel === 'dafiti') {
        switch (req.body.action) {
          case 'ProductCreate':
            params.dafiti = false;
            params.active = true;
            params.dafitiqc = false;
            break;
          case 'ProductUpdate':
            params.dafiti = true;
            params.dafitistatus = true;
            params.active = true;
            break;
          case 'Image':
            params.dafiti = true;
            params.dafitistatus = true;
            params.dafitiqc = true;
            params.active = true;
            break;
        }

        let products = await Product.find(params);
        for (let pl of products) {
          if (!productlist.includes(pl.id)) { productlist.push(pl.id); }
        }
        if (products.length > 0) {
          if (req.body.action === 'Image') {
            result = await sails.helpers.channel.dafiti.images(products)
              .catch(err => {
                throw new Error(err.message);
              });
          } else {
            result = await sails.helpers.channel.dafiti.product(products)
              .catch(err => {
                throw new Error(err.message);
              })
          }
          var xml = jsonxml(result,true);
          let sign = await sails.helpers.channel.dafiti.sign(req.body.action,seller);
          await sails.helpers.request('https://sellercenter-api.dafiti.com.co','/?'+sign,'POST',xml)
          .then(async (resData)=>{
            resData = JSON.parse(resData);
            if(resData.SuccessResponse){
              response.items.push(resData.SuccessResponse.Head.RequestId);
              if(req.body.action==='ProductCreate'){await Product.update({id:productlist}).set({dafiti:true,dafitistatus:false,dafitiqc:false});}
              if(req.body.action==='ProductUpdate'){await Product.update({id:productlist}).set({dafitistatus:true});}
            }else{
              throw new Error (resData.ErrorResponse.Head.ErrorMessage || 'Error en el proceso, Intenta de nuevo más tarde.');
            }
          })
          .catch(err =>{
            throw new Error (err.message);
          });
        }else{
          throw new Error('Sin Productos para Procesar');
        }
      }
      if (channel === 'linio') {
        switch (req.body.action) {
          case 'ProductCreate':
            params.linio = false;
            params.active = true;
            break;
          case 'ProductUpdate':
            params.linio = true;
            params.liniostatus = true;
            params.active = true;
            break;
          case 'Image':
            params.linio = true;
            params.liniostatus = false;
            params.active = true;
            break;
        }

        let products = await Product.find(params);
        for (let pl of products) {
          if (!productlist.includes(pl.id)) { productlist.push(pl.id); }
        }
        if (products.length > 0) {
          if (req.body.action === 'Image') {
            result = await sails.helpers.channel.linio.images(products)
              .catch(err => {
                throw new Error(err.message);
              })
          } else {
            result = await sails.helpers.channel.linio.product(products)
              .catch(err => {
                throw new Error(err.message);
              })
          }
          var xml = jsonxml(result,true);
          let sign = await sails.helpers.channel.linio.sign(req.body.action,seller);
          await sails.helpers.request('https://sellercenter-api.linio.com.co','/?'+sign,'POST',xml)
          .then(async (resData)=>{
            resData = JSON.parse(resData);
            if(resData.SuccessResponse){
              response.items.push(resData.SuccessResponse.Head.RequestId);
              if(req.body.action==='ProductCreate'){await Product.update({id:productlist}).set({linio:true,liniostatus:false});}
              if(req.body.action==='ProductUpdate'){await Product.update({id:productlist}).set({liniostatus:true});}
            }else{
              throw new Error (resData.ErrorResponse.Head.ErrorMessage || 'Error en el proceso, Intenta de nuevo más tarde.');
            }
          })
          .catch(err =>{
            throw new Error (err.message);
          });
        }else{
          throw new Error('Sin Productos para Procesar');
        }
      }
      if (channel === 'mercadolibre') {
        let action = '';
        switch (req.body.action) {
          case 'ProductCreate':
            action = 'Post';
            params.ml = false;
            params.active = true;
            break;
          case 'ProductUpdate':
            action = 'Update';
            params.ml = true;
            params.mlid = { '!=': '' };
            params.active = true;
            break;
          case 'Image':
            action = 'Update';
            params.ml = true;
            params.mlstatus = true;
            params.active = true;
            break;
        }
        let products = await Product.find(params);
        if (products.length > 0) {
          for (let pl of products) {
            await sails.helpers.channel.mercadolibre.product(pl.id, action)
              .then(async result => {
                response.items.push(result);
                await Product.updateOne({ id: pl.id }).set({
                  ml: true,
                  mlstatus: true,
                  mlid: result.id
                });
              })
              .catch(async err => {
                response.errors.push(err.message);
                await Product.updateOne({ id: pl.id }).set({
                  ml: true,
                  mlstatus: false
                });
              });
          }
        } else {
          throw new Error('Sin Productos para Procesar');
        }
      }
    } catch (err) {
      response.errors.push(err.message);
    }
    return res.send(response);
  },
  getcover: async (req, res) => {
    if (!req.isSocket) {
      return res.badRequest();
    }
    let product = await Product.findOne({ id: req.param('productid') });
    let cover = await ProductImage.findOne({ product: req.param('productid'), cover: 1 });
    let response = {};
    response.name = product.name;
    response.reference = product.reference;
    if (cover) {
      let image = sails.config.views.locals.imgurl + '/images/products/' + req.param('productid') + '/' + cover.file;
      response.image = image;
    }
    return res.send(response);
  },
  genderindex: async (req, res) => {
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if ((rights.name !== 'superadmin') && !_.contains(rights.permissions, 'updateindex')) {
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
  importProducts: async (req, res) => {
    if (!req.isSocket) {
      return res.badRequest();
    }
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);

    if (rights.name !== 'superadmin' && !_.contains(rights.permissions, 'createproduct')) {
      throw 'forbidden';
    }
    let seller = null; 
    let page = req.body.page;
    let lastPage;
    let pageSize = req.body.pageSize;
    let sid = sails.sockets.getId(req);
    let next;

    if (rights.name !== 'superadmin' && rights.name !== 'admin') {
      seller = req.session.user.seller;
    } else {
      seller = req.body.seller;
    }

    do {

      if(req.body.channel == constants.SHOPIFY_CHANNEL){
          if(page === (lastPage + 1)){
            sails.sockets.broadcast(sid, 'product_task_ended', true);
            break;
          }
      }

      let importedProducts = await sails.helpers.commerceImporter(
        req.body.channel,
        req.body.pk,
        req.body.sk,
        req.body.apiUrl,
        req.body.version,
        'CATALOG',
        { page: page, pageSize: pageSize, next: next|| null }
      ).catch((e) => console.log(e));
      lastPage = importedProducts.pagesCount;

      if (importedProducts && importedProducts.pagination)
        next = importedProducts.pagination;

      isEmpty = (!importedProducts || !importedProducts.data || importedProducts.data.length == 0) ? true : false;

      if (!isEmpty) {
        rs = await sails.helpers.createBulkProducts(importedProducts.data, seller, sid).catch((e)=>console.log(e));
      } else {
        sails.sockets.broadcast(sid, 'product_task_ended', true);
        break;
      }

      page++;
    } while ((!isEmpty));
  },

  importImages: async (req, res) => {
    if (!req.isSocket) {
      return res.badRequest();
    }
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);

    if (rights.name !== 'superadmin' && !_.contains(rights.permissions, 'createproduct')) {
      throw 'forbidden';
    }

    let seller = null; 
    let page = req.body.page;
    let pageSize = req.body.pageSize;
    let lastPage;
    let next;
    let sid = sails.sockets.getId(req);

    if (rights.name !== 'superadmin' && rights.name !== 'admin') {
      seller = req.session.user.seller;
    } else {
      seller = req.body.seller;
    }

    do {

      if(req.body.channel == constants.SHOPIFY_CHANNEL){
          if(page === (lastPage + 1)){
            sails.sockets.broadcast(sid, 'image_task_ended', true);
            break;
          }
      }

      let importedProductsImages = await sails.helpers.commerceImporter(
        req.body.channel,
        req.body.pk,
        req.body.sk,
        req.body.apiUrl,
        req.body.version,
        'IMAGES',
        { page, pageSize, next: next || null }
      ).catch((e) => console.log(e));

      if (importedProductsImages && importedProductsImages.pagination)
        next = importedProductsImages.pagination;
        lastPage = importedProductsImages.pagesCount;

      isEmpty = (!importedProductsImages || !importedProductsImages.data || importedProductsImages.data.length == 0) ? true : false;

      if (!isEmpty) {
        for(p of importedProductsImages.data){
          let errors = [];
          let result = [];

          for (let im of p.images) {
            try {
              let url = (im.src.split('?'))[0];
              let file = (im.file.split('?'))[0];
              
              let product = await Product.findOne({ externalId : p.externalId, seller:seller}).populate('images');
              if(product && product.images.length === 0){
                let uploaded = await sails.helpers.uploadImageUrl(url, file, product.id).catch((e)=>{
                  throw new Error(`Ref: ${product.reference} : ${product.name} ocurrio un error obteniendo la imagen`);
                });
                if (uploaded) {
                  let cover = 1;
                  let totalimg = await ProductImage.count({ product: product.id});
                  totalimg += 1;
                  if (totalimg > 1) { cover = 0; }
                  
                  let rs = await ProductImage.create({
                    file: file,
                    position: totalimg,
                    cover: cover,
                    product: product.id
                  }).fetch();
  
                  if(typeof(rs) === 'object'){
                      result.push(rs);
                  }
  
                  sails.sockets.broadcast(sid, 'product_images_processed',  {result});
  
                }
              }

            } catch (err) {
                errors.push(err)
                sails.sockets.broadcast(sid, 'product_images_processed',  {result});
            }
          }

        }
      } else {
        sails.sockets.broadcast(sid, 'image_task_ended', true);
        break;
      }

      page++;

    } while ((!isEmpty));
  },

  importVariations: async (req, res) => {
    if (!req.isSocket) {
      return res.badRequest();
    }
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    let moment = require('moment');
    if (rights.name !== 'superadmin' && !_.contains(rights.permissions, 'createproduct')) {
      throw 'forbidden';
    }

    let seller = null; 
    let page = req.body.page;
    let pageSize = req.body.pageSize;
    let sid = sails.sockets.getId(req);
    let discount = req.body.discount;
    let lastPage;
    let next;

    if (rights.name !== 'superadmin' && rights.name !== 'admin') {
      seller = req.session.user.seller;
    } else {
      seller = req.body.seller;
    }

    do {

      if(req.body.channel == constants.SHOPIFY_CHANNEL){
        if(page === (lastPage + 1)){
          sails.sockets.broadcast(sid, 'variation_task_ended', true);
          break;
        }
      }

      let importedProductsVariations= await sails.helpers.commerceImporter(
        req.body.channel,
        req.body.pk,
        req.body.sk,
        req.body.apiUrl,
        req.body.version,
        'VARIATIONS',
        { page: page, pageSize: pageSize, next: next|| null }
      ).catch((e) => console.log(e));

      if (importedProductsVariations && importedProductsVariations.pagination)
        next = importedProductsVariations.pagination;
        lastPage = importedProductsVariations.pagesCount;

      isEmpty = (!importedProductsVariations || !importedProductsVariations.data || importedProductsVariations.data.length == 0) ? true : false;

      if (!isEmpty) {
        for(let p of importedProductsVariations.data){
          let result = [];
          let  errors = [];

           try {
            let pro = await Product.findOne({reference:p.reference.toUpperCase(), seller:seller}).populate('categories', {level:2 });

            if(!pro){
              throw new Error(`Ref: ${p.reference} : no pudimos encontrar este producto.`);
            }
  
            if(pro){
              let tx = await Tax.findOne({id:pro.tax});
              let pr = await Product.findOne({reference:pro.reference, seller:pro.seller});
              if (discount && p.discount && p.discount.length > 0) {
                let disc = await CatalogDiscount.find({
                  where:{
                    name: p.discount[0].name.trim().toLowerCase(),
                    to:{'>=':moment().valueOf()},
                    from:{'<=':moment().valueOf()},
                    value: p.discount[0].value,
                    type: p.discount[0].type
                  },
                  sort: 'createdAt DESC',
                  limit: 1
                })
                if (disc.length > 0) {
                  await CatalogDiscount.updateOne({ id: disc[0].id }).set({
                    value: parseFloat(p.discount[0].value),
                    type: p.discount[0].type,
                    from: moment(p.discount[0].from).valueOf(),
                    to: moment(p.discount[0].to).valueOf()
                  });
                } else {
                  let discount = await CatalogDiscount.create({
                    name: p.discount[0].name.trim().toLowerCase(), 
                    from: moment(p.discount[0].from).valueOf(),
                    to: moment(p.discount[0].to).valueOf(),
                    type: p.discount[0].type,
                    value: parseFloat(p.discount[0].value),
                    seller: pro.seller
                  }).fetch();
                  await CatalogDiscount.addToCollection(discount.id,'products').members([pro.id]);
                }
              }
              try {
                if( p.variations && p.variations.length > 0){
                  for(let vr of p.variations){
                    let variation = await Variation.findOne({ name:vr.talla.toLowerCase().replace(',','.'), gender:pro.gender,category:pro.categories[0].id});
                    let productVariation;
                    let discountHandled = false;
                    
                    if(!variation){
                      variation = await Variation.create({name:vr.talla.toLowerCase().replace(',','.'),gender:pro.gender,category:pro.categories[0].id}).fetch();
                    }
                    let pvs = await ProductVariation.find({ product:pr.id,supplierreference:pr.reference}).populate('variation');
                    let pv = pvs.find(pv=> pv.variation.name == variation.name);
                    if (!pv) {
                      productVariation = await ProductVariation.create({
                        product:pr.id,
                        variation:variation.id,
                        reference: vr.reference ? vr.reference : '',
                        supplierreference:pr.reference,
                        ean13: vr.ean13 ? vr.ean13.toString() : '',
                        upc: vr.upc ? vr.upc : 0,
                        price: vr.price,
                        quantity: vr.quantity ? vr.quantity : 0,
                        seller:pr.seller
                      }).fetch();
                    } else {
                      productVariation = await ProductVariation.updateOne({ id: pv.id }).set({
                        price: vr.price,
                        variation: variation.id,
                        quantity: vr.quantity ? vr.quantity : 0,
                      });
                    }

                    if(!discountHandled){
                      if (discount && vr.discount && vr.discount.length > 0) {
                        let disc = await CatalogDiscount.find({
                          where:{
                            name: (vr.discount && vr.discount[0].name) ? vr.discount[0].name.trim().toLowerCase() : pro.name,
                            to:{'>=':moment().valueOf()},
                            from:{'<=':moment().valueOf()},
                            value: vr.discount[0].value,
                            type: vr.discount[0].type
                          },
                          sort: 'createdAt DESC',
                          limit: 1
                        })
                        if (disc.length > 0) {
                          await CatalogDiscount.updateOne({ id: disc[0].id }).set({
                            value: parseFloat(vr.discount[0].value),
                            type: vr.discount[0].type,
                            from: moment(vr.discount[0].from).valueOf(),
                            to: moment(vr.discount[0].to).valueOf()
                          });
                        } else {
                          let discount = await CatalogDiscount.create({
                            name: (vr.discount && vr.discount[0].name) ? vr.discount[0].name.trim().toLowerCase() : pro.name,
                            from: moment(vr.discount[0].from).valueOf(),
                            to: moment(vr.discount[0].to).valueOf(),
                            type: vr.discount[0].type,
                            value: parseFloat(vr.discount[0].value),
                            seller: pro.seller
                          }).fetch();
                          await CatalogDiscount.addToCollection(discount.id,'products').members([pro.id]);
                        }
                      }
                    }
                  
                    if(productVariation){
                      result.push(productVariation);
                      sails.sockets.broadcast(sid, 'variation_processed', {result, errors});
                    }
                    
                  }  
                }

              } catch (e) {
                  errors.push({ name:'ERRDATA', message:e.message });
                  sails.sockets.broadcast(sid, 'variation_processed', {result, errors});
                  console.log(e)
              }
            } 
           } catch (error) {
              errors.push({ name:'ERRDATA', message:error.message });
              sails.sockets.broadcast(sid, 'variation_processed', {result, errors});
           }
        }
      } else {
        sails.sockets.broadcast(sid, 'variation_task_ended', true);
        break;
      }
      page++;
    } while ((!isEmpty));
  }
};