const { replace } = require('lodash');


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
  MAGENTO_PAGESIZE : sails.config.custom.MAGENTO_PAGESIZE,
  MAGENTO_CHANNEL : sails.config.custom.MAGENTO_CHANNEL,
  MERCADOLIBRE_PAGESIZE : sails.config.custom.MERCADOLIBRE_PAGESIZE,
  MERCADOLIBRE_CHANNEL : sails.config.custom.MERCADOLIBRE_CHANNEL,
  TIMEOUT_PRODUCT_TASK: 4000000,
  TIMEOUT_IMAGE_TASK: 8000000,
};

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
    let seller = null;
    let helper = 'catalog';
    const perPage = sails.config.custom.DEFAULTPAGE;
    if (rights.name !== 'superadmin' && rights.name !== 'admin') {
      filter.seller = req.session.user.seller;
    }else if(req.param('seller')){
      filter.seller = req.param('seller');
      seller = req.param('seller');
    }
    let integrations = filter.seller ? await Integrations.find({seller: filter.seller}): [];
    let columnActive = (req.hostname === 'localhost' || req.hostname === '1ecommerce.app') ? false : true;
    const root = await Category.findOne({ name: 'inicio' });
    totalproducts = await Product.count(filter);
    let pages = Math.ceil(totalproducts / perPage);
    let moment = require('moment');
    return res.view('pages/catalog/productlist', {
      layout: 'layouts/admin',
      products: products,
      error: error,
      pages: pages,
      helper:helper,
      seller:seller,
      moment: moment,
      integrations,
      columnActive,
      root
    });
  },
  downloadproducts: async function (req, res) {
    const Excel = require('exceljs');
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    let seller = null;
    if (rights.name !== 'superadmin' && !_.contains(rights.permissions, 'showproducts')) {
      throw 'forbidden';
    }
    if (rights.name !== 'superadmin' && rights.name !== 'admin') {
      seller = req.session.user.seller;
    }else if(req.param('seller')){
      seller = req.param('seller');
    }
    let products = [];
    let productsVariations = await ProductVariation.find({
      where: {
        seller: seller
      }
    }).populate('seller').populate('product').populate('variation');
    let workbook = new Excel.Workbook();
    let worksheet = workbook.addWorksheet('Inventario');
    worksheet.columns = [
      { header: 'id', key: 'id', width: 26 },
      { header: 'name', key: 'name', width: 45 },
      { header: 'reference', key: 'supplierreference', width: 25 },
      { header: 'reference2', key: 'reference', width: 20 },
      { header: 'ean13', key: 'ean13', width: 16 },
      { header: 'upc', key: 'upc', width: 13 },
      { header: 'skuId', key: 'skuId', width: 10 },
      { header: 'variation', key: 'variation', width: 10 },
      { header: 'quantity', key: 'quantity', width: 10 },
      { header: 'safestock', key: 'safestock', width: 10 },
      { header: 'price', key: 'price', width: 10 },
    ];
    worksheet.getRow(1).font = { bold: true };

    for (const variation of productsVariations) {
      variation.name = variation.product.name;
      variation.variation = variation.variation.name;
      variation.safestock = variation.seller.safestock;
      products.push(variation);
    }

    worksheet.addRows(products);
    const buffer = await workbook.xlsx.writeBuffer();
    return res.send(buffer);
  },
  findcatalog: async (req, res) => {
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if (rights.name !== 'superadmin' && !_.contains(rights.permissions, 'showproducts')) {
      throw 'forbidden';
    }
    if (!req.isSocket) { return res.badRequest(); }
    let filter = {};
    let productdata = [];
    let productsStock = [];
    let row = [];
    let page = req.param('page') ? parseInt(req.param('page')) : 1;
    let seller = req.param('seller') ? req.param('seller') : null;
    let paramFilter = req.param('filter') ? req.param('filter') : 'all';
    const perPage = sails.config.custom.DEFAULTPAGE;
    if (rights.name !== 'superadmin' && rights.name !== 'admin') {
      filter.seller = req.session.user.seller;
    }else if(seller!==null){
      filter.seller = seller;
    }

    if (paramFilter === 'active') {
      filter.active = true;
    } else if (paramFilter === 'inactive') {
      filter.active = false;
    }

    let products = await Product.find({
      where: filter,
      sort: 'createdAt DESC',
      skip: ((page - 1) * perPage),
      limit: perPage,
    })
      .populate('images', { cover: 1 })
      .populate('tax')
      .populate('mainColor')
      .populate('manufacturer')
      .populate('mainCategory')
      .populate('seller')
      .populate('channels');

    if (paramFilter === 'image') {
      products = products.filter(product => product.images.length === 0);
    }
    if (paramFilter === 'content') {
      products = products.filter(product => (product.channels.some(channel => channel.reason && channel.reason !== '') || product.details));
    }
    if (paramFilter.includes('integration')) {
      let integration = paramFilter.split('-')[1];
      products = products.filter(product => product.channels.length > 0 && (product.channels.some(channel => channel.integration === integration)));
    }

    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    });

    for (let p of products) {
      p.stock = await ProductVariation.sum('quantity', { product: p.id });
      let cl = 'bx-x-circle';
      if (p.active) { cl = 'bx-check-circle'; }
      if(p.active && (p.stock<1 || p.images.length <1)){ await sails.helpers.tools.productState(p.id,false,p.seller.active); cl = 'bx-x-circle';}
      let published = '';
      for(let pchannel of p.channels){
        let cn = await Integrations.findOne({id:pchannel.integration});
        if(cn){
          let color = pchannel.iscreated && pchannel.qc && pchannel.status ? 'has-text-success' : (pchannel.iscreated && pchannel.qc === false && pchannel.reason === '') ? 'has-text-warning' : 'has-text-danger';
          published +=
          `<div class="icon-text">
            <span class="icon `+color+`">
              <i class='bx bxs-circle'></i>
            </span>
            <span>`+cn.name+`</span>
          </div>`;
        }
      }

      let reason = p.channels.some(channel => channel.reason && channel.reason !== '');
      let price = await ProductVariation.avg('price', { product: p.id }); //p.price ? p.price : 0;
      let isAdmin = rights.name !== 'superadmin' && rights.name !== 'admin' ? false : true;
      let columnActive = (req.hostname==='1ecommerce.app' || req.hostname==='localhost') ? false : true;
      let options = (p.details || reason) ? `<td class="align-middle"><a href="/product/edit/` + p.id + `" target="_blank" class="button has-tooltip-bottom has-tooltip-info" data-tooltip="Editar producto"><span class="icon"><i class="bx bx-edit"></i></span></a><a href="/list/product/` + encodeURIComponent((p.name).replace(/\./g, '%2E')) + `/` + encodeURIComponent(p.reference) + `" class="button has-tooltip-bottom has-tooltip-info" data-tooltip="Ver producto" target="_blank"><span class="icon"><i class='bx bx-link' ></i></span></a><a product="` + p.id + `" class="button showDetails has-tooltip-bottom has-tooltip-info" data-tooltip="Errores de contenido"><span class="icon"><i class='bx bxs-detail'></i></span></a></td>` : `<td class="align-middle"><a href="/product/edit/` + p.id + `" target="_blank" class="button has-tooltip-bottom has-tooltip-info" data-tooltip="Editar producto"><span class="icon"><i class="bx bx-edit"></i></span></a><a href="/list/product/` + encodeURIComponent((p.name).replace(/\./g, '%2E')) + `/` + encodeURIComponent(p.reference) + `" class="button has-tooltip-bottom has-tooltip-info" data-tooltip="Ver producto" target="_blank"><span class="icon"><i class='bx bx-link' ></i></span></a></td>`;
      let resultPublished = published ? published : `<span class="tag is-danger">No Publicado</span>`;
      row = [
        `<td class="align-middle><div class="field">
          <input class="is-checkradio is-small is-info" id="checkboxselect${p.id}" data-product="${p.id}" type="checkbox" name="checkboxselect">
          <label for="checkboxselect${p.id}"></label>
        </div></td>`,
        `<td class="align-middle is-uppercase"><a href="#" class="product-image" data-product="` + p.id + `">` + p.name + `</a></td>`,
        `<td class="align-middle">` + p.reference + `</td>`,
        `<td class="align-middle is-capitalized">` + (p.manufacturer ? p.manufacturer.name : '') + `</td>`,
        `<td class="align-middle"> ` + (price ? formatter.format(price) : formatter.format(0)) + `</td>`,
        `<td class="align-middle is-capitalized">` + (p.mainColor ? p.mainColor.name : '') + `</td>`,
        `<td class="align-middle is-capitalized">` + (p.mainCategory ? p.mainCategory.name : '') + `</td>`,
        `<td class="align-middle">` + p.stock + `</td>`,
        `<td class="align-middle"><span class="action"><i product="` + p.id + `" seller="` + p.seller.id + `" class="state bx ` + cl + ` is-size-5"></i></span></td>`,
        options,
        '<td class="align-middle"><span>' + p.seller.name + '</span></td>',
        `<td class="align-middle"><ul>` + resultPublished + `</ul></td>`,
      ];
      if (!isAdmin) {
        row.splice(10, 1);
      }
      if (columnActive) {
        row.splice(8, 1);
      }
      if(p.images.length<1){row[1]=`<td class="align-middle is-uppercase">` + p.name + `</td>`;}
      if (paramFilter === 'stock' && p.stock === 0) {
        productsStock.push(row);
      } else {
        productdata.push(row);
      }
    }
    return res.send(paramFilter === 'stock' ? productsStock : productdata);
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
    let helper = 'catalog';
    let integrations = null;
    if (rights.name !== 'superadmin' && rights.name !== 'admin') {
      sellers = await Seller.find({ id: req.session.user.seller });
      integrations = await Integrations.find({ seller: req.session.user.seller }).populate('channel');
    } else {
      sellers = await Seller.find();
      integrations = await Integrations.find().populate('channel');
    }

    const taxes = await Tax.find();
    let error = null;
    let product = null;
    let action = req.param('action') ? req.param('action') : null;
    let id = req.param('id') ? req.param('id') : null;
    let channelErrors = [];
    let features = [];
    let activities = ['3X3','ABC','Adventure','Aikido','Alpinismo','Aquagym','Artes Marciales',
      'Atletismo','Badminton','Balet','Balonmano','Baseball','Basquet','Billar','Bmx','Bolos',
      'Boxeo','Buceo','Básicos','Camping','Casual','Caza','Ciclismo','Ciclismo Ruta','Colegiales',
      'Crossfit','Cuidado Personal','Dardos y Dianas','Deportivo','Downhill y Enduro','Eléctricas',
      'Equitación','Escalada','Esgrima','Fanáticos','Fitness','Fitness Cardio Training','Futbol',
      'Fútbol 5','Fútbol Americano','Fútbol Playa','Fútbol sala','Fútsal','Gimnasia','Gimnasia Bebé',
      'Golf','Gym','HANDBALL','Hiking','Infantil','Invernales','Judo','Juegos de Mesa y Ocio','Juegos de Playa',
      'Jujitsu','Karate','Kayaks, Embarcaciones','Kick Boxing','Kung-Fu','Lifestyle','Longboard',
      'Marcha Deportiva','Microfútbol','Mma','Motociclismo','Motos','Mtb Ciclomontañismo',
      'Muay-Thai','Natacion','Navegacion','Ocasiones Especiales','Outdoor','Padel','Parapentismo',
      'Patinaje','Patinaje Artístico','Patinaje En Línea','Pesca','Pijamas','Pilates','Ping-Pong',
      'Pingpong','Playa','Pole Dance','Ropa Deportiva','Rugby','En proceso','Salud y nutrición',
      'Senderismo-Hiking','Skate','Slackline','Snorkel','Snowboard','Softball','Squash','Surf','Taekwondo',
      'Tejo','Tennis','Tiro Con Arco','Tiro Deportivo','Trail','Trail Running','Training','Trekking',
      'Triatlón','Ultimate (Frisbee)','Urbano','Voley Playa','Volleyball','Walking','Waterpolo','Windsurf','Yoga','Zumba'
    ];
    if (id !== null) {
      product = await Product.findOne({ id: id })
        .populate('images', {
          sort: 'cover DESC'
        })
        .populate('tax')
        .populate('mainCategory')
        .populate('mainColor')
        .populate('categories')
        .populate('variations')
        .populate('discount')
        .populate('features')
        .populate('channels');
      for (let pv in product.variations) {
        product.variations[pv].variation = await Variation.findOne({ id: product.variations[pv].variation });
      }
      for (let c of product.categories) {
        let cat = await Category.findOne({id: c.id}).populate('features');
        for (let f of cat.features){
          if(!features.some(feat=>feat.id===f.id) && f!=='' && f!== null){
            features.push(f);
          }
        }
      }
      for (const channel of product.channels) {
        if (channel.reason && channel.reason !== '') {
          channelErrors.push({reference: product.reference, reason: channel.reason, integration: channel.integration});
        }
      }
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
      action: action,
      product: product,
      helper:helper,
      error: error,
      channelErrors,
      features: features,
      activities,
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
      let seller = await Seller.findOne({id:req.body.seller});
      let exists = await Product.findOne({ reference: req.body.reference.toUpperCase().trim(), seller: req.body.seller });
      if (!exists) {
        product = await Product.create({
          name: req.body.name.toLowerCase().trim(),
          reference: req.body.reference.toUpperCase().trim(),
          description: req.body.description,
          descriptionShort: req.body.descriptionshort,
          group:req.body.group ? req.body.group : '',
          active: req.body.active,
          tax: req.body.tax,
          mainCategory: req.body.mainCategory,
          mainColor: req.body.mainColor,
          manufacturer: req.body.manufacturer,
          activity: req.body.activity || '',
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
          group:req.body.group ? req.body.group : '',
          active: req.body.active,
          tax: req.body.tax,
          mainCategory: req.body.mainCategory,
          mainColor: req.body.mainColor,
          manufacturer: req.body.manufacturer,
          activity: req.body.activity || '',
          gender: req.body.gender,
          seller: req.body.seller,
          width: req.body.width,
          height: req.body.height,
          length: req.body.length,
          weight: req.body.weight
        });
        await Product.replaceCollection(product.id, 'categories').members(JSON.parse(req.body.categories));
        await sails.helpers.tools.productState(product.id,product.active,true,seller.active);
      }
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
      return res.send({error: error});
    } else if (newcover.length > 0) {
      return res.send({id: newcover[0].id});
    } else {
      return res.send({success: 'ok'});
    }
  },
  productvariations: async function (req, res) {
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if (rights.name !== 'superadmin' && !_.contains(rights.permissions, 'productvariations')) {
      throw 'forbidden';
    }
    if (!req.isSocket) {return res.badRequest();}
    let error = false;
    let product = await Product.findOne({ id: req.body[0].product }).populate('seller').populate('categories',{level:2});
    const channels = await ProductChannel.find({product: product.id}).populate('channel');
    for (let list of req.body) {
      let pv = await ProductVariation.findOne({id: list.productvariation}).populate('variation');
      if(pv){
        let vFilter = {name:pv.variation.name,gender:product.gender,category:product.categories[0].id, manufacturer:product.manufacturer,seller:product.seller.id};
        let v = await Variation.find(vFilter)[0];
        if(!v){
          v = await Variation.create(vFilter).fetch();
        }
        await ProductVariation.updateOne({id:list.productvariation}).set({product: list.product, variation:v.id, reference: list.reference, supplierreference: list.supplierreference, ean13: list.ean13, upc: list.upc, price: list.price, quantity: list.quantity, seller: product.seller.id });
      }else{
        await ProductVariation.create({ product: list.product, variation: list.variation, reference: list.reference, supplierreference: list.supplierreference, ean13: list.ean13, upc: list.upc, price: list.price, quantity: list.quantity, seller: product.seller.id });
      }
    }
    if (channels.length > 0) {
      let productchannel = channels.find(item => item.channel.name === 'mercadolibre' || item.channel.name === 'mercadolibremx');
      if (productchannel) {
        let integration = await Integrations.findOne({id: productchannel.integration}).populate('channel');
        const channelPrice = productchannel ? productchannel.price : 0;
        if (productchannel.channel.name === 'mercadolibre') {
          let body = await sails.helpers.channel.mercadolibre.product(product.id, 'Update', integration.id, channelPrice);
          if(body){
            await sails.helpers.channel.mercadolibre.request(`items/${productchannel.channelid}`,integration.channel.endpoint,integration.secret,body,'PUT');
          }
        } else {
          let body = await sails.helpers.channel.mercadolibremx.product(product.id, 'Update', integration.id, channelPrice);
          if(body){
            await sails.helpers.channel.mercadolibremx.request(`items/${productchannel.channelid}`,integration.channel.endpoint,integration.secret,body,'PUT');
          }
        }
      }
    }
    if(!error){
      await sails.helpers.tools.productState(product.id,product.active,true,product.seller.active);
      return res.send('ok');
    }
  },
  findvariations: async (req, res) => {
    if (!req.isSocket) {
      return res.badRequest();
    }
    let product = await Product.findOne({ id: req.param('id') }).populate('categories', { level: 2 });
    let level2 = product.categories.map(c => c.id);
    let variations = await Variation.find({ where: { manufacturer: product.manufacturer, gender: product.gender, seller: product.seller, category: { in: level2 } } });
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
    try {
      const id = req.param('id');
      const productVariation = await ProductVariation.findOne({id: id}).populate('variation');
      const existOrdenItem = await OrderItem.find({product: productVariation.product, productvariation: productVariation.id});
      if (existOrdenItem.length === 0) {
        const channels = await ProductChannel.find({product: productVariation.product}).populate('channel');
        if (channels.length > 0) {
          let productchannel = channels.find(item => item.channel.name === 'mercadolibre' || item.channel.name === 'mercadolibremx');
          if (productchannel) {
            let integration = await Integrations.findOne({id: productchannel.integration}).populate('channel');
            let variations = productchannel.channel.name === 'mercadolibre' ? await sails.helpers.channel.mercadolibre.request(`/items/${productchannel.channelid}/variations`,integration.channel.endpoint,integration.secret,'GET') :
            await sails.helpers.channel.mercadolibremx.request(`/items/${productchannel.channelid}/variations`,integration.channel.endpoint,integration.secret,'GET');
            if (variations.length > 0) {
              for (const variation of variations) {
                const size = variation.attribute_combinations.find(attr => attr.id === 'SIZE');
                if (size.value_name == productVariation.variation.name) {
                  if (productchannel.channel.name === 'mercadolibre') {
                    await sails.helpers.channel.mercadolibre.request(`/items/${productchannel.channelid}/variations/${variation.id}`,integration.channel.endpoint,integration.secret,'','DELETE');
                  } else {
                    await sails.helpers.channel.mercadolibremx.request(`/items/${productchannel.channelid}/variations/${variation.id}`,integration.channel.endpoint,integration.secret,'','DELETE');
                  }
                }
              }
            }
          }
        }
        await ProductVariation.destroyOne({id: id});
        return res.send({result: true});
      }
      return res.send({result: false});
    } catch (error) {
      console.log(error);
      return res.send({result: false});
    }
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
    let seller = await Seller.findOne({id:req.param('seller')});

    await sails.helpers.tools.productState(id,state,seller.active,true);
    return res.send(state);
  },
  dafitiadd: async (req, res) => {
    if (!req.isSocket) { return res.badRequest(); }
    let sid = sails.sockets.getId(req);
    let product = await Product.findOne({ id: req.body.product })
    .populate('channels')
    .populate('gender')
    .populate('manufacturer')
    .populate('seller');
    const integrationId = req.body.integrationId;
    const channelId = req.body.channelId;
    let productchannel = product.channels.find(item => item.integration === integrationId && item.channel === channelId);
    let integration = await Integrations.findOne({ id : integrationId}).populate('channel');
    const productChannelId = productchannel ? productchannel.id : '';
    try {
      var jsonxml = require('jsontoxml');
      let action = null;
      if (productchannel && productchannel.iscreated) {
        action = 'ProductUpdate';
      } else {
        action = 'ProductCreate';
      }
      let status = req.body.status ? 'active' : 'inactive';
      let checkProduct = await sails.helpers.checkContentProduct(product);
      if (checkProduct || action === 'ProductUpdate') {
        let result = await sails.helpers.channel.dafiti.product([product], integration, parseFloat(req.body.price), status);
        var xml = jsonxml(result,true);
        let sign = await sails.helpers.channel.dafiti.sign(integrationId, action, product.seller.id);
        await sails.helpers.request(integration.channel.endpoint,'/?'+sign,'POST', xml)
        .then(async (resData)=>{
          resData = JSON.parse(resData);
          if(resData.SuccessResponse){
            await ProductChannel.findOrCreate({id: productChannelId},{
              product:product.id,
              integration:integrationId,
              channel:integration.channel.id,
              channelid:'',
              status:false,
              qc:false,
              price:req.body.price ? parseFloat(req.body.price) : 0,
              iscreated:false,
              socketid:sid
            }).exec(async (err, record, created)=>{
              if(err){return new Error(err.message);}
              if(!created){
                await ProductChannel.updateOne({id: record.id}).set({
                  status: record.iscreated ? req.body.status : false,
                  price:req.body.price ? parseFloat(req.body.price) : 0,
                  reason: '',
                  socketid:sid
                });
              }
            });
            return res.send({error: null});
          }else{
            return res.send({error: resData.ErrorResponse.Head.ErrorMessage});
          }
        })
        .catch(err =>{
          console.log(err);
          return res.send({error: err.message});
        });
      } else {
        return res.send({error: 'El producto tiene problemas de contenido, verificar los detalles y corregirlos.'});
      }
    } catch (err) {
      return res.send({error: err.message});
    }
  },
  mercadolibreadd: async (req, res) => {
    if (!req.isSocket) {return res.badRequest();}
    let product = await Product.findOne({ id: req.body.product })
    .populate('channels')
    .populate('gender')
    .populate('manufacturer')
    .populate('seller');
    const integrationId = req.body.integrationId;
    const channelId = req.body.channelId;
    let productchannel = product.channels.find(item => item.integration === integrationId && item.channel === channelId);
    const productChannelId = productchannel ? productchannel.id : '';
    const channelPrice = productchannel ? productchannel.price : 0;
    try {
      let action = null;
      let result = null;
      let status = req.body.status ? 'active' : 'paused';
      if (productchannel && productchannel.channelid) {
        action = 'Update';
      } else {
        action = 'Post';
      }
      let checkProduct = await sails.helpers.checkContentProduct(product);
      if (checkProduct || action === 'Update') {
        let integration = await sails.helpers.channel.mercadolibre.sign(integrationId);
        let body = await sails.helpers.channel.mercadolibre.product(product.id, action, integration.id,channelPrice,parseFloat(req.body.price),status);
        if(body){
          if(action==='Update'){
            result = await sails.helpers.channel.mercadolibre.request('items/'+productchannel.channelid,integration.channel.endpoint,integration.secret, body,'PUT');
            await ProductChannel.updateOne({id: productChannelId}).set({
              status: req.body.status ? true : false,
              qc:true,
              price: req.body.price ? parseFloat(req.body.price) : 0,
              reason: ''
            });
          }
          if(action==='Post'){
            result = await sails.helpers.channel.mercadolibre.request('items',integration.channel.endpoint,integration.secret, body,'POST');
            if(result.id){
              await ProductChannel.findOrCreate({id: productChannelId},{
                product:product.id,
                channel:channelId,
                integration:integrationId,
                channelid: result.id,
                status: true,
                qc:true,
                iscreated:true,
                price: req.body.price ? parseFloat(req.body.price) : 0,
                reason: ''
              }).exec(async (err, record, created)=>{
                if(err){return new Error(err.message);}
                if(!created){
                  await ProductChannel.updateOne({id: record.id}).set({
                    channelid:result.id,
                    status:true,
                    qc:true,
                    iscreated:true,
                    price: req.body.price ? parseFloat(req.body.price) : 0,
                    reason: ''
                  });
                }
              });
              await sails.helpers.channel.mercadolibre.request(`items/${result.id}/description`,integration.channel.endpoint,integration.secret, body.description,'POST');
            }
          }
          return res.send({error: null});
        }
      } else {
        return res.send({error: 'El producto tiene problemas de contenido, verificar los detalles y corregirlos.'});
      }
    } catch (err) {
      return res.send({error: typeof err.message === 'string' ? err.message : 'Error al procesar el producto.'});
    }
  },
  mercadolibremxadd: async (req, res) => {
    if (!req.isSocket) {return res.badRequest();}
    let product = await Product.findOne({ id: req.body.product })
    .populate('channels')
    .populate('gender')
    .populate('manufacturer')
    .populate('seller');
    const integrationId = req.body.integrationId;
    const channelId = req.body.channelId;
    let productchannel = product.channels.find(item => item.integration === integrationId && item.channel === channelId);
    const productChannelId = productchannel ? productchannel.id : '';
    const channelPrice = productchannel ? productchannel.price : 0;
    try {
      let action = null;
      let result = null;
      let status = req.body.status ? 'active' : 'paused';
      if (productchannel && productchannel.channelid) {
        action = 'Update';
      } else {
        action = 'Post';
      }
      let checkProduct = await sails.helpers.checkContentProduct(product);
      if (checkProduct || action === 'Update') {
        let integration = await sails.helpers.channel.mercadolibremx.sign(integrationId);
        let body = await sails.helpers.channel.mercadolibremx.product(product.id, action, integration.id,channelPrice,parseFloat(req.body.price),status);
        if(body){
          if(action==='Update'){
            result = await sails.helpers.channel.mercadolibremx.request('items/'+productchannel.channelid,integration.channel.endpoint,integration.secret, body,'PUT');
            await ProductChannel.updateOne({id: productChannelId}).set({
              status: req.body.status ? true : false,
              qc:true,
              price: req.body.price ? parseFloat(req.body.price) : 0,
              reason: ''
            });
          }
          if(action==='Post'){
            result = await sails.helpers.channel.mercadolibremx.request('items',integration.channel.endpoint,integration.secret, body,'POST');
            if(result.id){
              await ProductChannel.findOrCreate({id: productChannelId},{
                product:product.id,
                channel:channelId,
                integration:integrationId,
                channelid: result.id,
                status: true,
                qc:true,
                iscreated:true,
                price: req.body.price ? parseFloat(req.body.price) : 0,
                reason: ''
              }).exec(async (err, record, created)=>{
                if(err){return new Error(err.message);}
                if(!created){
                  await ProductChannel.updateOne({id: record.id}).set({
                    channelid:result.id,
                    status:true,
                    qc:true,
                    iscreated:true,
                    price: req.body.price ? parseFloat(req.body.price) : 0,
                    reason: ''
                  });
                }
              });
              await sails.helpers.channel.mercadolibremx.request(`items/${result.id}/description`,integration.channel.endpoint,integration.secret, body.description,'POST');
            }
          }
          return res.send({error: null});
        }
      } else {
        return res.send({error: 'El producto tiene problemas de contenido, verificar los detalles y corregirlos.'});
      }
    } catch (err) {
      return res.send({error: typeof err.message === 'string' ? err.message : 'Error al procesar el producto.'});
    }
  },
  linioadd: async (req, res) => {
    if (!req.isSocket) { return res.badRequest(); }
    let sid = sails.sockets.getId(req);
    let product = await Product.findOne({ id: req.body.product })
    .populate('channels')
    .populate('gender')
    .populate('manufacturer')
    .populate('seller');
    const integrationId = req.body.integrationId;
    const channelId = req.body.channelId;
    let productchannel = product.channels.find(item => item.integration === integrationId && item.channel === channelId);
    let integration = await Integrations.findOne({ id : integrationId}).populate('channel');
    const productChannelId = productchannel ? productchannel.id : '';
    try {
      var jsonxml = require('jsontoxml');
      let action = null;
      if (productchannel && productchannel.iscreated) {
        action = 'ProductUpdate';
      } else {
        action = 'ProductCreate';
      }
      let status = req.body.status ? 'active' : 'inactive';
      let checkProduct = await sails.helpers.checkContentProduct(product);
      if (checkProduct || action === 'ProductUpdate') {
        let result = await sails.helpers.channel.linio.product([product], integration, parseFloat(req.body.price), status);
        var xml = jsonxml(result,true);
        let sign = await sails.helpers.channel.linio.sign(integrationId, action, product.seller.id);
        await sails.helpers.request(integration.channel.endpoint,'/?'+sign,'POST', xml)
        .then(async (resData)=>{
          resData = JSON.parse(resData);
          if(resData.SuccessResponse){
            await ProductChannel.findOrCreate({id: productChannelId},{
              product:product.id,
              integration:integrationId,
              channel:integration.channel.id,
              channelid:'',
              status:false,
              qc:false,
              price:req.body.price ? parseFloat(req.body.price) : 0,
              iscreated:false,
              socketid:sid
            }).exec(async (err, record, created)=>{
              if(err){return new Error(err.message);}
              if(!created){
                await ProductChannel.updateOne({id: record.id}).set({
                  status: record.iscreated ? req.body.status : false,
                  price:req.body.price ? parseFloat(req.body.price) : 0,
                  reason: '',
                  socketid:sid
                });
              }
            });
            return res.send({error: null});
          }else{
            return res.send({error: resData.ErrorResponse.Head.ErrorMessage});
          }
        })
        .catch(err =>{
          console.log(err);
          return res.send({error: err.message});
        });
      } else {
        return res.send({error: 'El producto tiene problemas de contenido, verificar los detalles y corregirlos.'});
      }
    } catch (err) {
      return res.send({error: err.message});
    }
  },
  liniomxadd: async (req, res) => {
    if (!req.isSocket) { return res.badRequest(); }
    let sid = sails.sockets.getId(req);
    let product = await Product.findOne({ id: req.body.product })
    .populate('channels')
    .populate('gender')
    .populate('manufacturer')
    .populate('seller');
    const integrationId = req.body.integrationId;
    const channelId = req.body.channelId;
    let productchannel = product.channels.find(item => item.integration === integrationId && item.channel === channelId);
    let integration = await Integrations.findOne({ id : integrationId}).populate('channel');
    const productChannelId = productchannel ? productchannel.id : '';
    try {
      var jsonxml = require('jsontoxml');
      let action = null;
      if (productchannel && productchannel.iscreated) {
        action = 'ProductUpdate';
      } else {
        action = 'ProductCreate';
      }
      let checkProduct = await sails.helpers.checkContentProduct(product);
      if (checkProduct || action === 'ProductUpdate') {
        let status = req.body.status ? 'active' : 'inactive';
        let result = await sails.helpers.channel.liniomx.product([product], integration, parseFloat(req.body.price), status);
        var xml = jsonxml(result,true);
        let sign = await sails.helpers.channel.liniomx.sign(integrationId, action, product.seller.id);
        await sails.helpers.request(integration.channel.endpoint,'/?'+sign,'POST', xml)
        .then(async (resData)=>{
          resData = JSON.parse(resData);
          if(resData.SuccessResponse){
            await ProductChannel.findOrCreate({id: productChannelId},{
              product:product.id,
              integration:integrationId,
              channel:integration.channel.id,
              channelid:'',
              status:false,
              qc:false,
              price:req.body.price ? parseFloat(req.body.price) : 0,
              iscreated:false,
              socketid:sid
            }).exec(async (err, record, created)=>{
              if(err){return new Error(err.message);}
              if(!created){
                await ProductChannel.updateOne({id: record.id}).set({
                  status: record.iscreated ? req.body.status : false,
                  price:req.body.price ? parseFloat(req.body.price) : 0,
                  reason: '',
                  socketid:sid
                });
              }
            });
            return res.send({error: null});
          }else{
            return res.send({error: resData.ErrorResponse.Head.ErrorMessage});
          }
        })
        .catch(err =>{
          console.log(err);
          return res.send({error: err.message});
        });
      } else {
        return res.send({error: 'El producto tiene problemas de contenido, verificar los detalles y corregirlos.'});
      }
    } catch (err) {
      return res.send({error: err.message});
    }
  },
  coppeladd: async (req, res) => {
    if (!req.isSocket) { return res.badRequest(); }
    let axios = require('axios');
    let fs = require('fs');
    let FormData = require('form-data');
    let product = await Product.findOne({ id: req.body.product })
    .populate('channels')
    .populate('gender')
    .populate('manufacturer')
    .populate('seller');
    const integrationId = req.body.integrationId;
    const channelId = req.body.channelId;
    let productchannel = product.channels.find(item => item.integration === integrationId && item.channel === channelId);
    let productChannelId = productchannel ? productchannel.id : '';
    const channelPrice = productchannel ? productchannel.price : 0;
    let integration = await Integrations.findOne({id: integrationId}).populate('channel');
    try {
      let action = null;
      let result = null;
      let status = req.body.status ? 'active' : 'paused';
      if (productchannel && productchannel.channelid) {
        action = 'Update';
      } else {
        action = 'Post';
      }
      let checkProduct = await sails.helpers.checkContentProduct(product);
      if (checkProduct || action === 'Update') {
        options = {
          method: 'get',
          url: `${integration.channel.endpoint}api/products?product_references=EAN|${product.id}`,
          headers: {
            'Authorization':`${integration.key}`,
            accept: 'application/json'
          }
        };
        let created = await axios(options).catch((e) => {result=e.response;});
        if(created){
          if(created.data.total_count==0 && status=='active'){
            await sails.helpers.channel.coppel.product(product.id, action, parseFloat(channelPrice), status)
            .intercept((err) => {return new Error(err.message);});
            let file = new FormData();
            file.append('file',fs.createReadStream('./.tmp/uploads/product.xlsx'));
            options = {
              method: 'post',
              url: `${integration.channel.endpoint}api/products/imports`,
              headers: {
                'Authorization':`${integration.key}`,
                'content-type': `multipart/form-data; boundary=${file._boundary}`,
                accept: 'application/json'
              },
              data:file
            };
            let response = await axios(options).catch((e) => {result=e.response; console.log(result);});
            if(response){
              await ProductChannel.findOrCreate({id: productChannelId},{
                product:product.id,
                channel:channelId,
                integration:integrationId,
                channelid: response.data.import_id,
                status: true,
                qc:true,
                iscreated:true,
                price: req.body.price ? parseFloat(req.body.price) : 0
              }).exec(async (err, record, created)=>{
                if(err){return new Error(err.message);}
                if(!created){
                  productChannelId = await ProductChannel.updateOne({id: record.id}).set({
                    channelid: response.data.import_id,
                    status:req.body.status,
                    iscreated:true,
                    price: req.body.price ? parseFloat(req.body.price) : 0,
                    reason: '',
                  });
                }
              });
              return res.send(response.data.import_id);
            }
          }
          if(action == 'Post'){
            await sails.helpers.channel.coppel.product(product.id, 'Offer', parseFloat(req.body.price), status)
            .intercept((err) => {return new Error(err.message);});
            let file = new FormData();
            file.append('file',fs.createReadStream('./.tmp/uploads/product.xlsx'));
            file.append('import_mode','NORMAL');
            options = {
              method: 'post',
              url: `${integration.channel.endpoint}api/offers/imports`,
              headers: {
                'Authorization':`${integration.key}`,
                'content-type': `multipart/form-data; boundary=${file._boundary}`,
                accept: 'application/json'
              },
              data:file
            };
            await axios(options).catch((e) => {result=e.response; console.log(result);});
          }else if(action == 'Update'){
            let body = await sails.helpers.channel.coppel.product(product.id, 'Update', parseFloat(req.body.price), status)
            .intercept((err) => {return new Error(err.message);});
            options = {
              method: 'post',
              url: `${integration.channel.endpoint}api/offers`,
              headers: {
                'Authorization':`${integration.key}`,
                'content-type': `application/json`,
                accept: 'application/json'
              },
              data:body
            };
            let response_offer = await axios(options).catch((e) => {result=e.response; console.log(result);});
            if(response_offer){
              await ProductChannel.updateOne({ id: productChannelId }).set({
                status: req.body.status,
                reason: '',
                price: req.body.price ? parseFloat(req.body.price) : 0
              });
            }
          }
        }
      } else {
        return res.send({error: 'El producto tiene problemas de contenido, verificar los detalles y corregirlos.'});
      }
    } catch (err) {
      return res.send({error: err.message});
    }
  },
  iridioadd: async (req, res) => {
    if (!req.isSocket) { return res.badRequest(); }
    let sid = sails.sockets.getId(req);
    const integrationId = req.body.integrationId;
    const channelId = req.body.channelId;
    let integration = await Integrations.findOne({id:integrationId}).populate('channel');
    let status = req.body.status ? true : false;
    let product = await Product.findOne({ id: req.body.product })
    .populate('channels', {integration:integrationId,channel:channelId})
    .populate('gender')
    .populate('manufacturer')
    .populate('seller');
    try {
      let checkProduct = await sails.helpers.checkContentProduct(product);
      if (checkProduct) {
        if(product.channels.length<1){
          await ProductChannel.create({
            product:product.id,
            integration:integrationId,
            channel:integration.channel.id,
            channelid:'',
            status:status,
            qc:true,
            price:0,
            iscreated:true,
            socketid:sid
          });
        }else{
          await ProductChannel.updateOne({id:product.channels[0].id}).set({
            reason: '',
            status:status,
          });
        }
        return res.send({error: null});
      } else {
        return res.send({error: 'El producto tiene problemas de contenido, verificar los detalles y corregirlos.'});
      }
    } catch (err) {
      return res.send({error: err.message});
    }
  },
  walmartadd: async (req, res) => {
    if (!req.isSocket) { return res.badRequest(); }
    let axios = require('axios');

    let product = await Product.findOne({ id: req.body.product })
    .populate('channels')
    .populate('gender')
    .populate('manufacturer')
    .populate('seller');
    const integrationId = req.body.integrationId;
    const channelId = req.body.channelId;
    let productchannel = product.channels.find(item => item.integration === integrationId && item.channel === channelId);
    const productChannelId = productchannel ? productchannel.id : '';
    const channelPrice = productchannel ? productchannel.price : 0;
    let integration = await Integrations.findOne({ id : integrationId}).populate('channel');

    let action = null;
    if (productchannel && productchannel.iscreated) {
      action = 'ProductUpdate';
    } else {
      action = 'ProductCreate';
    }

    try {
      let checkProduct = await sails.helpers.checkContentProduct(product);
      if (checkProduct || action === 'ProductUpdate') {
        let xml = await sails.helpers.channel.walmart.product([product], parseFloat(req.body.price), channelPrice, action, integration.channel.id);
        const buffer_xml = Buffer.from(xml,'latin1');

        let token = await sails.helpers.channel.walmart.sign(integration);

        let auth = `${integration.user}:${integration.key}`;
        const buferArray = Buffer.from(auth);
        let encodedAuth = buferArray.toString('base64');

        let options = {
          method: 'post',
          url: `${integration.channel.endpoint}/v3/feeds?feedType=item`,
          headers: {
            'content-type': `application/xml`,
            accept: 'application/json',
            'WM_MARKET' : 'mx',
            'WM_SEC.ACCESS_TOKEN':token,
            'WM_SVC.NAME' : 'Walmart Marketplace',
            'WM_QOS.CORRELATION_ID': '11111111',
            'Authorization': `Basic ${encodedAuth}`
          },
          data:buffer_xml
        };

        let response_xml = await axios(options).catch((e) => {error=e; console.log(e);});
        if (response_xml && response_xml.data){
          await ProductChannel.findOrCreate({id: productChannelId},{
            product:product.id,
            integration:integrationId,
            channel : integration.channel.id,
            channelid: response_xml.data.feedId,
            status: false,
            iscreated:false,
            qc:false,
            price: req.body.price ? parseFloat(req.body.price) : 0
          }).exec(async (err, record, created)=>{
            if(err){return new Error(err.message);}
            if(!created){
              await ProductChannel.updateOne({id: record.id}).set({
                status: record.iscreated ? req.body.status : false,
                reason: '',
                price: req.body.price ? parseFloat(req.body.price) : 0
              });
            }
          });
          return res.send(response_xml.data.feedId);
        }else{
          await ProductChannel.updateOne({ product:product.id , integration:integrationId }).set(
            {
              status: false,
              reason: '',
              price: 0
            }
          );
          return res.send({error: error.error.description});
        }
      } else {
        return res.send({error: 'El producto tiene problemas de contenido, verificar los detalles y corregirlos.'});
      }
    } catch (err) {
      return res.send({error: err.message});
    }
  },
  shopeeadd: async (req, res) => {
    if (!req.isSocket) { return res.badRequest(); }
    let product = await Product.findOne({ id: req.body.product })
    .populate('channels')
    .populate('gender')
    .populate('manufacturer')
    .populate('seller');
    const integrationId = req.body.integrationId;
    const channelId = req.body.channelId;
    let productchannel = product.channels.find(item => item.integration === integrationId && item.channel === channelId);
    let integration = await Integrations.findOne({ id : integrationId}).populate('channel');
    const productChannelId = productchannel ? productchannel.id : '';
    let variations = null;
    try {
      let action = null;
      if (productchannel && productchannel.channelid) {
        action = 'Update';
      } else {
        action = 'Post';
      }
      let status = req.body.status ? 'NORMAL' : 'UNLIST';
      let checkProduct = await sails.helpers.checkContentProduct(product);
      if (checkProduct || action === 'Update') {
        let body = await sails.helpers.channel.shopee.product(product.id, action, integration, parseFloat(req.body.price), status);
        if (body) {
          variations = body.variations;
          delete variations;
          if(action==='Update'){
            body.item_id = parseInt(productchannel.channelid);
            let response = await sails.helpers.channel.shopee.request('/api/v2/product/update_item',integration.channel.endpoint,[`shop_id=${parseInt(integration.shopid)}`,`access_token=${integration.secret}`],body,'POST');
            if (response && !response.error) {
              await sails.helpers.channel.shopee.updateModel(integration, parseInt(productchannel.channelid), variations);
              await ProductChannel.updateOne({id: productChannelId}).set({
                status: req.body.status ? true : false,
                qc: true,
                price: req.body.price ? parseFloat(req.body.price) : 0,
                reason: ''
              });
            } else {
              return res.send({error: response.message});
            }
          }
          if(action==='Post'){
            let response = await sails.helpers.channel.shopee.request('/api/v2/product/add_item',integration.channel.endpoint,[`shop_id=${parseInt(integration.shopid)}`,`access_token=${integration.secret}`],body,'POST');
            if (response && !response.error) {
              await ProductChannel.findOrCreate({id: productChannelId},{
                product:product.id,
                channel:channelId,
                integration:integrationId,
                channelid: response.response.item_id,
                status: true,
                qc:true,
                iscreated:true,
                price: req.body.price ? parseFloat(req.body.price) : 0,
                reason: ''
              }).exec(async (err, record, created)=>{
                if(err){return new Error(err.message);}
                if(!created){
                  await ProductChannel.updateOne({id: record.id}).set({
                    channelid:response.response.item_id,
                    status:true,
                    qc:true,
                    iscreated:true,
                    price: req.body.price ? parseFloat(req.body.price) : 0,
                    reason: ''
                  });
                }
              });
              variations.item_id = response.response.item_id;
              let responseVariations = await sails.helpers.channel.shopee.request('/api/v2/product/init_tier_variation',integration.channel.endpoint,[`shop_id=${parseInt(integration.shopid)}`,`access_token=${integration.secret}`],variations,'POST');
              if (responseVariations && responseVariations.error) {
                return res.send({error: response.message});
              }
            } else{
              return res.send({error: response.message});
            }
          }
          return res.send({error: null});
        }
      } else {
        return res.send({error: 'El producto tiene problemas de contenido, verificar los detalles y corregirlos.'});
      }
    } catch (err) {
      return res.send({error: err.message});
    }
  },
  import: async (req, res) => {
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if (rights.name !== 'superadmin' && !_.contains(rights.permissions, 'createproduct')) {
      throw 'forbidden';
    }
    let seller = req.param('seller') ? req.param('seller') : req.session.user.seller;
    let  integrations = await Integrations.find({ seller: seller }).populate('channel');
    let error = req.param('error') ? req.param('error') : null;
    return res.view('pages/configuration/import', { layout: 'layouts/admin', error: error, resultados: null, rights: rights.name, seller, integrations, pagination: null });
  },
  importexecute: async (req, res) => {
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if (rights.name !== 'superadmin' && !_.contains(rights.permissions, 'createproduct')) {
      throw 'forbidden';
    }
    let seller = req.body.seller ? req.body.seller : req.session.user.seller;
    let integrations = await Integrations.find({ seller: seller });
    let importType = req.body.importType;
    let result = [];
    let errors = [];
    let imageErrors = [];
    let imageItems = [];
    let type = req.body.entity ? req.body.entity : null;
    let discount = req.body.discount;
    let asColor = req.body.asColor;

    if (req.body.channel) {
      let page = 1;
      let pageSize =
        req.body.channel === constants.WOOCOMMERCE_CHANNEL ? constants.WOOCOMMERCE_PAGESIZE :
        req.body.channel === constants.SHOPIFY_CHANNEL ? constants.SHOPIFY_PAGESIZE :
        req.body.channel === constants.VTEX_CHANNEL ? constants.VTEX_PAGESIZE :
        req.body.channel === constants.PRESTASHOP_CHANNEL ? constants.PRESTASHOP_PAGESIZE :
        req.body.channel === constants.MAGENTO_CHANNEL ? constants.MAGENTO_PAGESIZE :
        req.body.channel === constants.MERCADOLIBRE_CHANNEL ? constants.MERCADOLIBRE_PAGESIZE : 0;
      let next;

      switch (importType) {
        case constants.PRODUCT_TYPE:

          try {
            let pagination = await sails.helpers.commerceImporter(
              req.body.channel,
              req.body.pk,
              req.body.sk,
              req.body.apiUrl,
              req.body.version,
              'PAGINATION',
              { page, pageSize, next: next || null }
            );

            return res.send({error: null, resultados: [], integrations: integrations, rights: rights.name, pagination, pageSize, discount, asColor, seller, importType : importType, credentials : { channel : req.body.channel, pk : req.body.pk, sk : req.body.sk, apiUrl : req.body.apiUrl, version : req.body.version}});

          } catch (error) {
            return res.send({error: error.message, resultados: [], integrations: integrations, rights: rights.name, pagination : null, pageSize : null, discount, asColor, seller, importType : importType, credentials : { channel : req.body.channel, pk : req.body.pk, sk : req.body.sk, apiUrl : req.body.apiUrl, version : req.body.version}});
          }

          break;
        case constants.PRODUCT_VARIATION:
          try {
            let paginationVariation = await sails.helpers.commerceImporter(
              req.body.channel,
              req.body.pk,
              req.body.sk,
              req.body.apiUrl,
              req.body.version,
              'PAGINATION',
              { page, pageSize, next: next || null }
            ).catch((e) => console.log(e));
            return res.send({error: null, resultados: null, integrations: integrations, rights: rights.name, pagination: paginationVariation, pageSize, discount, asColor, importType : importType, credentials : { channel : req.body.channel, pk : req.body.pk, sk : req.body.sk, apiUrl : req.body.apiUrl, version : req.body.version}});
          } catch (error) {
            return res.send({error: error.message, resultados: null, integrations: integrations, rights: rights.name, pagination: null, pageSize, discount, asColor, importType : importType, credentials : { channel : req.body.channel, pk : req.body.pk, sk : req.body.sk, apiUrl : req.body.apiUrl, version : req.body.version}});
          }
          break;
        case constants.IMAGE_TYPE:
          try {
            let paginationImage = await sails.helpers.commerceImporter(
              req.body.channel,
              req.body.pk,
              req.body.sk,
              req.body.apiUrl,
              req.body.version,
              'PAGINATION',
              { page, pageSize, next: next || null }
            ).catch((e) => console.log(e));

            return res.send({error: null, resultados: null, integrations: integrations, rights: rights.name, pagination: paginationImage, pageSize, discount, asColor, seller, importType : importType, credentials : { channel : req.body.channel, pk : req.body.pk, sk : req.body.sk, apiUrl : req.body.apiUrl, version : req.body.version}});
          } catch (error) {
            return res.send({error: error.message, resultados: null, integrations: integrations, rights: rights.name, pagination: null, pageSize, discount, asColor, seller, importType : importType, credentials : { channel : req.body.channel, pk : req.body.pk, sk : req.body.sk, apiUrl : req.body.apiUrl, version : req.body.version}});
          }

          break;
        default:
          break;
      }
      return res.send({error: null, resultados: { items: result, errors: (errors.length > 0) ? errors : [], imageErrors: imageErrors, imageItems: imageItems }, integrations: integrations, seller, rights: rights.name, type});
    }

    let route = sails.config.views.locals.imgurl;
    let json = [];
    try {
      if (req.body.entity === 'ProductImage') {
        let imageslist = await sails.helpers.fileUpload(req, 'file', 200000000, 'images/products/tmp');
        json = imageslist;
      } else {
        json = await sails.helpers.convertExcel(req, 'file', 2000000);
      }
      return res.view('pages/configuration/import', { layout: 'layouts/admin', error: null, seller: seller, integrations: integrations, resultados: json, rights: rights.name, type: type });
    } catch (err) {
      return res.redirect('/import/'+ seller +'?error=' + err.message);
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
    };
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
          .catch(err => { throw err; });
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
          throw new Error('Ref:' + reference + ' - Carga la imágen en la página de edición del producto.');
        }
      }
      if (req.body.type === 'ProductVariation') {
        prod.reference = req.body.product.reference2 ? req.body.product.reference2.trim().toUpperCase() : '';
        prod.supplierreference = req.body.product.reference.trim();
        prod.ean13 = req.body.product.ean13 ? req.body.product.ean13.toString() : '';
        prod.upc = req.body.product.upc ? parseInt(req.body.product.upc) : 0;
        prod.quantity = req.body.product.quantity ? parseInt(req.body.product.quantity) : 0;
        prod.seller = seller;

        let products = await Product.find({ reference: [prod.supplierreference, prod.supplierreference.toUpperCase()], seller: seller })
          .populate('categories');
        let categories = [];

        if (products.length > 0) {
          for (const product of products) {
            product.categories.forEach(category => {
              if (!categories.includes(category.id)) {
                categories.push(category.id);
              }
            });
            prod.product = product.id;
            prod.price = req.body.product.price;
            let variation = await Variation.find({
              where: { name: req.body.product.variation.replace(',', '.').trim().toLowerCase(), gender: product.gender, seller: product.seller, manufacturer: product.manufacturer, category: { 'in': categories } },
              limit: 1
            });
            if(!variation || variation.length == 0){
              variation = await Variation.create({name:req.body.product.variation.toLowerCase().replace(',','.'),gender: product.gender,seller:product.seller,manufacturer:product.manufacturer,category:product.categories[0].id}).fetch();
            }
            variation = variation.length > 0 ? variation[0] : variation;
            prod.variation = variation.id;
            let pvs = await ProductVariation.find({product:prod.product,supplierreference:[prod.supplierreference, prod.supplierreference.toUpperCase()]}).populate('variation');
            let pv = pvs.find(pv=> pv.variation.name == variation.name);
            if (!pv) {
              await ProductVariation.create(prod).fetch();
            } else {
              await ProductVariation.updateOne({ id: pv.id }).set({
                supplierreference: prod.supplierreference,
                reference: prod.reference,
                ean13: prod.ean13,
                upc: prod.upc,
                quantity: prod.quantity,
                variation: prod.variation,
                product: prod.product,
                price: prod.price,
                seller: prod.seller
              });
            }
            result['items'].push(prod);
          }
        } else {
          throw new Error('Producto principal no localizado');
        }
      }
      if (req.body.type === 'Product') {
        let gen = null;
        prod.reference = req.body.product.reference.trim().toUpperCase();
        prod.name = req.body.product.name.trim().toLowerCase();
        prod.tax = (await Tax.findOne({ value: req.body.product.tax })).id;

        let mainColor = await sails.helpers.tools.findColor(req.body.product.mainColor.trim().toLowerCase());
        if (mainColor.length > 0) { prod.mainColor = mainColor[0]; } else { throw new Error('No logramos identificar el color.'); }
        let brand = await Manufacturer.findOne({ name: req.body.product.manufacturer.trim().toLowerCase() });
        if (brand) { prod.manufacturer = brand.id; } else {
          let manufact = await Manufacturer.create({
            name: req.body.product.manufacturer.trim().toLowerCase(),
            logo: '',
            linioname: 'Generico',
            description: req.body.product.manufacturer.trim(),
            url: req.body.product.manufacturer.trim().toLowerCase(),
            active: false
          });
          prod.manufacturer = manufact.id;
        }
        let gender = await sails.helpers.tools.findGender(req.body.product.gender.trim().toLowerCase());
        if (gender.length > 0) { prod.gender = gender[0]; gen = await Gender.findOne({id:gender[0]});} else { throw new Error('No logramos identificar el género para este producto.'); }
        let eval = req.body.product.active.toLowerCase().trim();
        prod.active = (eval === 'true' || eval === '1' || eval === 'verdadero' || eval === 'si' || eval === 'sí') ? true : false;
        prod.width = parseFloat(req.body.product.width.replace(',', '.'));
        prod.height = parseFloat(req.body.product.height.replace(',', '.'));
        prod.length = parseFloat(req.body.product.length.replace(',', '.'));
        prod.weight = parseFloat(req.body.product.weight.replace(',', '.'));
        prod.seller = seller;
        prod.group = req.body.product.group || '';
        prod.description = req.body.product.description;
        prod.descriptionShort = req.body.product.descriptionShort;

        let categories = await sails.helpers.tools.findCategory(prod.name + ' ' + prod.reference + ' ' + gen.name + ' ' + brand.name);
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
                });
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
            let intlist = [];
            let integrations = await Integrations.find({where:{seller:seller},select:['id']});
            for(let integration of integrations){
              if(!intlist.includes(integration.id)){intlist.push(integration.id);}
            }
            await CatalogDiscount.addToCollection(discount.id,'integrations').members(intlist);
            await sails.helpers.channel.channelSync(product);
            result['items'].push(product);
          }else{
            throw new Error('Producto principal no localizado');
          }
        }
      }
      if(req.body.type === 'Feature'){
        prod.reference = req.body.product.reference ? req.body.product.reference.trim() : '';
        prod.value = req.body.product.value;
        let features = [];
        let productVariation = await ProductVariation.findOne({reference: prod.reference});
        let product = productVariation ? await Product.findOne({id: productVariation.product}).populate('categories') : await Product.findOne({reference: prod.reference}).populate('categories');
        if (product && prod.value) {
          for (let c of product.categories) {
            let cat = await Category.findOne({id: c.id}).populate('features');
            for (let f of cat.features){
              if(!features.some(feat=>feat.id===f.id) && f!=='' && f!== null && f.name === 'registro sanitario'){
                features.push(f);
              }
            }
          }
          if (features.length > 0) {
            let feature = features[0].id;
            let exists = await ProductFeature.findOne({product: product.id, feature:feature});
            if (!exists) {
              await ProductFeature.create({
                product:product.id,
                feature:feature,
                value:prod.value
              });
            } else {
              await ProductFeature.updateOne({product:product.id, feature:feature}).set({
                value:prod.value
              });
            }
            result['items'].push(prod);
          }
        } else {
          throw new Error('Producto principal no localizado');
        }
      }
    } catch (err) {
      if (req.body.type === 'ProductVariation') { result['errors'].push('Ref: ' + prod.supplierreference + '- Variación: ' + req.body.product.variation + ' - ' + err.message); }
      if (req.body.type === 'Product') { result['errors'].push('Ref: ' + prod.reference + ': ' + err.message); }
      if (req.body.type === 'ProductImage') { result['errors'].push('Archivo: ' + req.body.product.original + ': ' + err.message); }
      if (req.body.type === 'Discount') { result['errors'].push('Ref: ' + req.body.product.reference + ': ' + err.message); }
      if (req.body.type === 'Feature') { result['errors'].push('Ref: ' + req.body.product.reference + ': ' + err.message); }
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
    };

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
      prod.description = req.body.product.description.trim();
      prod.descriptionShort = req.body.product.descriptionShort.trim();

      if(req.body.product.manufacturer){
        let brand = await Manufacturer.findOne({ name: req.body.product.manufacturer.toLowerCase() });
        prod.manufacturer = brand.id;
      }else{
        throw new Error('La Marca seleccionada para el producto ' + req.body.product.name + ' no existe');
      }
      let gen = null;
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
        gen = await Gender.findOne({id:prod.gender});
      }

      if (req.body.product.tax) {
        tax = (await Tax.findOne({ value: req.body.product.tax.rate }));
        if(tax)
        {prod.tax = tax.id;}
      } else {
        tax  = (await Tax.findOne({ value: 0 }));
        if(tax)
        {prod.tax = tax.id;}
      }
      prod.active = req.body.product.active || false;
      prod.externalId = req.body.product.externalId || '';
      prod.group = req.body.product.group || '';
      prod.active = req.body.product.active;
      prod.width = (req.body.product.width === undefined || req.body.product.width === null || req.body.product.width < 1) ? 15 : req.body.product.width;
      prod.height = (req.body.product.height === undefined || req.body.product.height === null || req.body.product.height < 1) ? 15 : req.body.product.height;
      prod.length = (req.body.product.length === undefined || req.body.product.length === null || req.body.product.length < 1) ? 32 : req.body.product.length;
      prod.weight = (req.body.product.weight === undefined || req.body.product.weight === null || req.body.product.weight === 0) ? 1 : req.body.product.weight;
      prod.description = req.body.product.description;
      prod.descriptionShort = req.body.product.descriptionShort;
      prod.seller = seller;

      let categories = await sails.helpers.tools.findCategory(prod.name + ' ' + prod.reference + ' ' + gen.name + ' ' + brand.name);
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
              });
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
    req.setTimeout(0);
    let documents = [];
    let channel = await Channel.findOne({name:'iridio'});

    let textClean = async (text) =>{
      text = text.replace(/\n/g, ' ');
      //text = text.replace(/[^\x00-\x7F]/g, '');
      //text=text.replace(/&(nbsp|amp|quot|lt|gt);/g,' '); //Caracteres HTML
      text=text.replace(/[^\u0009\u000a\u000d\u0020-\uD7FF\uE000-\uFFFD]/ig,'');
      text=text.replace( /(<([^>]+)>)/ig, ''); // Etiquetas HTML
      //text=text.replace(/[&\/\\#,+()$~%.'":*?<>{}]/g,''); //Caracteres Especiales
      text=text.trim(); //Espacios Extra
      return JSON.stringify(text);
    };

    let products = await ProductChannel.find({channel:channel.id}).populate('product');
    products = products.filter(p => p.product && p.product.active);

    for(let pr of products){
      let doc = {
        type: req.param('action'), // add or delete
        id: pr.product.id
      };

      pr.product.manufacturer = pr.product.manufacturer ? await Manufacturer.findOne({id:pr.product.manufacturer}) : '';
      pr.product.mainColor = pr.product.mainColor ? await Color.findOne({id:pr.product.mainColor}) : '';
      pr.product.gender = pr.product.gender ? await Gender.findOne({id:pr.product.gender}) : '';
      pr.product.seller = pr.product.seller ? await Seller.findOne({id:pr.product.seller}) : '';
      pr.product.mainCategory = pr.product.mainCategory ? await Category.findOne({id:pr.product.mainCategory}) : '';

      if (req.param('action') === 'add') {
        doc['fields'] = {
          id: pr.product.id,
          name: pr.product.name,
          reference: pr.product.reference,
          description: pr.product.description ? await textClean(pr.product.description) : '',
          shortdescription: pr.product.descriptionShort ? await textClean(pr.product.descriptionShort) : '',
          brand: pr.product.manufacturer && pr.product.manufacturer.name ? pr.product.manufacturer.name : '',
          color: pr.product.mainColor && pr.product.mainColor.name ? pr.product.mainColor.name : '',
          gender: pr.product.gender && pr.product.gender.name ? pr.product.gender.name : '',
          seller: pr.product.seller && pr.product.seller.name ? pr.product.seller.name : '',
          category: pr.product.mainCategory && pr.product.mainCategory.name ? pr.product.mainCategory.name : ''
        };
      }

      Object.keys(doc.fields).forEach((k) => !doc.fields[k] ? delete doc.fields[k] : doc.fields[k]);

      documents.push(doc);

    }

    let AWS = require('aws-sdk');
    AWS.config.loadFromPath('./config.json');
    let endpoint = 'doc-iridio-kqxoxbqunm62wui765a5ms5nca.us-east-1.cloudsearch.amazonaws.com';
    var csd = new AWS.CloudSearchDomain({ endpoint: endpoint });
    var params = {
      contentType: 'application/json', // required
      documents: JSON.stringify(documents) // required
    };
    csd.uploadDocuments(params, (err, data) => {
      if (err) { console.log(err, err.stack); return res.redirect('/inicio');} // an error occurred
      let index = new AWS.CloudSearch();
      index.indexDocuments({ DomainName: 'iridio' }, (err, data) => {
        if (err) { console.log(err); }
        return res.redirect('/inicio');
      });
    });
  },
  multiple: async (req, res) => {
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if (rights.name !== 'superadmin' && !_.contains(rights.permissions, 'createproduct')) {
      throw 'forbidden';
    }
    let seller = req.param('seller') ? req.param('seller') : req.session.user.seller;
    let integrations = await Integrations.find({ seller: seller }).populate('channel');
    let error = req.param('error') ? req.param('error') : null;
    return res.view('pages/configuration/multiple', { layout: 'layouts/admin',seller,error,integrations});
  },
  multipleexecute: async (req, res) => {
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if (rights.name !== 'superadmin' && !_.contains(rights.permissions, 'createproduct')) {
      throw 'forbidden';
    }
    var jsonxml = require('jsontoxml');
    let sid = sails.sockets.getId(req);
    let seller = (req.body.seller && req.body.seller !== null || req.body.seller !== '' || req.body.seller !== undefined) ? req.body.seller : req.session.user.seller;
    let integration = await Integrations.findOne({id: req.body.integrationId}).populate('channel');
    let priceAdjust = integration.priceAdjustment || 0;
    let channel = integration.channel.name;
    let result = null;
    let response = { items: [], errors: [] };
    let products = [];
    let action = '';
    let body={Request:[]};
    const pageSize = req.body.action === 'ProductQcStatus' ? 100 :  req.body.action === 'ProductCreate' ? 4000 : 1500;
    try {
      if (channel === 'dafiti') {
        const intgrationId = integration.id;
        let resultProducts = await Product.find({seller: seller})
        .populate('channels',{
          where:{
            channel: integration.channel.id,
            integration: intgrationId
          },
          limit: 1
        })
        .populate('gender')
        .populate('manufacturer')
        .populate('seller');

        if (req.body.action === 'ProductCreate') {
          for (const product of resultProducts) {
            let checkProduct = await sails.helpers.checkContentProduct(product);
            if (checkProduct) {
              products.push(product);
            }
          }
        }
        switch (req.body.action) {
          case 'ProductCreate':
            action = 'ProductCreate';
            products = products.filter(pro => pro.channels.length === 0 || (pro.channels.length > 0 && pro.channels[0].iscreated === false));
            break;
          case 'ProductUpdate':
            action = 'ProductUpdate';
            products = products.filter(pro => pro.channels.length > 0);
            break;
          case 'Image':
            action = 'Image';
            products = products.filter(pro => pro.channels.length > 0);
            break;
          case 'ProductQcStatus':
            action = 'ProductQcStatus';
            products = products.filter(pro => pro.channels.length > 0 && pro.channels[0].iscreated && (!pro.channels[0].qc || pro.channels[0].reason !== ''));
            break;
        }
        if (products.length > 0) {
          if(action === 'Image'){
            let imgsign = await sails.helpers.channel.dafiti.sign(integration.id, 'Image', seller);
            let imgresult = await sails.helpers.channel.dafiti.images(products, integration.id);
            let number = Math.ceil(imgresult.Request.length / pageSize);
            for (let i = 1; i <= number; i++) {
              body.Request = imgresult.Request.slice((number - i) * pageSize, (number - (i-1)) * pageSize);
              const imgxml = jsonxml(body,true);
              setTimeout(async () => {await sails.helpers.request(integration.channel.endpoint,'/?'+imgsign,'POST',imgxml);}, 5000);
            }
            for (const pro of products) {
              response.items.push(pro);
            }
          } else if(action === 'ProductQcStatus'){
            const skus = [];
            for (const product of products) {
              const productVariations = await ProductVariation.find({product: product.id});
              for (const variation of productVariations) {
                if(!skus.includes(variation.id)){
                  skus.push(variation.id);
                }
              }
              response.items.push(product);
            }
            let number = Math.ceil(skus.length / pageSize);
            for (let i = 1; i <= number; i++) {
              const resultSkus = skus.slice((number - i) * pageSize, (number - (i-1)) * pageSize);
              await sails.helpers.channel.productQc(integration, resultSkus);
            }
          }else{
            let result = [];
            if(req.body.action === 'ProductCreate'){ result = await sails.helpers.channel.dafiti.product(products, integration, priceAdjust, 'active');}
            if(req.body.action === 'ProductUpdate'){ result = await sails.helpers.channel.dafiti.product(products, integration, priceAdjust, 'active',false);}

            let pageNumber = Math.ceil(result.Request.length / pageSize);
            for (let i = 1; i <= pageNumber; i++) {
              body.Request = result.Request.slice((pageNumber - i) * pageSize, (pageNumber - (i-1)) * pageSize);
              const xml = jsonxml(body,true);
              let sign = await sails.helpers.channel.dafiti.sign(intgrationId, action, seller);
              await sails.helpers.request(integration.channel.endpoint,'/?'+sign,'POST', xml)
              .then(async (resData)=>{
                if (resData) {
                  resData = JSON.parse(resData);
                  if(resData.SuccessResponse){
                    for (const pro of products) {
                      const productChannelId = pro.channels.length > 0 ? pro.channels[0].id : '';
                      if(action === 'ProductCreate'){
                        await ProductChannel.findOrCreate({id: productChannelId},{
                          product:pro.id,
                          integration:integration.id,
                          channel:integration.channel.id,
                          channelid:'',
                          status:false,
                          qc:false,
                          price:priceAdjust,
                          iscreated:false,
                          socketid:sid
                        }).exec(async (err, record, created)=>{
                          if(err){return new Error(err.message);}
                          if(!created){
                            await ProductChannel.updateOne({id: record.id}).set({
                              price:priceAdjust,
                              socketid:sid
                            });
                          }
                        });
                      }
                      if(action === 'ProductUpdate'){
                        await ProductChannel.updateOne({ product: pro.id, integration:integration.id }).set({ status: true, price:priceAdjust});
                      }
                      response.items.push(pro);
                    }
                  }else{
                    throw new Error (resData.ErrorResponse.Head.ErrorMessage || 'Error en el proceso, Intenta de nuevo más tarde.');
                  }
                } else {
                  throw new Error ('Error en el proceso, Intenta de nuevo más tarde.');
                }
              })
              .catch(err =>{
                throw new Error (err || 'Error en el proceso, Intenta de nuevo más tarde.');
              });
            }
          }
        } else {
          throw new Error('Sin Productos para Procesar');
        }
      }
      if (channel === 'linio') {
        const intgrationId = integration.id;
        products = await Product.find({seller: seller}).populate('channels',{
          where:{
            channel: integration.channel.id,
            integration: intgrationId
          },
          limit: 1
        })
        .populate('gender')
        .populate('manufacturer')
        .populate('seller');

        if (req.body.action === 'ProductCreate') {
          for (const product of resultProducts) {
            let checkProduct = await sails.helpers.checkContentProduct(product);
            if (checkProduct) {
              products.push(product);
            }
          }
        }
        switch (req.body.action) {
          case 'ProductCreate':
            action = 'ProductCreate';
            products = products.filter(pro => pro.channels.length === 0 || (pro.channels.length > 0 && pro.channels[0].iscreated === false));
            break;
          case 'ProductUpdate':
            action = 'ProductUpdate';
            products = products.filter(pro => pro.channels.length > 0 /*&& pro.channels[0].iscreated*/);
            break;
          case 'Image':
            action = 'Image';
            products = products.filter(pro => pro.channels.length > 0);
            break;
          case 'ProductQcStatus':
            action = 'ProductQcStatus';
            products = products.filter(pro => pro.channels.length > 0 && pro.channels[0].iscreated && (!pro.channels[0].qc || pro.channels[0].reason !== ''));
            break;
        }

        if (products.length > 0) {
          if(action === 'Image'){
            let imgsign = await sails.helpers.channel.dafiti.sign(integration.id, 'Image', seller);
            let imgresult = await sails.helpers.channel.dafiti.images(products, integration.id);
            let number = Math.ceil(imgresult.Request.length / pageSize);
            for (let i = 1; i <= number; i++) {
              body.Request = imgresult.Request.slice((number - i) * pageSize, (number - (i-1)) * pageSize);
              const imgxml = jsonxml(body,true);
              setTimeout(async () => {await sails.helpers.request(integration.channel.endpoint,'/?'+imgsign,'POST',imgxml);}, 5000);
            }
            for (const pro of products) {
              response.items.push(pro);
            }
          }else if(action === 'ProductQcStatus'){
            const skus = [];
            for (const product of products) {
              const productVariations = await ProductVariation.find({product: product.id});
              for (const variation of productVariations) {
                if(!skus.includes(variation.id)){
                  skus.push(variation.id);
                }
              }
              response.items.push(product);
            }
            let number = Math.ceil(skus.length / pageSize);
            for (let i = 1; i <= number; i++) {
              const resultSkus = skus.slice((number - i) * pageSize, (number - (i-1)) * pageSize);
              await sails.helpers.channel.productQc(integration, resultSkus);
            }
          }else{
            let result = [];
            if(req.body.action === 'ProductCreate'){ result = await sails.helpers.channel.linio.product(products, integration, priceAdjust, 'active');}
            if(req.body.action === 'ProductUpdate'){ result = await sails.helpers.channel.linio.product(products, integration, priceAdjust, 'active',false);}

            let pageNumber = Math.ceil(result.Request.length / pageSize);
            for (let i = 1; i <= pageNumber; i++) {
              body.Request = result.Request.slice((pageNumber - i) * pageSize, (pageNumber - (i-1)) * pageSize);
              const xml = jsonxml(body,true);
              let sign = await sails.helpers.channel.linio.sign(intgrationId, action, seller);
              await sails.helpers.request(integration.channel.endpoint,'/?'+sign,'POST', xml)
              .then(async (resData)=>{
                resData = JSON.parse(resData);
                if(resData.SuccessResponse){
                  for (const pro of products) {
                    const productChannelId = pro.channels.length > 0 ? pro.channels[0].id : '';
                    if(action === 'ProductCreate'){
                      await ProductChannel.findOrCreate({id: productChannelId},{
                        product:pro.id,
                        integration:integration.id,
                        channel:integration.channel.id,
                        channelid:'',
                        status:false,
                        qc:false,
                        price:priceAdjust,
                        iscreated:false,
                        socketid:sid
                      }).exec(async (err, record, created)=>{
                        if(err){return new Error(err.message);}
                        if(!created){
                          await ProductChannel.updateOne({id: record.id}).set({
                            price:priceAdjust,
                            socketid:sid
                          });
                        }
                      });
                    }
                    if(action === 'ProductUpdate'){
                      await ProductChannel.updateOne({ product: pro.id, integration:integration.id }).set({ status: true, price:priceAdjust});
                    }
                    response.items.push(pro);
                  }
                }else{
                  throw new Error (resData.ErrorResponse.Head.ErrorMessage || 'Error en el proceso, Intenta de nuevo más tarde.');
                }
              })
              .catch(err =>{
                throw new Error (err || 'Error en el proceso, Intenta de nuevo más tarde.');
              });
            }
          }
        } else {
          throw new Error('Sin Productos para Procesar');
        }
      }
      if (channel === 'liniomx') {
        const intgrationId = integration.id;
        products = await Product.find({seller: seller}).populate('channels',{
          where:{
            channel: integration.channel.id,
            integration: intgrationId
          },
          limit: 1
        })
        .populate('gender')
        .populate('manufacturer')
        .populate('seller');

        if (req.body.action === 'ProductCreate') {
          for (const product of resultProducts) {
            let checkProduct = await sails.helpers.checkContentProduct(product);
            if (checkProduct) {
              products.push(product);
            }
          }
        }

        switch (req.body.action) {
          case 'ProductCreate':
            action = 'ProductCreate';
            products = products.filter(pro => pro.channels.length === 0 || (pro.channels.length > 0 && pro.channels[0].iscreated === false));
            break;
          case 'ProductUpdate':
            action = 'ProductUpdate';
            products = products.filter(pro => pro.channels.length > 0 /*&& pro.channels[0].iscreated*/);
            break;
          case 'Image':
            action = 'Image';
            products = products.filter(pro => pro.channels.length > 0);
            break;
          case 'ProductQcStatus':
            action = 'ProductQcStatus';
            products = products.filter(pro => pro.channels.length > 0 && pro.channels[0].iscreated && (!pro.channels[0].qc || pro.channels[0].reason !== ''));
            break;
        }

        if (products.length > 0) {
          if(action === 'Image'){
            let imgsign = await sails.helpers.channel.dafiti.sign(integration.id, 'Image', seller);
            let imgresult = await sails.helpers.channel.dafiti.images(products, integration.id);
            let number = Math.ceil(imgresult.Request.length / pageSize);
            for (let i = 1; i <= number; i++) {
              body.Request = imgresult.Request.slice((number - i) * pageSize, (number - (i-1)) * pageSize);
              const imgxml = jsonxml(body,true);
              setTimeout(async () => {await sails.helpers.request(integration.channel.endpoint,'/?'+imgsign,'POST',imgxml);}, 5000);
            }
            for (const pro of products) {
              response.items.push(pro);
            }
          }else if(action === 'ProductQcStatus'){
            const skus = [];
            for (const product of products) {
              const productVariations = await ProductVariation.find({product: product.id});
              for (const variation of productVariations) {
                if(!skus.includes(variation.id)){
                  skus.push(variation.id);
                }
              }
              response.items.push(product);
            }
            let number = Math.ceil(skus.length / pageSize);
            for (let i = 1; i <= number; i++) {
              const resultSkus = skus.slice((number - i) * pageSize, (number - (i-1)) * pageSize);
              await sails.helpers.channel.productQc(integration, resultSkus);
            }
          }else{
            let result = [];
            if(req.body.action === 'ProductCreate'){ result = await sails.helpers.channel.liniomx.product(products, integration, priceAdjust, 'active');}
            if(req.body.action === 'ProductUpdate'){ result = await sails.helpers.channel.liniomx.product(products, integration, priceAdjust, 'active',false);}

            let pageNumber = Math.ceil(result.Request.length / pageSize);
            for (let i = 1; i <= pageNumber; i++) {
              body.Request = result.Request.slice((pageNumber - i) * pageSize, (pageNumber - (i-1)) * pageSize);
              const xml = jsonxml(body,true);
              let sign = await sails.helpers.channel.liniomx.sign(intgrationId, action, seller);
              await sails.helpers.request(integration.channel.endpoint,'/?'+sign,'POST', xml)
              .then(async (resData)=>{
                resData = JSON.parse(resData);
                if(resData.SuccessResponse){
                  for (const pro of products) {
                    const productChannelId = pro.channels.length > 0 ? pro.channels[0].id : '';
                    if(action === 'ProductCreate'){
                      await ProductChannel.findOrCreate({id: productChannelId},{
                        product:pro.id,
                        integration:integration.id,
                        channel:integration.channel.id,
                        channelid:'',
                        status:false,
                        qc:false,
                        price:priceAdjust,
                        iscreated:false,
                        socketid:sid
                      }).exec(async (err, record, created)=>{
                        if(err){return new Error(err.message);}
                        if(!created){
                          await ProductChannel.updateOne({id: record.id}).set({
                            price:priceAdjust,
                            socketid:sid
                          });
                        }
                      });
                    }
                    if(action === 'ProductUpdate'){
                      await ProductChannel.updateOne({ product: pro.id, integration:integration.id }).set({ status: true, price:priceAdjust});
                    }
                    response.items.push(pro);
                  }
                }else{
                  throw new Error (resData.ErrorResponse.Head.ErrorMessage || 'Error en el proceso, Intenta de nuevo más tarde.');
                }
              })
              .catch(err =>{
                throw new Error (err || 'Error en el proceso, Intenta de nuevo más tarde.');
              });
            }
          }
        } else {
          throw new Error('Sin Productos para Procesar');
        }
      }
      if (channel === 'mercadolibre' && req.body.action !== 'ProductQcStatus') {
        const intgrationId = integration.id;
        let products = await Product.find({seller: seller}).populate('channels',{
          where:{
            channel: integration.channel.id,
            integration: intgrationId
          },
          limit: 1
        })
        .populate('gender')
        .populate('manufacturer')
        .populate('seller');

        if (req.body.action === 'ProductCreate') {
          for (const product of resultProducts) {
            let checkProduct = await sails.helpers.checkContentProduct(product);
            if (checkProduct) {
              products.push(product);
            }
          }
        }

        switch (req.body.action) {
          case 'ProductCreate':
            action = 'Post';
            products = products.filter(pro => pro.channels.length === 0 || pro.channels[0].channelid === '');
            break;
          case 'ProductUpdate':
            action = 'Update';
            products = products.filter(pro => pro.channels.length > 0 && pro.channels[0].channelid !== '');
            break;
          case 'Image':
            action = 'Update';
            products = products.filter(pro => pro.channels.length > 0 && pro.channels[0].status === true && pro.channels[0].channelid !== '');
            break;
        }
        if (products.length > 0) {
          let integration = await sails.helpers.channel.mercadolibre.sign(intgrationId);
          for (let pl of products) {
            const mlprice = priceAdjust;
            const mlid = pl.channels.length > 0 ? pl.channels[0].channelid : '';
            const productChannelId = pl.channels.length > 0 ? pl.channels[0].id : '';
            let body = await sails.helpers.channel.mercadolibre.product(pl.id,action,integration.id, mlprice)
            .tolerate(async (err) => {
              response.errors.push('REF: '+pl.reference+' No creado en Mercadolibre: '+ err.message);
            });
            if(body){
              if(action==='Update'){
                result = await sails.helpers.channel.mercadolibre.request('items/'+mlid,integration.channel.endpoint,integration.secret, body,'PUT')
                .tolerate((err)=>{response.errors.push('REF: '+pl.reference+' No creado en Mercadolibre: '+ err.message);});
                if(result){
                  response.items.push(body);
                  await ProductChannel.updateOne({ id: productChannelId }).set({
                    status:true,
                    price:mlprice,
                    qc:true,
                    reason: ''
                  });
                }
              }
              if(action==='Post'){
                result = await sails.helpers.channel.mercadolibre.request('items',integration.channel.endpoint,integration.secret, body,'POST')
                .tolerate((err)=>{
                  response.errors.push('REF: '+pl.reference+' No creado en Mercadolibre: '+ err.message);
                });
                if(result && result.id){
                  await ProductChannel.findOrCreate({id: productChannelId},{
                    product:pl.id,
                    channel:integration.channel.id,
                    integration:integration.id,
                    channelid:result.id,
                    status:true,
                    qc:true,
                    iscreated: true,
                    price:mlprice
                  }).exec(async (err, record, created)=>{
                    if(err){return new Error(err.message);}
                    if(!created){
                      await ProductChannel.updateOne({id: record.id}).set({
                        channelid:result.id,
                        price:mlprice
                      });
                    }
                  });
                  await sails.helpers.channel.mercadolibre.request(`items/${result.id}/description`,integration.channel.endpoint,integration.secret, body.description,'POST');
                  response.items.push(body);
                }
              }
            }
          }
        } else {
          throw new Error('Sin Productos para Procesar');
        }
      }
      if (channel === 'mercadolibremx' && req.body.action !== 'ProductQcStatus') {
        const intgrationId = integration.id;
        let products = await Product.find({seller: seller}).populate('channels',{
          where:{
            channel: integration.channel.id,
            integration: intgrationId
          },
          limit: 1
        })
        .populate('gender')
        .populate('manufacturer')
        .populate('seller');

        if (req.body.action === 'ProductCreate') {
          for (const product of resultProducts) {
            let checkProduct = await sails.helpers.checkContentProduct(product);
            if (checkProduct) {
              products.push(product);
            }
          }
        }

        switch (req.body.action) {
          case 'ProductCreate':
            action = 'Post';
            products = products.filter(pro => pro.channels.length === 0 || pro.channels[0].channelid === '');
            break;
          case 'ProductUpdate':
            action = 'Update';
            products = products.filter(pro => pro.channels.length > 0 && pro.channels[0].channelid !== '');
            break;
          case 'Image':
            action = 'Update';
            products = products.filter(pro => pro.channels.length > 0 && pro.channels[0].status === true && pro.channels[0].channelid !== '');
            break;
        }
        if (products.length > 0) {
          let integration = await sails.helpers.channel.mercadolibremx.sign(intgrationId);
          for (let pl of products) {
            const mlprice = priceAdjust;
            const mlid = pl.channels.length > 0 ? pl.channels[0].channelid : '';
            const productChannelId = pl.channels.length > 0 ? pl.channels[0].id : '';
            let body = await sails.helpers.channel.mercadolibremx.product(pl.id,action,integration.id, mlprice)
            .tolerate(async (err) => {
              response.errors.push('REF: '+pl.reference+' No creado en Mercadolibre: '+ err.message);
            });
            if(body){
              if(action==='Update'){
                result = await sails.helpers.channel.mercadolibremx.request('items/'+mlid,integration.channel.endpoint,integration.secret, body,'PUT')
                .tolerate((err)=>{response.errors.push('REF: '+pl.reference+' No creado en Mercadolibre: '+ err.message);});
                if(result){
                  response.items.push(body);
                  await ProductChannel.updateOne({ id: productChannelId }).set({
                    status:true,
                    price:mlprice,
                    qc:true,
                    reason: ''
                  });
                }
              }
              if(action==='Post'){
                result = await sails.helpers.channel.mercadolibremx.request('items',integration.channel.endpoint,integration.secret, body,'POST')
                .tolerate((err)=>{
                  response.errors.push('REF: '+pl.reference+' No creado en Mercadolibre: '+ err.message);
                });
                if(result && result.id){
                  await ProductChannel.findOrCreate({id: productChannelId},{
                    product:pl.id,
                    channel:integration.channel.id,
                    integration:integration.id,
                    channelid:result.id,
                    status:true,
                    qc:true,
                    iscreated: true,
                    price:mlprice
                  }).exec(async (err, record, created)=>{
                    if(err){return new Error(err.message);}
                    if(!created){
                      await ProductChannel.updateOne({id: record.id}).set({
                        channelid:result.id,
                        price:mlprice
                      });
                    }
                  });
                  await sails.helpers.channel.mercadolibremx.request(`items/${result.id}/description`,integration.channel.endpoint,integration.secret, body.description,'POST');
                  response.items.push(body);
                }
              }
            }
          }
        } else {
          throw new Error('Sin Productos para Procesar');
        }
      }
      if (channel === 'coppel' && req.body.action !== 'ProductQcStatus') {

        let axios = require('axios');
        let fs = require('fs');
        let FormData = require('form-data');
        let result;

        const intgrationId = integration.id;

        let products = await Product.find({seller: seller, active: true}).populate('channels',{
          where:{
            channel: integration.channel.id,
            integration: intgrationId
          },
          limit: 1
        })
        .populate('gender')
        .populate('manufacturer')
        .populate('seller');

        if (req.body.action === 'ProductCreate') {
          for (const product of resultProducts) {
            let checkProduct = await sails.helpers.checkContentProduct(product);
            if (checkProduct) {
              products.push(product);
            }
          }
        }

        switch (req.body.action) {
          case 'ProductCreate':
            action = 'Post';
            products = products.filter(pro => pro.channels.length === 0 || pro.channels[0].channelid === '');
            break;
          case 'ProductUpdate':
            action = 'Update';
            products = products.filter(pro => pro.channels.length > 0 && pro.channels[0].channelid !== '');
            break;
          case 'Image':
            action = 'Image';
            products = products.filter(pro => pro.channels.length > 0 && pro.channels[0].status === true && pro.channels[0].channelid !== '');
            break;
        }
        if (products.length > 0) {
          for (let pl of products) {
            let productvariations = await ProductVariation.find({product:pl.id}).populate('variation');
            const cpprice = pl.channels.length > 0 ? pl.channels[0].price : 0;
            const cpid = pl.channels.length > 0 ? pl.channels[0].channelid : '';
            const cpstatus = pl.channels.length > 0 ? pl.channels[0].status : false;
            const productChannelId = pl.channels.length > 0 ? pl.channels[0].id : '';
            if(productvariations.length===1){
              if(action==='Update'){
                let body = await sails.helpers.channel.coppel.product(pl.id, 'Update', cpprice, cpstatus)
                .intercept((err) => {return new Error(err.message);});
                options = {
                  method: 'post',
                  url: `${integration.channel.endpoint}api/offers`,
                  headers: {
                    'Authorization':`${integration.key}`,
                    'content-type': `application/json`,
                    accept: 'application/json'
                  },
                  data:body
                };
                let response_offer = await axios(options).catch((e) => {
                  result=e.response.data.message?e.response.data.message:e.response.data;
                  response.errors.push('REF: '+pl.reference+' no actualizado en Coppel: '+ result);
                });
                if(response_offer){
                  response.items.push(response_offer.data.import_id);
                  await ProductChannel.updateOne({id: productChannelId}).set({
                    channelid:response_offer.data.import_id,
                    status:true,
                    price:cpprice
                  });
                }
              }
              if(action==='Post'){
                options = {
                  method: 'get',
                  url: `${integration.channel.endpoint}api/products?product_references=EAN|${pl.id}`,
                  headers: {
                    'Authorization':`${integration.key}`,
                    accept: 'application/json'
                  }
                };
                let created = await axios(options).catch((e) => {result=e.response;});
                if(created){
                  if(created.data.total_count === 0){
                    await sails.helpers.channel.coppel.product(pl.id, action, cpprice, cpstatus)
                    .intercept((err) => {return new Error(err.message);});
                    let file = new FormData();
                    file.append('file',fs.createReadStream('./.tmp/uploads/product.xlsx'));
                    options = {
                      method: 'post',
                      url: `${integration.channel.endpoint}api/products/imports`,
                      headers: {
                        'Authorization':`${integration.key}`,
                        'content-type': `multipart/form-data; boundary=${file._boundary}`,
                        accept: 'application/json'
                      },
                      data:file
                    };
                    await axios(options).catch((e) => {result=e.response; console.log(result);});
                  }

                  await sails.helpers.channel.coppel.product(pl.id, 'Offer', cpprice, cpstatus)
                  .intercept((err) => {return new Error(err.message);});
                  file = new FormData();
                  file.append('file',fs.createReadStream('./.tmp/uploads/product.xlsx'));
                  file.append('import_mode','NORMAL');
                  options = {
                    method: 'post',
                    url: `${integration.channel.endpoint}api/offers/imports`,
                    headers: {
                      'Authorization':`${integration.key}`,
                      'content-type': `multipart/form-data; boundary=${file._boundary}`,
                      accept: 'application/json'
                    },
                    data:file
                  };
                  let response_offer = await axios(options).catch((e) => {
                    result=e.response.data.message?e.response.data.message:e.response.data;
                    response.errors.push('REF: '+pl.reference+' no creado en Coppel: '+ result);
                  });



                  await ProductChannel.findOrCreate({id: productChannelId},{
                    product:pl.id,
                    channel:integration.channel.id,
                    integration:integration.id,
                    channelid:response_offer.data.import_id,
                    status:true,
                    qc:true,
                    price:cpprice
                  }).exec(async (err, record, created)=>{
                    if(err){return new Error(err.message);}

                    if(!created){
                      await ProductChannel.updateOne({id: record.id}).set({
                        channelid:response_offer.data.import_id,
                        status:true,
                        price:cpprice
                      });
                    }
                  });

                  response.items.push(response_offer.data.import_id);
                }
              }
              if(action==='Image'){
                await sails.helpers.channel.coppel.product(pl.id, 'Post', cpprice, cpstatus)
                .intercept((err) => {return new Error(err.message);});
                let file = new FormData();
                file.append('file',fs.createReadStream('./.tmp/uploads/product.xlsx'));
                options = {
                  method: 'post',
                  url: `${integration.channel.endpoint}api/products/imports`,
                  headers: {
                    'Authorization':`${integration.key}`,
                    'content-type': `multipart/form-data; boundary=${file._boundary}`,
                    accept: 'application/json'
                  },
                  data:file
                };
                let response_product = await axios(options).catch((e) => {
                  result=e.response.data.message?e.response.data.message:e.response.data;
                  response.errors.push('REF: '+pl.reference+' no actualizado en Coppel: '+ result);
                });
                if(response_product){
                  response.items.push(response_product.data.import_id);
                  await ProductChannel.updateOne({id: productChannelId}).set({
                    channelid:response_product.data.import_id,
                    status:true,
                    price:cpprice
                  });
                }
              }
            }
          }
        } else {
          throw new Error('Sin Productos para Procesar');
        }
      }
      if(channel ==='iridio' && req.body.action==='ProductCreate'){
        products = await Product.find({seller: seller}).populate('channels',{
          where:{
            channel: integration.channel.id,
            integration: integration.id
          }
        })
        .populate('gender')
        .populate('manufacturer')
        .populate('seller');

        if (req.body.action === 'ProductCreate') {
          for (const product of resultProducts) {
            let checkProduct = await sails.helpers.checkContentProduct(product);
            if (checkProduct) {
              products.push(product);
            }
          }
        }

        products = products.filter(pro => pro.channels.length<1);
        if(products.length>0){
          for (let pro of products) {
            await ProductChannel.create({
              product:pro.id,
              integration:integration.id,
              channel:integration.channel.id,
              channelid:'',
              status:true,
              qc:true,
              price:0,
              iscreated:true,
              socketid:sid
            });
            response.items.push(pro);
          }
        }
      }
      if (channel === 'walmart') {
        const intgrationId = integration.id;
        let products = await Product.find({seller: seller, active: true}).populate('channels',{
          where:{
            channel: integration.channel.id,
            integration: intgrationId
          },
          limit: 1
        })
        .populate('gender')
        .populate('manufacturer')
        .populate('seller');

        if (req.body.action === 'ProductCreate') {
          for (const product of resultProducts) {
            let checkProduct = await sails.helpers.checkContentProduct(product);
            if (checkProduct) {
              products.push(product);
            }
          }
        }

        let error;
        let axios = require('axios');

        switch (req.body.action) {
          case 'ProductCreate':
            action = 'ProductCreate';
            products = products.filter(pro => pro.channels.length === 0 || (pro.channels.length > 0 && pro.channels[0].iscreated === false));
            break;
          case 'ProductUpdate':
            action = 'ProductUpdate';
            products = products.filter(pro => pro.channels.length > 0 && pro.channels[0].iscreated);
            break;
          case 'Image':
            action = 'ProductUpdateImage';
            products = products.filter(pro => pro.channels.length > 0 && pro.channels[0].iscreated);
            break;
        }
        if (products.length > 0) {
          for (let pl of products) {
            const wmprice = pl.channels.length > 0 ? pl.channels[0].price : 0;
            const productChannelId = pl.channels.length > 0 ? pl.channels[0].id : '';

            let xml = await sails.helpers.channel.walmart.product([pl], wmprice, wmprice, action, integration.channel.id)
            .tolerate(async (err) => {
              response.errors.push('REF: '+pl.reference+' no ha sido mapeado: '+ err);
            });

            if(xml){
              const buffer_xml = Buffer.from(xml);

              let token = await sails.helpers.channel.walmart.sign(integration);

              let auth = `${integration.user}:${integration.key}`;
              const buferArray = Buffer.from(auth);
              let encodedAuth = buferArray.toString('base64');

              let options = {
                method: 'post',
                url: `${integration.channel.endpoint}/v3/feeds?feedType=item`,
                headers: {
                  'content-type': `application/xml`,
                  accept: 'application/json',
                  'WM_MARKET' : 'mx',
                  'WM_SEC.ACCESS_TOKEN':token,
                  'WM_SVC.NAME' : 'Walmart Marketplace',
                  'WM_QOS.CORRELATION_ID': '11111111',
                  'Authorization': `Basic ${encodedAuth}`
                },
                data:buffer_xml
              };

              let response_xml = await axios(options).catch((e) => {error=e; console.log(e);});

              if (response_xml){
                await ProductChannel.findOrCreate({id: productChannelId},{
                  product: pl.id,
                  integration: intgrationId,
                  channel : integration.channel.id,
                  channelid: response_xml.data.feedId,
                  status: false,
                  iscreated:false,
                  qc:false,
                  price: wmprice ? parseFloat(wmprice) : 0
                }).exec(async (err, record, created)=>{
                  if(err){return new Error(err.message);}
                  if(!created){
                    await ProductChannel.updateOne({id: record.id}).set({
                      price: wmprice ? parseFloat(wmprice) : 0
                    });
                  }
                });
                response.items.push(response_xml.data.feedId);
              }else{
                await ProductChannel.updateOne({ product:pl.id , integration:intgrationId }).set(
                  {
                    status: false,
                    price: 0
                  }
                );
                response.errors.push('REF: '+pl.reference+' no ha sido eviado: '+ error.error.description);
              }
            }
          }
        } else {
          throw new Error('Sin Productos para Procesar');
        }
      }
      if (channel === 'shopee' && req.body.action !== 'ProductQcStatus') {
        const intgrationId = integration.id;
        let variations = null;
        let products = await Product.find({seller: seller}).populate('channels',{
          where:{
            channel: integration.channel.id,
            integration: intgrationId
          },
          limit: 1
        })
        .populate('gender')
        .populate('manufacturer')
        .populate('seller');

        if (req.body.action === 'ProductCreate') {
          for (const product of resultProducts) {
            let checkProduct = await sails.helpers.checkContentProduct(product);
            if (checkProduct) {
              products.push(product);
            }
          }
        }

        switch (req.body.action) {
          case 'ProductCreate':
            action = 'Post';
            products = products.filter(pro => pro.channels.length === 0 || pro.channels[0].channelid === '');
            break;
          case 'ProductUpdate':
            action = 'Update';
            products = products.filter(pro => pro.channels.length > 0 && pro.channels[0].channelid !== '');
            break;
        }
        if (products.length > 0) {
          for (let pl of products) {
            const shopeePrice = priceAdjust;
            const shopeeId = pl.channels.length > 0 ? pl.channels[0].channelid : '';
            const productChannelId = pl.channels.length > 0 ? pl.channels[0].id : '';
            let body = await sails.helpers.channel.shopee.product(pl.id, action, integration, parseFloat(shopeePrice))
            .tolerate(async (err) => {
              response.errors.push('REF: '+pl.reference+' No creado en Shopee: '+ err.message);
            });
            if(body){
              variations = body.variations;
              delete variations;
              if(action==='Update'){
                body.item_id = parseInt(shopeeId);
                let response = await sails.helpers.channel.shopee.request('/api/v2/product/update_item',integration.channel.endpoint,[`shop_id=${parseInt(integration.shopid)}`,`access_token=${integration.secret}`],body,'POST')
                .tolerate((err)=>{response.errors.push('REF: '+pl.reference+' No creado en Shopee: '+ err.message);});
                if (response && !response.error) {
                  await sails.helpers.channel.shopee.updateModel(integration, parseInt(productchannel.channelid), variations);
                  await ProductChannel.updateOne({id: productChannelId}).set({
                    status: true,
                    qc: true,
                    price: shopeePrice,
                    reason: ''
                  });
                } else {
                  response.errors.push('REF: '+pl.reference+' No creado en Shopee: '+ err.message);
                }
              }
              if(action==='Post'){
                let responseItem = await sails.helpers.channel.shopee.request('/api/v2/product/add_item',integration.channel.endpoint,[`shop_id=${parseInt(integration.shopid)}`,`access_token=${integration.secret}`],body,'POST')
                .tolerate((err)=>{
                  response.errors.push('REF: '+pl.reference+' No creado en Shopee: '+ err.message);
                });
                if (responseItem && !responseItem.error) {
                  await ProductChannel.findOrCreate({id: productChannelId},{
                    product:pl.id,
                    channel:integration.channel.id,
                    integration:integration.id,
                    channelid: responseItem.response.item_id,
                    status: true,
                    qc:true,
                    iscreated:true,
                    price: shopeePrice,
                    reason: ''
                  }).exec(async (err, record, created)=>{
                    if(err){return new Error(err.message);}
                    if(!created){
                      await ProductChannel.updateOne({id: record.id}).set({
                        channelid: responseItem.response.item_id,
                        price: shopeePrice
                      });
                    }
                  });
                  variations.item_id = responseItem.response.item_id;
                  let responseVariations = await sails.helpers.channel.shopee.request('/api/v2/product/init_tier_variation',integration.channel.endpoint,[`shop_id=${parseInt(integration.shopid)}`,`access_token=${integration.secret}`],variations,'POST');
                  if (responseVariations && responseVariations.error) {
                    response.errors.push('REF: '+pl.reference+' No creado en Shopee: '+ response.message);
                  } else {
                    response.items.push(body);
                  }
                } else{
                  response.errors.push('REF: '+pl.reference+' No creado en Shopee: '+ response.message);
                }
              }
            }
          }
        } else {
          throw new Error('Sin Productos para Procesar');
        }
      }
    } catch (err) {
      console.log(err);
      response.errors.push(err.message);
    }
    return res.send(response);
  },
  getcover: async (req, res) => {
    if (!req.isSocket) {
      return res.badRequest();
    }
    let channelErrors = [];
    let product = await Product.findOne({ id: req.param('productid') }).populate('channels');
    let cover = await ProductImage.findOne({ product: req.param('productid'), cover: 1 });
    let response = {};
    for (const channel of product.channels) {
      if (channel.reason && channel.reason !== '') {
        let integration = await Integrations.findOne({id: channel.integration});
        channelErrors.push({reference: product.reference, reason: channel.reason, integration: integration.name});
      }
    }
    response.id = product.id;
    response.name = product.name;
    response.reference = product.reference;
    response.details = product.details ? product.details : '';
    response.channelErrors = channelErrors;
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
    let asColor = req.body.asColor;

    let next;
    if (rights.name !== 'superadmin' && rights.name !== 'admin') {
      seller = req.session.user.seller;
    } else {
      seller = req.body.seller;
    }

    do {

      if(req.body.channel == constants.SHOPIFY_CHANNEL || req.body.channel == constants.MAGENTO_CHANNEL){
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
      {next = importedProducts.pagination;}

      isEmpty = (!importedProducts || !importedProducts.data || importedProducts.data.length == 0) ? true : false;

      if (!isEmpty) {
        rs = await sails.helpers.createBulkProducts(importedProducts.data, seller, sid, {
          channel : req.body.channel,
          pk : req.body.pk,
          sk : req.body.sk,
          url : req.body.apiUrl,
          version : req.body.version
        }, req.body.channel, asColor || false ).catch((e)=>console.log(e));
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
    let pageSize = req.body.channel == constants.MAGENTO_CHANNEL ? 4 : req.body.pageSize;
    let lastPage;
    let next;
    let sid = sails.sockets.getId(req);

    if (rights.name !== 'superadmin' && rights.name !== 'admin') {
      seller = req.session.user.seller;
    } else {
      seller = req.body.seller;
    }

    do {

      if(req.body.channel == constants.SHOPIFY_CHANNEL || req.body.channel == constants.MAGENTO_CHANNEL){
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
      if (importedProductsImages && importedProductsImages.pagination){
        next = importedProductsImages.pagination;
      }

      lastPage = importedProductsImages.pagesCount;

      isEmpty = (!importedProductsImages || !importedProductsImages.data || importedProductsImages.data.length == 0) ? true : false;

      if (!isEmpty) {
        for(p of importedProductsImages.data){
          let errors = [];
          let result = [];

          if(p.color && p.color.length > 0 && !p.simple && req.body.channel === constants.WOOCOMMERCE_CHANNEL){
            let product_variables = await sails.helpers.marketplaceswebhooks.findProductGraphql(
                req.body.channel,
                req.body.pk,
                req.body.sk,
                req.body.apiUrl,
                req.body.version,
                'PRODUCT_VARIATION_ID',
                p.externalId);

            if(product_variables && product_variables.data){

              let colors = product_variables.data.filter((pr)=>{
                return pr.color != null;
              });

              if(colors.length > 0){
                for (let index = 0; index < colors.length; index++) {
                  const pcolor = colors[index];
                  try {
                    let productColor =  await Product.findOne({externalId :pcolor.externalId, seller : seller, reference:pcolor.reference}).catch((e)=>{
                      throw new Error(`Ref: ${pcolor.reference} y externalId : ${pcolor.externalId} : existe mas de un producto con el mismo id externo y la misma referencia`);
                    });

                    if(productColor){
                      for (let im of pcolor.images) {
                        try {
                          if (im.file && im.src) {
                            let url = (im.src.split('?'))[0];
                            let file = (im.file.split('?'))[0];
                            let uploaded = await sails.helpers.uploadImageUrl(url, file, productColor.id).catch((e)=>{
                              throw new Error(`Ref: ${productColor.reference} : ${productColor.name} ocurrio un error obteniendo la imagen`);
                            });
                            if (uploaded) {
                              let cover = 1;
                              let totalimg = await ProductImage.count({ product: productColor.id});
                              totalimg += 1;
                              if (totalimg > 1) { cover = 0; }

                              await ProductImage.findOrCreate({product: productColor.id, file: file},{
                                file: file,
                                position: totalimg,
                                cover: cover,
                                product: productColor.id
                              }).exec(async (err, record, created)=>{
                                if(err){return new Error(err.message);}
                                if(!created){
                                  await ProductImage.updateOne({id: record.id}).set({
                                    file: file,
                                    position: totalimg,
                                    cover: cover
                                  });
                                }
                                if(typeof(record) === 'object'){
                                  result.push(record);
                                }
                              });
                              sails.sockets.broadcast(sid, 'product_images_processed', {errors, result});
                            }
                          }
                        } catch (err) {
                          errors.push({ name:'ERRDATA', message:err.message });
                          sails.sockets.broadcast(sid, 'product_images_processed', {errors, result});
                        }
                      }
                    }else{
                      if(typeof(productColor) === 'object'){
                        result.push(productColor);
                        sails.sockets.broadcast(sid, 'product_images_processed', {errors, result});
                      }
                    }
                  } catch (error) {
                    errors.push({ name:'ERRDATA', message:error.message });
                    sails.sockets.broadcast(sid, 'product_images_processed', {errors, result});
                  }
                }
              }else{
                try {
                  let product = await Product.findOne({externalId : p.externalId, seller : seller}).catch((e)=>{
                    throw new Error(`Ref: ${p.reference} y externalId : ${p.externalId} : existe mas de un producto con el mismo id externo y la misma referencia`);
                  });
                  if(product){
                    for (let im of p.images) {
                      if (im.file && im.src) {
                        let url = (im.src.split('?'))[0];
                        let file = (im.file.split('?'))[0];
                        let uploaded = await sails.helpers.uploadImageUrl(url, file, product.id).catch((e)=>{
                          throw new Error(`Ref: ${product.reference} : ${product.name} ocurrio un error obteniendo la imagen`);
                        });
                        if (uploaded) {
                          let cover = 1;
                          let totalimg = await ProductImage.count({ product: product.id});
                          totalimg += 1;
                          if (totalimg > 1) { cover = 0; }

                          await ProductImage.findOrCreate({product: product.id, file: file},{
                            file: file,
                            position: totalimg,
                            cover: cover,
                            product: product.id
                          }).exec(async (err, record, created)=>{
                            if(err){return new Error(err.message);}
                            if(!created){
                              await ProductImage.updateOne({id: record.id}).set({
                                file: file,
                                position: totalimg,
                                cover: cover
                              });
                            }
                            if(typeof(record) === 'object'){
                              result.push(record);
                            }
                          });
                          sails.sockets.broadcast(sid, 'product_images_processed', {errors, result});
                        }
                      }
                    }
                  }else{
                    if(typeof(product) === 'object'){
                      result.push(product);
                      sails.sockets.broadcast(sid, 'product_images_processed', {errors, result});
                    }
                  }
                } catch (error) {
                  errors.push({ name:'ERRDATA', message:error.message });
                  sails.sockets.broadcast(sid, 'product_images_processed', {errors, result});
                }
              }
            }
          }else{
            try {
              let product = p.externalId ? await Product.findOne({externalId: p.externalId, seller: seller}).populate('images').catch((e)=>{
                throw new Error(`Ref: ${p.reference} y externalId : ${p.externalId} : existe mas de un producto con el mismo id externo y la misma referencia`);
              }) : await Product.findOne({reference: p.reference.toUpperCase(), seller: seller}).populate('images').catch((e)=>{
                throw new Error(`Ref: ${p.reference} y externalId : ${p.externalId} : existe mas de un producto con el mismo id externo y la misma referencia`);
              });
              if(product){
                for (let im of p.images) {
                  if (im.file && im.src) {
                    let url = (im.src.split('?'))[0];
                    let file = (im.file.split('?'))[0];
                    let uploaded = await sails.helpers.uploadImageUrl(url, file, product.id).catch((e)=>{
                      throw new Error(`Ref: ${product.reference} : ${product.name} ocurrio un error obteniendo la imagen`);
                    });
                    if (uploaded) {
                      let cover = 1;
                      let totalimg = await ProductImage.count({ product: product.id});
                      totalimg += 1;
                      if (totalimg > 1) { cover = 0; }

                      await ProductImage.findOrCreate({product: product.id, file: file},{
                        file: file,
                        position: totalimg,
                        cover: cover,
                        product: product.id
                      }).exec(async (err, record, created)=>{
                        if(err){return new Error(err.message);}
                        if(!created){
                          await ProductImage.updateOne({id: record.id}).set({
                            file: file,
                            position: totalimg,
                            cover: cover
                          });
                        }
                        if(typeof(record) === 'object'){
                          result.push(record);
                        }
                      });
                      sails.sockets.broadcast(sid, 'product_images_processed', {errors, result});
                    }
                  }
                }
              }else{
                if(typeof(product) === 'object'){
                  result.push(product);
                  sails.sockets.broadcast(sid, 'product_images_processed', {errors, result});
                }
              }
            } catch (error) {
              errors.push({ name:'ERRDATA', message:error.message });
              sails.sockets.broadcast(sid, 'product_images_processed', {errors, result});
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
    let asProduct = req.body.asProduct;
    let lastPage;
    let next;

    if (rights.name !== 'superadmin' && rights.name !== 'admin') {
      seller = req.session.user.seller;
    } else {
      seller = req.body.seller;
    }

    do {

      if(req.body.channel == constants.SHOPIFY_CHANNEL || req.body.channel == constants.MAGENTO_CHANNEL){
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
      {next = importedProductsVariations.pagination;}
      lastPage = importedProductsVariations.pagesCount;

      isEmpty = (!importedProductsVariations || !importedProductsVariations.data || importedProductsVariations.data.length == 0) ? true : false;

      if (!isEmpty) {
        for(let p of importedProductsVariations.data){
          let result = [];
          let  errors = [];


          try {
            let pro = p.reference ? await Product.findOne({reference:p.reference.toUpperCase(), seller:seller}).populate('categories', {level:2 }).populate('discount',{
              where:{
                to:{'>=':moment().valueOf()}
              },
              sort: 'createdAt DESC'
            })
            : await Product.findOne({externalId: p.externalId, seller:seller}).populate('categories', {level:2 }).populate('discount',{
              where:{
                to:{'>=':moment().valueOf()}
              },
              sort: 'createdAt DESC'
            });
            if(!pro &&  req.body.channel != sails.config.custom.WOOCOMMERCE_CHANNEL){
              throw new Error(`Ref o externalId: ${p.reference ? p.reference : p.externalId} no pudimos encontrar este producto.`);
            }else{
              if( req.body.channel == sails.config.custom.WOOCOMMERCE_CHANNEL){
                if(p.variations && p.variations.length > 0){
                  let pvrs = require('lodash').uniqBy(p.variations.filter((p)=>p.color && p.color[0]), p=>p.color[0]);
                  if(pvrs.length > 0){
                    for (let index = 0; index < pvrs.length; index++) {
                      pvrs[index].variations = p.variations.filter((v)=>v.color[0] == pvrs[index].color[0]).map((v)=>{
                        return {
                          talla : v.size || v.talla,
                          stock : v.quantity,
                          price : v.price
                        };
                      });
                    }

                    for (let index = 0; index < pvrs.length; index++) {
                      let vr = pvrs[index];
                      let reference;
                      let color = await sails.helpers.tools.findColor(`${vr.color[0]}`);

                      if(color && color.length > 0){
                        color = await Color.findOne({id : color[0]});
                      }

                      if(color){
                        reference = `${vr.reference}-${color.name}`;
                      }else{
                        throw new Error(`Ref : ${vr.reference} no pudimos identificar este color ${vr.color[0]}.`);
                      }

                      let prc= await Product.findOne({reference:reference.toUpperCase(), seller:seller}).populate('categories', {level:2 }).populate('discount',{
                        where:{
                          to:{'>=':moment().valueOf()}
                        },
                        sort: 'createdAt DESC'
                      });

                      if(!prc){
                        throw new Error(`Ref : ${vr.reference} no pudimos encontrar este producto.`);
                      }

                      if(discount && vr.discount && vr.discount.length > 0){
                        for (const disc of vr.discount) {
                          let exists = prc.discount.find(dis => dis.value == disc.value && dis.type == disc.type);
                          if (exists) {
                            await CatalogDiscount.updateOne({ id: exists.id }).set({
                              from: moment(new Date(disc.from)).valueOf(),
                              to: moment(new Date(disc.to)).valueOf()
                            });
                          } else {
                            const discountresult = await CatalogDiscount.create({
                              name: disc.name ? disc.name.trim().toLowerCase() : prc.name,
                              from: moment(new Date(disc.from)).valueOf(),
                              to: moment(new Date(disc.to)).valueOf(),
                              type: disc.type,
                              value: parseFloat(disc.value),
                              seller: prc.seller
                            }).fetch();

                            await CatalogDiscount.addToCollection(discountresult.id,'products').members([prc.id]);
                            let intlist = [];
                            let integrations = await Integrations.find({where:{seller:prc.seller},select:['id']});
                            for(let integration of integrations){
                              if(!intlist.includes(integration.id)){intlist.push(integration.id);}
                            }
                            await CatalogDiscount.addToCollection(discountresult.id,'integrations').members(intlist);
                          }
                        }

                      }

                      if(vr.variations && vr.variations.length > 0){
                        for (let index = 0; index < vr.variations.length; index++) {
                          let pdv = vr.variations[index];
                          let vt_name;

                          if(pdv.talla){
                            vt_name = pdv.talla.toLowerCase().replace(',','.');
                          }

                          let variation = await Variation.find({ name:vt_name, gender:prc.gender,seller:prc.seller,manufacturer:prc.manufacturer,category:prc.categories[0].id});
                          let productVariation;

                          if(!variation || variation.length == 0){
                            variation = await Variation.create({name:vt_name,gender:prc.gender,seller:prc.seller,manufacturer:prc.manufacturer,category:prc.categories[0].id}).fetch();
                          }

                          variation = variation.length ? variation[0] : variation;
                          let pvs = await ProductVariation.find({ product:prc.id,supplierreference:`${prc.reference}-${color.name}`}).populate('variation');
                          let pv = pvs.find(pv=> pv.variation.name == variation.name);
                          if (!pv) {
                            productVariation = await ProductVariation.create({
                              product:prc.id,
                              variation:variation.id,
                              reference: vr.reference ? vr.reference : '',
                              supplierreference:`${prc.reference}-${color.name}`,
                              ean13: vr.ean13 ? vr.ean13.toString() : '',
                              upc: vr.upc ? vr.upc : 0,
                              skuId:  vr.variationId ? vr.variationId : '',
                              price:pdv.price,
                              quantity: pdv.stock ? pdv.stock : 0,
                              seller:prc.seller
                            }).fetch();
                          } else {
                            productVariation = await ProductVariation.updateOne({ id: pv.id }).set({
                              price: pdv.price,
                              variation: variation.id,
                              quantity: pdv.stock ? pdv.stock : 0,
                            });
                          }

                          if(typeof(productVariation) === 'object' ){
                            result.push(productVariation);
                            sails.sockets.broadcast(sid, 'variation_processed', {result, errors});
                          }
                        }
                      }
                    }
                  }else{
                    for (let index = 0; index < p.variations.length; index++) {
                      let pdv =  p.variations[index];
                      let vt_name;

                      if(pdv.talla){
                        vt_name = pdv.size || pdv.talla.toLowerCase().replace(',','.');
                      }

                      let prc= await Product.findOne({reference:p.reference.toUpperCase(), seller:seller}).populate('categories', {level:2 });

                      if(!prc){
                        throw new Error(`Ref o externalId: ${p.reference} no pudimos encontrar este producto.`);
                      }

                      let variation = await Variation.find({ name:vt_name, gender:prc.gender,seller:prc.seller,manufacturer:prc.manufacturer,category:prc.categories[0].id});
                      let productVariation;

                      if(!variation || variation.length == 0){
                        variation = await Variation.create({name:vt_name,gender:prc.gender,seller:prc.seller,manufacturer:prc.manufacturer,category:prc.categories[0].id}).fetch();
                      }

                      variation = variation.length ? variation[0] : variation;
                      let pvs = await ProductVariation.find({ product:prc.id,supplierreference:prc.reference}).populate('variation');
                      let pv = pvs.find(pv=> pv.variation.name == variation.name);

                      if (!pv) {
                        productVariation = await ProductVariation.create({
                          product:prc.id,
                          variation:variation.id,
                          reference: pdv.reference ? pdv.reference : '',
                          supplierreference:`${prc.reference}`,
                          ean13: pdv.ean13 ? pdv.ean13.toString() : '',
                          upc: pdv.upc ? pdv.upc : 0,
                          skuId: pdv.skuId ? pdv.skuId : '',
                          price: pdv.price,
                          quantity: pdv.quantity || 0,
                          seller:prc.seller
                        }).fetch();
                      } else {
                        productVariation = await ProductVariation.updateOne({ id: pv.id }).set({
                          price: pdv.price,
                          variation: variation.id,
                          quantity: pdv.quantity || 0,
                        });
                      }

                      if(discount && pdv.discount && pdv.discount.length > 0){
                        for (const disc of pdv.discount) {
                          let exists = prc.discount.find(dis => dis.value == disc.value && dis.type == disc.type);
                          if (exists) {
                            await CatalogDiscount.updateOne({ id: exists.id }).set({
                              from: moment(new Date(disc.from)).valueOf(),
                              to: moment(new Date(disc.to)).valueOf()
                            });
                          } else {
                            const discountresult = await CatalogDiscount.create({
                              name: disc.name ? disc.name.trim().toLowerCase() : prc.name,
                              from: moment(new Date(disc.from)).valueOf(),
                              to: moment(new Date(disc.to)).valueOf(),
                              type: disc.type,
                              value: parseFloat(disc.value),
                              seller: prc.seller
                            }).fetch();

                            await CatalogDiscount.addToCollection(discountresult.id,'products').members([prc.id]);
                            let intlist = [];
                            let integrations = await Integrations.find({where:{seller:prc.seller},select:['id']});
                            for(let integration of integrations){
                              if(!intlist.includes(integration.id)){intlist.push(integration.id);}
                            }
                            await CatalogDiscount.addToCollection(discountresult.id,'integrations').members(intlist);
                          }
                        }

                      }
                      if(typeof(productVariation) === 'object' ){
                        result.push(productVariation);
                        sails.sockets.broadcast(sid, 'variation_processed', {result, errors});
                      }
                    }
                  }

                }
              }
            }

            if(pro && req.body.channel != sails.config.custom.WOOCOMMERCE_CHANNEL){
              if (discount && p.discount && p.discount.length > 0) {
                for (const disc of p.discount) {
                  let exists = pro.discount.find(dis => dis.value == disc.value && dis.type == disc.type);
                  if (exists) {
                    await CatalogDiscount.updateOne({ id: exists.id }).set({
                      from: moment(new Date(disc.from)).valueOf(),
                      to: moment(new Date(disc.to)).valueOf()
                    });
                  } else {
                    const discountresult = await CatalogDiscount.create({
                      name: disc.name.trim().toLowerCase(),
                      from: moment(new Date(disc.from)).valueOf(),
                      to: moment(new Date(disc.to)).valueOf(),
                      type: disc.type,
                      value: parseFloat(disc.value),
                      seller: pro.seller
                    }).fetch();
                    await CatalogDiscount.addToCollection(discountresult.id,'products').members([pro.id]);
                    let intlist = [];
                    let integrations = await Integrations.find({where:{seller:pro.seller},select:['id']});
                    for(let integration of integrations){
                      if(!intlist.includes(integration.id)){intlist.push(integration.id);}
                    }
                    await CatalogDiscount.addToCollection(discountresult.id,'integrations').members(intlist);
                  }
                }
              }
              try {
                let pr = await Product.findOne({reference:pro.reference, seller:pro.seller});
                if (!pro.categories[0]) {
                  throw new Error(`El producto Ref ${pro.reference} no tiene categoría.`);
                }
                if( p.variations && p.variations.length > 0){
                  for(let vr of p.variations){
                    if(vr.color && vr.color.length > 0){
                      let prc= await Product.findOne({reference:vr.reference, seller:pro.seller});
                      let vt =  vr.size ? vr.size.toLowerCase() : ( vr.talla ? vr.talla.toLowerCase().replace(',','.') : 'única');
                      let variation = await Variation.find({ name:vt, gender:pro.gender,seller:pro.seller,manufacturer:pro.manufacturer,category:pro.categories[0].id});
                      let productVariation;
                      let discountHandled = false;

                      if(!variation || variation.length == 0){
                        variation = await Variation.create({name:vt,gender:pro.gender,seller:pro.seller,manufacturer:pro.manufacturer,category:pro.categories[0].id}).fetch();
                      }

                      variation = variation.length ? variation[0] : variation;
                      let pvs = await ProductVariation.find({ product:prc.id,supplierreference:vr.reference}).populate('variation');
                      let pv = pvs.find(pv=> pv.variation.name == variation.name);

                      if (!pv) {
                        productVariation = await ProductVariation.create({
                          product:prc.id,
                          variation:variation.id,
                          reference: vr.reference ? vr.reference : '',
                          supplierreference:prc.reference,
                          ean13: vr.ean13 ? vr.ean13.toString() : '',
                          upc: vr.upc ? vr.upc : 0,
                          skuId: vr.skuId ? vr.skuId : '',
                          price: vr.price,
                          quantity: vr.quantity ? vr.quantity : 0,
                          seller:prc.seller
                        }).fetch();
                      } else {
                        productVariation = await ProductVariation.updateOne({ id: pv.id }).set({
                          price: vr.price,
                          variation: variation.id,
                          quantity: vr.quantity ? vr.quantity : 0,
                        });
                      }
                    }else{
                      let variation = await Variation.find({ name:vr.talla.toLowerCase().replace(',','.'), gender:pro.gender,seller:pro.seller,manufacturer:pro.manufacturer,category:pro.categories[0].id});
                      let productVariation;
                      let discountHandled = false;

                      if(!variation || variation.length == 0){
                        variation = await Variation.create({name:vr.talla.toLowerCase().replace(',','.'),gender:pro.gender,seller:pro.seller,manufacturer:pro.manufacturer,category:pro.categories[0].id}).fetch();
                      }
                      variation = variation.length ? variation[0] : variation;
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
                          skuId: vr.skuId ? vr.skuId : '',
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
                          if (pro.discount.length > 0 && pro.discount[0].value == vr.discount[0].value
                            && pro.discount[0].type == vr.discount[0].type) {
                            await CatalogDiscount.updateOne({ id: pro.discount[0].id }).set({
                              from: moment(new Date(vr.discount[0].from)).valueOf(),
                              to: moment(new Date(vr.discount[0].to)).valueOf()
                            });
                          } else {
                            const discountresult = await CatalogDiscount.create({
                              name: (vr.discount && vr.discount[0].name) ? vr.discount[0].name.trim().toLowerCase() : pro.name,
                              from: moment(new Date(vr.discount[0].from)).valueOf(),
                              to: moment(new Date(vr.discount[0].to)).valueOf(),
                              type: vr.discount[0].type,
                              value: parseFloat(vr.discount[0].value),
                              seller: pro.seller
                            }).fetch();
                            await CatalogDiscount.addToCollection(discountresult.id,'products').members([pro.id]);
                            let intlist = [];
                            let integrations = await Integrations.find({where:{seller:pro.seller},select:['id']});
                            for(let integration of integrations){
                              if(!intlist.includes(integration.id)){intlist.push(integration.id);}
                            }
                            await CatalogDiscount.addToCollection(discountresult.id,'integrations').members(intlist);
                          }
                        }

                        if(typeof(productVariation)=== 'object'){
                          result.push(productVariation);
                          sails.sockets.broadcast(sid, 'variation_processed', {result, errors});
                        }
                      }
                    }
                  }
                } else {
                  let pvs = await ProductVariation.find({product: pro.id, supplierreference: pro.reference});
                  for (const pv of pvs) {
                    let productVariation = await ProductVariation.updateOne({ id: pv.id }).set({
                      quantity: 0
                    });
                    if(productVariation){
                      result.push(productVariation);
                      sails.sockets.broadcast(sid, 'variation_processed', {result, errors});
                    }
                  }
                }
              } catch (e) {
                errors.push({ name:'ERRDATA', message:e.message });
                sails.sockets.broadcast(sid, 'variation_processed', {result, errors});
                console.log(e);
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
  },
  deleteproduct: async (req, res) => {
    const jsonxml = require('jsontoxml');
    const integrationId = req.body.integration;
    const productchannelId = req.body.productchannel;
    const channel = req.body.nameChannel;
    let body={Request:[]};
    try {
      let integration = await Integrations.findOne({id: integrationId}).populate('channel');
      let productchannel = await ProductChannel.findOne({id: productchannelId});
      let productvariations = await ProductVariation.find({product:productchannel.product});
      if(channel === 'walmart'){
        await sails.helpers.channel.walmart.deleteProduct(productvariations, integration)
        .then(async (resData)=>{
          if(!resData.errors){
            await ProductChannel.destroyOne({id: productchannelId});
            return res.send({error: null});
          }else{
            return res.send({error: resData.errors});
          }
        })
        .catch(err =>{
          console.log(err);
          return res.send({error: err});
        });
      }else if(channel === 'mercadolibre' || channel === 'mercadolibremx') {
        let result = channel === 'mercadolibre' ? await sails.helpers.channel.mercadolibre.request('items/'+productchannel.channelid,integration.channel.endpoint,integration.secret,{status: 'closed'},'PUT') :
        await sails.helpers.channel.mercadolibremx.request('items/'+productchannel.channelid,integration.channel.endpoint,integration.secret,{status: 'closed'},'PUT');
        if (result.id) {
          let resultDelete = channel === 'mercadolibre' ? await sails.helpers.channel.mercadolibre.request('items/'+productchannel.channelid,integration.channel.endpoint,integration.secret,{deleted:'true'},'PUT') :
          await sails.helpers.channel.mercadolibre.request('items/'+productchannel.channelid,integration.channel.endpoint,integration.secret,{deleted:'true'},'PUT');
          if (resultDelete.id) {
            await ProductChannel.destroyOne({id: productchannelId});
            return res.send({error: null});
          } else {
            return res.send({error: 'No se puede eliminar el producto en mercadolibre'});
          }
        } else {
          return res.send({error: 'No se pudo inactivar el producto en mercadolibre'});
        }
      }else if(channel === 'shopee'){
        let response = await sails.helpers.channel.shopee.request('/api/v2/product/delete_item',integration.channel.endpoint,[`shop_id=${parseInt(integration.shopid)}`,`access_token=${integration.secret}`],{item_id: parseInt(productchannel.channelid)},'POST');
        if (response && !response.error) {
          await ProductChannel.destroyOne({id: productchannelId});
          return res.send({error: null});
        } else {
          return res.send({error: response.message});
        }
      }else {
        for(let pv of productvariations){
          body.Request.push({Product: {SellerSku:pv.id}});
        }
        const xml = jsonxml(body, true);
        let sign = channel === 'dafiti' ? await sails.helpers.channel.dafiti.sign(integrationId, 'ProductRemove', integration.seller) :
        channel === 'liniomx' ? await sails.helpers.channel.liniomx.sign(integrationId, 'ProductRemove', integration.seller) :
        await sails.helpers.channel.linio.sign(integrationId, 'ProductRemove', integration.seller);
        await sails.helpers.request(integration.channel.endpoint,'/?'+sign,'POST', xml)
        .then(async (resData)=>{
          resData = JSON.parse(resData);
          if(resData.SuccessResponse){
            await ProductChannel.destroyOne({id: productchannelId});
            return res.send({error: null});
          }else{
            return res.send({error: resData.ErrorResponse.Head.ErrorMessage});
          }
        })
        .catch(err =>{
          console.log(err);
          return res.send({error: err.message});
        });
      }
    } catch (err) {
      console.log(err);
      return res.send({error: err.message});
    }
  },
  updatemultipleproduct: async (req, res) => {
    const productsSelected = req.body.productsSelected;
    try {
      let seller = null;
      for (const id of productsSelected) {
        const product = await Product.updateOne({id: id}).set({
          mainCategory: req.body.mainCategory
        });
        await Product.replaceCollection(product.id, 'categories').members(JSON.parse(req.body.categories));
        seller = product.seller;
      }
      return res.send({error: null,seller});
    } catch (err) {
      return res.send({error: err.message,seller});
    }
  }
};
