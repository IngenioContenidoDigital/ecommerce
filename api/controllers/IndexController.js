let moment = require('moment');
/**
 * IndexController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
module.exports = {
  index: async function(req, res){
    let seller = null;
    let slider = null;
    let cms = null;
    let cmsfilter = {position:'home',active:true};
    let sliderfilter = {active:true};
    let brands = null;
    let iridio = null;

    if(req.hostname==='1ecommerce.app'){
      return res.redirect('/login');
    }else if(req.hostname==='iridio.co' || req.hostname==='demo.1ecommerce.app' || req.hostname==='localhost'){
      brands = await Manufacturer.find({active:true}).sort('name ASC');
      cmsfilter['seller'] = null;
      sliderfilter['seller']=null;
      iridio = await Channel.findOne({name:'iridio'});
    }else{
      seller = await Seller.findOne({
        where:{domain:req.hostname},
        select:['name','domain','logo']
      });
      if(seller && seller.id){
        cmsfilter['seller'] = seller.id;
        sliderfilter['seller']=seller.id;
      }
    }
    let viewed={products:[]};
    let pshow =[];
    if(req.session.viewed && req.session.viewed.length>0){
      req.session.viewed = req.session.viewed.sort((a,b) => {return b.viewedAt - a.viewedAt; });
      req.session.viewed = req.session.viewed.slice(-4);
      for(let i=0; i<=3; i++){
        if(req.session.viewed[i]){
          pshow.push(req.session.viewed[i].product);
        }
      }
      if(pshow.length>0){
        let products = await Product.find({
          where:{id:pshow,active:true},
          select:['name','description','seller','mainColor','manufacturer','gender','reference','mainCategory'],
          sort: 'updatedAt DESC'
        });
        viewed.products=products;
        for(let p of viewed.products){
          p.seller=await Seller.findOne({
            where:{id:p.seller},
            select:['name','active']
          });
          p.cover= (await ProductImage.find({product:p.id,cover:1}))[0];
          p.mainColor=await Color.findOne({id:p.mainColor});
          p.mainCategory=await Category.findOne({
            where:{id:p.mainCategory},
            select:['name','url','level']
          });
          p.manufacturer=await Manufacturer.findOne({
            where:{id:p.manufacturer},
            select:['name']
          });
          let discounts = await sails.helpers.discount(p.id);
          if(iridio && discounts){
            let integrations = await ProductChannel.find({channel:iridio.id,product:p.id});
            integrations = integrations.map(itg => itg.integration);
            discounts = discounts.filter((ad)=>{if(ad.integrations && ad.integrations.length > 0 && integrations.length>0 && ad.integrations.some(ai => integrations.includes(ai.id))){return ad;}});
          }
          p.discount = discounts ? discounts[0] : null;
          p.gender = await Gender.findOne({id:p.gender});
          p.price = (await ProductVariation.find({product:p.id}))[0].price;
        }
      }
    }

    cms = (await Cms.find(cmsfilter))[0];
    slider = await Slider.find(sliderfilter);

    return res.view('pages/homepage',{slider:slider,tag:await sails.helpers.getTag(req.hostname),object:viewed,page:1,brands:brands, seller:seller,cms:cms});
  },
  admin: async function(req, res){
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    let questionsSeller = 0;
    let seller = req.session.user.seller || '';
    if(rights.name !== 'superadmin' && rights.name !== 'admin'){
      questionsSeller = await Question.count({status: 'UNANSWERED', seller: seller});
    }
    req.session.questions = questionsSeller;
    return res.view('pages/homeadmin',{layout:'layouts/admin'});
  },
  reportsadmin:async (req, res) =>{
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if(rights.name !== 'superadmin' && rights.name !== 'admin'){
      throw 'forbidden';
    }
    return res.view('pages/reports/reportorders',{layout:'layouts/admin'});
  },
  filterDashboard:async (req, res) =>{
    if (!req.isSocket) {
      return res.badRequest();
    }
    let sid = sails.sockets.getId(req);
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if(rights.name!=='superadmin' && !_.contains(rights.permissions,'dashboard')){
      throw 'forbidden';
    }
    let seller = req.session.user.seller || '';
    let dateStart = new Date(req.param('dateStart')).valueOf();
    let dateEnd = new Date(req.param('dateEnd')).valueOf();
    let ordersByDay = [];

    let dataOrders = await sails.helpers.dashboard.orders(rights.name, seller, dateStart, dateEnd);
    sails.sockets.blast('datadashboardorders', {
      totalOrders: dataOrders.totalOrders,
      totalProducts: dataOrders.totalProducts,
      totalSales: dataOrders.totalSales,
      cities: dataOrders.cities,
      channels: dataOrders.channels,
      id: req.session.user.id
    });

    let numberDays = moment(req.param('dateEnd'), 'YYYY/MM/DD').diff(moment(req.param('dateStart'), 'YYYY/MM/DD'), 'days');
    for (let i = numberDays; i >= 0; i--) {
      const date1 = moment(req.param('dateEnd')).subtract(i+1, 'days').format('YYYY/MM/DD');
      const date2 = moment(req.param('dateEnd')).subtract(i, 'days').format('YYYY/MM/DD');
      const day = date1;
      const dateStart = new Date(date1).valueOf();
      const dateEnd = new Date(date2).valueOf();
      const count = await sails.helpers.dashboard.ordersToday(rights.name, seller, dateStart, dateEnd);
      ordersByDay.push({day: day, total: count.totalOrders, totalPrice: count.totalPrice});
    }
    sails.sockets.blast('datadashboardgraphics', {
      ordersByDay,
      id: req.session.user.id
    });

    if(rights.name !== 'superadmin' && rights.name !== 'admin'){
      let dataTop = await sails.helpers.dashboard.top10(seller, dateStart, dateEnd);
      sails.sockets.blast('datadashboardtop', {
        topProductsCant: dataTop.topProductsCant,
        topProductsPrice: dataTop.topProductsPrice,
        lessProducts: dataTop.lessProducts,
        id: req.session.user.id
      });
      await sails.helpers.dashboard.publish(seller, sid);
      await sails.helpers.dashboard.inventory(seller, sid);
    }

    let dataLogistics = await sails.helpers.dashboard.logistics(rights.name, seller, dateStart, dateEnd);
    sails.sockets.blast('datadashboardlogistics', {
      totalOrdersCancel: dataLogistics.totalOrdersCancel,
      totalOrdersReturned: dataLogistics.totalOrdersReturned,
      totalShippingCost: dataLogistics.totalShippingCost,
      averageHoursLogist: dataLogistics.averageHoursLogist,
      averageHoursClient: dataLogistics.averageHoursClient,
      averageHoursCellar: dataLogistics.averageHoursCellar,
      id: req.session.user.id
    });
    return res.ok();
  },
  generateReport:async (req, res) =>{
    const Excel = require('exceljs');
    moment.locale('es');
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if(rights.name!=='superadmin' && !_.contains(rights.permissions,'report')){
      throw 'forbidden';
    }
    let sellerId = req.param('seller');
    let month = req.param('month');
    let orders = [];
    if (sellerId && month) {
      let dateStart = new Date(moment(month, 'MMMM YYYY').subtract(1, 'months').startOf('month').format('YYYY/MM/DD')).valueOf();
      let dateEnd = new Date(moment(month, 'MMMM YYYY').subtract(1, 'months').endOf('month').add(1, 'days').format('YYYY/MM/DD')).valueOf();
      orders = await Order.find({
        where: {
          seller: sellerId,
          createdAt: { '>': dateStart, '<': dateEnd }
        }
      }).populate('customer').populate('currentstatus');
    } else if(req.param('startDate') && req.param('endDate')){
      let dateStart = new Date(req.param('startDate')).valueOf();
      let dateEnd = new Date(req.param('endDate')).valueOf();
      orders = await Order.find({
        where: {
          createdAt: { '>': dateStart, '<': dateEnd }
        }
      }).populate('customer').populate('currentstatus');
    }
    let workbook = new Excel.Workbook();
    let worksheet = workbook.addWorksheet('Reporte');
    let ordersItem = [];

    worksheet.columns = [
      { header: 'Id', key: 'id', width: 26 },
      { header: 'Cliente', key: 'customer', width: 35 },
      { header: 'Vendedor', key: 'seller', width: 35 },
      { header: 'Estado', key: 'currentstatus', width: 12 },
      { header: 'Precio', key: 'price', width: 12 },
      { header: 'Producto', key: 'product', width: 46 },
      { header: 'Color', key: 'color', width: 15 },
      { header: 'Talla', key: 'size', width: 15 },
      { header: 'Dni Vendedor', key: 'dni', width: 22 },
      { header: 'Referencia', key: 'externalReference', width: 22 },
      { header: 'Método de pago', key: 'paymentMethod', width: 26 },
      { header: 'Código de pago', key: 'paymentId', width: 20 },
      { header: 'Marketplace', key: 'channel', width: 12 },
      { header: 'Referencia marketplace', key: 'channelref', width: 22 },
      { header: 'Referencia del pedido', key: 'orderref', width: 15 },
      { header: 'Número de rastreo', key: 'tracking', width: 20 },
      { header: 'Flete Total', key: 'fleteTotal', width: 20 },
      { header: 'Comisión', key: 'commission', width: 20 },
      { header: 'Fecha de creación', key: 'createdAt', width: 20 },
      { header: 'Fecha de actualización', key: 'updatedAt', width: 22 },
    ];
    worksheet.getRow(1).font = { bold: true };

    for (const order of orders) {
      let items = await OrderItem.find({order: order.id});
      for (const item of items) {
        let product = await Product.findOne({id: item.product}).populate('mainColor').populate('seller');
        let productVariation = await ProductVariation.findOne({id: item.productvariation}).populate('variation');
        item.id = order.id;
        item.seller = product.seller.name;
        item.dni = product.seller.dni;
        item.product = product.name;
        item.color = product.mainColor ? product.mainColor.name : '';
        item.size = productVariation ? productVariation.variation.col : '';
        item.customer = order.customer.fullName;
        item.currentstatus = order.currentstatus.name;
        item.paymentMethod = order.paymentMethod;
        item.paymentId = order.paymentId;
        item.channel = order.channel;
        item.channelref = order.channelref;
        item.orderref = order.reference;
        item.tracking = order.tracking;
        item.fleteTotal = order.fleteTotal;
        item.createdAt = moment(order.createdAt).format('DD-MM-YYYY');
        item.updatedAt = moment(order.updatedAt).format('DD-MM-YYYY');
        ordersItem.push(item);
      }
    }
    worksheet.addRows(ordersItem);
    const buffer = await workbook.xlsx.writeBuffer();
    return res.send(buffer);
  },
  generateReportSeller:async (req, res) =>{
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if(rights.name!=='superadmin' && !_.contains(rights.permissions,'report')){
      throw 'forbidden';
    }
    let axios = require('axios');
    const {jsPDF} = require('jspdf');
    let sellerId = req.param('seller');
    let month = req.param('month');
    let data = await sails.helpers.reportSeller(sellerId, month);
    let date = moment(month, 'MMMM YYYY').subtract(1, 'months').locale('es').format('MMMM YYYY');
    const totalReferences = data.totalSkuInactive + data.totalSkuActive;
    const text = data.seller.activeSku ? 'Referencias Activas (SKU)' : 'Referencias (SKU)';
    const totalOrders = data.ordersFailed.total + data.ordersCancel.total + data.ordersReturn.total;
    const totalPriceOrders = data.ordersFailed.price + data.ordersCancel.price + data.ordersReturn.price;
    try {
      const doc = new jsPDF({orientation: 'p', unit: 'mm', format: 'a4'});
      if (data.seller.logo) {
        let response = await axios.get(`https://s3.amazonaws.com/iridio.co/images/sellers/${data.seller.logo}`, { responseType: 'arraybuffer' });
        buffer = Buffer.from(response.data).toString('base64');
        doc.addImage(buffer, 135, 5, 60, 0);
      }
      doc.setFontSize(12);
      doc.setFont('times', 'normal');
      doc.text(data.seller.name.toUpperCase(), 15, 10);
      doc.text(`NIT. ${data.seller.dni}`, 15, 15);
      doc.text(data.address.addressline1, 15, 25);
      doc.text(`Tel. ${data.seller.phone}`, 15, 30);
      doc.text(`${data.address.city.name.toUpperCase()} - ${data.address.country.name.toUpperCase()}`, 15, 35);
      doc.setFont('times', 'bold');
      doc.text('BALANCE CON CORTE A:', 15, 60);
      doc.text(date.toLocaleUpperCase(), 160, 60);
      doc.text('ELABORACIÓN:', 15, 65);
      doc.text(moment().format('L'), 160, 65);
      doc.text('Ordenes (CR)', 15, 80);
      doc.text('Total 1Ecommerce', 70, 80);
      doc.text(`$ ${Math.round(data.totalPrice).toLocaleString('es-CO')}`, 160, 80);
      doc.setFont('times', 'normal');
      doc.text('Valor Pedidos Entregados', 70, 88);
      doc.text(`$ ${Math.round(data.totalPrice).toLocaleString('es-CO')}`, 130, 88);
      doc.text('Otros Ingresos', 70, 96);
      doc.text('Siniestros', 70, 104);
      doc.text('Ajustes (CC)',70, 112);
      doc.setFont('times', 'bold');
      doc.text('Cargos',70, 125);
      doc.text(`$ ${Math.round(data.totalCommission).toLocaleString('es-CO')}`,160, 125);
      doc.setFont('times', 'normal');
      doc.text('Comisión 1Ecommerce',70, 133);
      doc.text(`$ ${Math.round(data.totalCommission).toLocaleString('es-CO')}`,130, 133);
      doc.text('Penalidades (PEN)',70, 141);
      doc.text('Marketplace en siniestros',70, 149);
      doc.setFont('times', 'bold');
      doc.text('Ordenes (CR)', 15, 160);
      doc.text(`$ ${Math.round(totalPriceOrders).toLocaleString('es-CO')}`, 160, 160);
      doc.text(totalOrders.toString(), 130, 160);
      doc.setFont('times', 'normal');
      doc.text('Ordenes Devueltas',70, 170);
      doc.text(data.ordersReturn.total.toString(), 130, 170);
      doc.text(`$ ${Math.round(data.ordersReturn.price).toLocaleString('es-CO')}`, 160, 170);
      doc.text('Ordenes Canceladas',70, 178);
      doc.text(data.ordersCancel.total.toString(), 130, 178);
      doc.text(`$ ${Math.round(data.ordersCancel.price).toLocaleString('es-CO')}`, 160, 178);
      doc.text('Ordenes Fallidas',70, 186);
      doc.text(data.ordersFailed.total.toString(), 130, 186);
      doc.text(`$ ${Math.round(data.ordersFailed.price).toLocaleString('es-CO')}`, 160, 186);
      doc.setFont('times', 'bold');
      doc.text('Otros Conceptos', 15, 197);
      doc.text(`$ ${Math.round(data.totalSku + data.fleteTotal).toLocaleString('es-CO')}`, 160, 197);
      doc.text('Total Referencias (SKU)', 70, 207);
      doc.text(totalReferences.toString(), 130, 207);
      doc.setFont('times', 'normal');
      doc.text('Referencias Activas (SKU)', 70, 215);
      doc.text(data.totalSkuActive.toString(), 130, 215);
      doc.text('Referencias Inactivas (SKU)', 70, 223);
      doc.text(data.totalSkuInactive.toString(), 130, 223);
      doc.text(text, 70, 236);
      doc.text(`$ ${Math.round(data.totalSku).toLocaleString('es-CO')}`, 130, 236);
      doc.text('Serv Envio (ENV)', 70, 244);
      doc.text(`$ ${Math.round(data.fleteTotal).toLocaleString('es-CO')}`, 130, 244);
      doc.text('Marketing (MKT)', 70, 252);
      doc.setFont('times', 'bold');
      doc.text('Retención por servicios', 15, 263);
      doc.text(`$ ${Math.round(data.totalRetFte).toLocaleString('es-CO')}`, 160, 263);
      doc.text('Retención de Ica 9,66/1000', 15, 271);
      doc.text(`$ ${Math.round(data.totalRetIca).toLocaleString('es-CO')}`, 160, 271);
      doc.text('Ajuste al peso', 15, 279);
      doc.text('0', 160, 279);
      doc.setFontSize(18);
      doc.text('Balance Total', 70, 290);
      doc.text(`$ ${Math.round(data.totalBalance).toLocaleString('es-CO')}`, 160, 290);
      const buff = Buffer.from(new Uint8Array(doc.output('arraybuffer')));
      return res.send(buff);
    } catch (err) {
      console.log(err.message);
      return res.notFound(err);
    }
  },
  showreport: async function(req, res){
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if(rights.name!=='superadmin' && !_.contains(rights.permissions,'report')){
      throw 'forbidden';
    }
    moment.locale('es');
    const seller = req.param('seller');
    const month = req.param('month');
    let date = moment(month, 'MMMM YYYY').subtract(1, 'months').locale('es').format('MMMM YYYY');
    let data = await sails.helpers.reportSeller(seller, month);
    res.view('pages/sellers/showreport', {layout:'layouts/admin', data, date});
  },
  checkout: async function(req, res){
    if(req.session.cart===undefined || req.session.cart===null){
      return res.redirect('/cart');
    }

    let seller = null;
    let iridio = null;
    if(req.hostname!=='iridio.co' && req.hostname!=='demo.1ecommerce.app' && req.hostname!=='localhost' && req.hostname!=='1ecommerce.app'){
      seller = await Seller.findOne({domain:req.hostname/*'sanpolos.com'*/});
    }else{
      iridio = await Channel.findOne({name:'iridio'});
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

    let tokens = await Token.find({user:req.session.user.id});

    return res.view('pages/front/checkout', {addresses:addresses, cart:cart, error:error, tokens:tokens,tag:await sails.helpers.getTag(req.hostname),seller:seller});
  },
  list: async function(req, res){
    req.setTimeout(0);
    let entity = req.param('entity');
    let ename = req.param('name');
    let page = req.param('page') ? parseInt(req.param('page')) : 1;
    let perPage = 32;
    let pages = 0;
    let seller = null;
    let object = null;
    let iridio = null;
    let productsFilter = {active:true};
    let skip = ((page-1)*perPage);
    let limit = (((page-1)*perPage)+perPage);
    if(req.hostname!=='iridio.co' && req.hostname!=='demo.1ecommerce.app' && req.hostname!=='localhost'){
      seller = await Seller.findOne({domain:req.hostname,active:true});
      if(seller){productsFilter['seller']=seller.id;}
    }else{
      iridio = await Channel.findOne({name:'iridio'});
      let iridioproducts = await ProductChannel.find({
        where:{
          channel:iridio.id,
          status:true
        },
        select:['product','integration']
      });
      iridioproducts = iridioproducts.map(i => i.product);
      productsFilter['id'] = iridioproducts;
    }

    switch(entity){
      case 'categoria':
        try{
          object = await Category.findOne({
            where:{url:ename,active:true},
            select:['name','url','logo','description','tags']
          }).populate('products',{
            where:productsFilter,
            select:['id'],
            sort: 'updatedAt DESC'
          });
          object.route = '/images/categories/';
        }catch(err){
          return res.notFound(err);
        }
        break;
      case 'marca':
        try{
          object = await Manufacturer.findOne({url:ename,active:true}).populate('products',{
            where:productsFilter,
            select:['id'],
            sort: 'updatedAt DESC'
          });
          object.route = '/images/brands/';
        }catch(err){
          return res.notFound(err);
        }
        break;
      default:
        return res.notFound();
    }
    let colorFilter = {};
    let gendersFilter = {};
    let brandsFilter = {active:true};
    let colorList = [];
    let brandsList = [];
    let gendersList = [];

    pages = Math.ceil(object.products.length/perPage);
    if(object.products.length>0){
      object.products = object.products.slice(skip,limit);
      for(let p in object.products){
        object.products[p] = await Product.findOne({where:{id:object.products[p].id},select:['name','tax','description','descriptionShort','seller','mainColor','manufacturer','gender','reference','mainCategory']});
        object.products[p].price = (await ProductVariation.find({product:object.products[p].id}))[0].price;
        object.products[p].cover= (await ProductImage.find({product:object.products[p].id,cover:1}))[0];
        let discounts = await sails.helpers.discount(object.products[p].id);
        if(iridio && discounts){
          let integrations = await ProductChannel.find({channel:iridio.id,product:object.products[p].id});
          integrations = integrations.map(itg => itg.integration);
          discounts = discounts.filter((ad)=>{if(ad.integrations && ad.integrations.length > 0 && integrations.length>0 && ad.integrations.some(ai => integrations.includes(ai.id))){return ad;}});
        }
        object.products[p].discount = discounts ? discounts[0] : null;
        object.products[p].seller=await Seller.findOne({
          where:{id:object.products[p].seller},
          select:['name','active']
        });
        object.products[p].mainColor=await Color.findOne({id:object.products[p].mainColor});
        object.products[p].mainCategory=await Category.findOne({
          where:{id:object.products[p].mainCategory},
          select:['name','url','level']
        });
        object.products[p].manufacturer=await Manufacturer.findOne({
          where:{id:object.products[p].manufacturer},
          select:['name']
        });
        object.products[p].gender = await Gender.findOne({id:object.products[p].gender});

        if(object.products[p].mainColor && !colorList.includes(object.products[p].mainColor.id)){colorList.push(object.products[p].mainColor.id);}
        if(object.products[p].manufacturer && !brandsList.includes(object.products[p].manufacturer.id)){brandsList.push(object.products[p].manufacturer.id);}
        if(object.products[p].gender && !gendersList.includes(object.products[p].gender.id)){gendersList.push(object.products[p].gender.id);}
      }
    }

    if(colorList.length>0){colorFilter['id']=colorList;}
    if(brandsList.length>0){brandsFilter['id']=brandsList;}
    if(gendersList.length>0){gendersFilter['id']=gendersList;}

    let colors = await Color.find(colorFilter);
    let brands = await Manufacturer.find({where:brandsFilter,select:['name']});
    let genders = await Gender.find(gendersFilter);

    return res.view('pages/front/list',{entity:'ver/'+entity,ename:ename,page:page,pages:pages,object:object,colors:colors,brands:brands,genders:genders,tag:await sails.helpers.getTag(req.hostname),seller:seller});
  },
  search: async(req, res) =>{
    let seller = null;
    let iridio = null;
    let ename=req.param('q');
    if(req.hostname!=='iridio.co' && req.hostname!=='demo.1ecommerce.app' && req.hostname!=='localhost' && req.hostname!=='1ecommerce.app'){
      seller = await Seller.findOne({domain:req.hostname/*'sanpolos.com'*/});
    }else{
      iridio = await Channel.findOne({name:'iridio'});
    }
    let AWS = require('aws-sdk');
    AWS.config.loadFromPath('./config.json');
    let csd = new AWS.CloudSearchDomain({endpoint: 'search-iridio-kqxoxbqunm62wui765a5ms5nca.us-east-1.cloudsearch.amazonaws.com'});
    let params = {
      query: ename,
      return: 'id',
      queryParser: 'simple',
      size:32,
      sort:'_score desc'
      /*cursor: 'STRING_VALUE',
      expr: 'STRING_VALUE',
      facet: 'STRING_VALUE',
      filterQuery: 'STRING_VALUE',
      highlight: 'STRING_VALUE',
      partial: true || false,
      queryOptions: 'STRING_VALUE',
      queryParser: simple | structured | lucene | dismax,
      size: 'NUMBER_VALUE',
      sort: 'STRING_VALUE',
      start: 'NUMBER_VALUE',
      stats: 'STRING_VALUE'*/
    };
    if(seller!==null){
      params.filterQuery = 'seller:\''+seller.name+'\'';
    }

    let exists = async (element,compare) =>{
      for(let c of element){
        if(c.id === compare.id){return true;}
      }
      return false;
    };

    csd.search(params, async (err, data) => {
      let colors = [];
      let brands = [];
      let genders = [];
      let response = {products:[]};
      let page = 1;
      let perPage = 32;
      let pages = 0;

      if(err){console.log(err, err.stack);}
      if(data.hits.found>0){
        let results = [];
        data.hits.hit.forEach(h =>{
          results.push(h.id);
        });

        let set = await Product.find({id:results,active:true})
        .populate('tax')
        .populate('manufacturer')
        .populate('mainColor')
        .populate('mainCategory')
        .populate('seller')
        .populate('gender');

        pages = Math.ceil(set.length/perPage);

        for(let p of set){
          p.cover= (await ProductImage.find({product:p.id,cover:1}))[0];
          let discounts = await sails.helpers.discount(p.id);
          if(iridio && discounts){
            let integrations = await ProductChannel.find({channel:iridio.id,product:p.id});
            integrations = integrations.map(itg => itg.integration);
            discounts = discounts.filter((ad)=>{if(ad.integrations && ad.integrations.length > 0 && integrations.length>0 && ad.integrations.some(ai => integrations.includes(ai.id))){return ad;}});
          }
          p.discount = discounts ? discounts[0] : null;
          p.price = (await ProductVariation.find({product:p.id}))[0].price;
          if(!await exists(colors, p.mainColor)){colors.push(p.mainColor);}
          if(!await exists(brands, p.manufacturer)){brands.push(p.manufacturer);}
          if(!await exists(genders, p.gender)){genders.push(p.gender);}
        }
        response['products'] = set;
      }
      return res.view('pages/front/list',{entity:'buscar',ename:ename,page:page,pages:pages,object:response,colors:colors,brands:brands,genders:genders,tag:await sails.helpers.getTag(req.hostname),seller:seller});
    });
  },
  listproduct: async function(req, res){
    let seller = null;
    let iridio = null;
    if(req.hostname!=='iridio.co' && req.hostname!=='demo.1ecommerce.app' && req.hostname!=='localhost' && req.hostname!=='1ecommerce.app'){
      seller = await Seller.findOne({domain:req.hostname/*'sanpolos.com'*/});
    }else{
      iridio = await Channel.findOne({name:'iridio'});
    }
    let product = await Product.findOne({name:decodeURIComponent(req.param('name')),reference:decodeURIComponent(req.param('reference'))})
      .populate('manufacturer')
      .populate('mainColor')
      .populate('mainCategory')
      .populate('tax')
      .populate('variations',{sort: 'createdAt ASC'})
      .populate('images')
      .populate('seller');
      
    if(req.session.viewed===undefined){
      req.session.viewed=[];
    }else{
      let exists = false;
      for(let i in req.session.viewed){
        if(req.session.viewed[i].product===product.id){
          req.session.viewed[i].viewedAt=moment().valueOf();
          exists=true;
        }
      }
      if(!exists){req.session.viewed.push({viewedAt:moment().valueOf(),product:product.id});}
    }
    let discounts = await sails.helpers.discount(product.id);
    if(iridio && discounts){
      let integrations = await ProductChannel.find({channel:iridio.id,product:product.id});
      integrations = integrations.map(itg => itg.integration);
      discounts = discounts.filter((ad)=>{if(ad.integrations && ad.integrations.length > 0 && integrations.length>0 && ad.integrations.some(ai => integrations.includes(ai.id))){return ad;}});
    }
    let discount = discounts ? discounts[0] : null;
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
      seller:seller});
  },
  variationPrices: async (req, res)=>{
    if (!req.isSocket) {
      return res.badRequest();
    }
    let prices ={};
    let iridio = null;
    if(req.body.hostname==='iridio.co' || req.body.hostname==='demo.1ecommerce.app' || req.body.hostname==='localhost' || req.body.hostname==='1ecommerce.app'){
      iridio = await Channel.findOne({name:'iridio'});
    }
    let productvariation = await ProductVariation.findOne({ id: req.body.variation});
    if(productvariation){
      let discounts = await sails.helpers.discount(productvariation.product,productvariation.id);
      if(iridio && discounts){
        let integrations = await ProductChannel.find({channel:iridio.id,product:productvariation.product});
        integrations = integrations.map(itg => itg.integration);
        discounts = discounts.filter((ad)=>{if(ad.integrations && ad.integrations.length > 0 && integrations.length>0 && ad.integrations.some(ai => integrations.includes(ai.id))){return ad;}});
      }
      let discount = discounts ? discounts[0] : null;
      prices.price = productvariation.price;
      if(discount){
        prices.highPrice = productvariation.price;
        prices.lowPrice = discount.price;
        prices.savings = discount.amount;
        prices.price = discount.price;
      }
    }
    return res.send(prices);
  },
  cms: async (req,res)=>{
    let seller = null;
    let contentfilter={
      position:'landing',
      active:true,
      url:req.param('route'),
      seller:seller
    };

    if(req.hostname!=='iridio.co' && req.hostname!=='demo.1ecommerce.app' && req.hostname!=='localhost' && req.hostname!=='1ecommerce.app'){seller = await Seller.findOne({domain:req.hostname/*'sanpolos.com'*/}); contentfilter.seller=seller.id;}
    cms = (await Cms.find(contentfilter))[0];
    return res.view('pages/front/cms',{content:cms.content,tag:await sails.helpers.getTag(req.hostname),seller:seller});
  },
  notificationml: async function(req, res){
    await sails.helpers.channel.successRequest(res);
    let moment = require('moment');
    let resource = req.body.resource;
    let userId = req.body.user_id;
    let topic = req.body.topic;
    let integration = await Integrations.findOne({useridml: userId}).populate('seller');
    if (integration) {
      let seller = integration.seller.id;
      const address = await Address.findOne({id: integration.seller.mainAddress}).populate('country');
      try {
        if (address.country.iso === 'CO') {
          switch (topic) {
            case 'questions':
              let question = await sails.helpers.channel.mercadolibre.findQuestion(integration.id, resource);
              let itemId = question.item_id;
              let productchan = await ProductChannel.findOne({channelid: itemId, integration: integration.id});
              if (productchan) {
                let questi = {
                  idMl: question.id,
                  seller: seller,
                  text: question.text,
                  status: question.status,
                  dateCreated: parseInt(moment(question.date_created).valueOf()),
                  product: productchan.product,
                  integration: integration.id
                };
                const existsQuest = await Question.findOne({idMl: question.id});
                if (existsQuest) {
                  questi = await Question.updateOne({id: existsQuest.id}).set({status: question.status});
                } else {
                  questi = await Question.create(questi).fetch();
                }
                if (question.answer !== null) {
                  await Answer.create({
                    text: question.answer.text,
                    status: question.answer.status,
                    dateCreated: parseInt(moment(question.answer.date_created).valueOf()),
                    question: questi.id
                  }).fetch();
                } else {
                  await sails.helpers.channel.chatBot(true, integration, question.text, 'question', question.id, questi.id);
                }
              }
              let questionsSeller = await Question.count({status: 'UNANSWERED', seller: seller});
              sails.sockets.blast('notificationml', {questionsSeller: questionsSeller, seller});
              break;
            case 'shipments':
              await sails.helpers.channel.mercadolibre.statusOrder(integration.id, resource);
              break;
            case 'orders_v2':
              await sails.helpers.channel.mercadolibre.orders(integration.id, resource);
              break;
            case 'items':
              await sails.helpers.channel.mercadolibre.productQc(integration.id, resource);
              break;
            case 'claims':
              await sails.helpers.channel.mercadolibre.claims(integration.id, resource);
              break;
            case 'messages':
              await sails.helpers.channel.mercadolibre.messages(integration.id, resource);
              break;
            default:
              break;
          }
        } else if (address.country.iso === 'MX') {
          switch (topic) {
            case 'questions':
              let question = await sails.helpers.channel.mercadolibremx.findQuestion(integration.id, resource);
              let itemId = question.item_id;
              let productchan = await ProductChannel.findOne({channelid: itemId, integration: integration.id});
              if (productchan) {
                let questi = {
                  idMl: question.id,
                  seller: seller,
                  text: question.text,
                  status: question.status,
                  dateCreated: parseInt(moment(question.date_created).valueOf()),
                  product: productchan.product,
                  integration: integration.id
                };
                const existsQuest = await Question.findOne({idMl: question.id});
                if (existsQuest) {
                  questi = await Question.updateOne({id: existsQuest.id}).set({status: question.status});
                } else {
                  questi = await Question.create(questi).fetch();
                }
                if (question.answer !== null) {
                  await Answer.create({
                    text: question.answer.text,
                    status: question.answer.status,
                    dateCreated: parseInt(moment(question.answer.date_created).valueOf()),
                    question: questi.id
                  }).fetch();
                } else {
                  await sails.helpers.channel.chatBot(true, integration, question.text, 'question', question.id, questi.id);
                }
              }
              let questionsSeller = await Question.count({status: 'UNANSWERED', seller: seller});
              sails.sockets.blast('notificationml', {questionsSeller: questionsSeller, seller});
              break;
            case 'shipments':
              await sails.helpers.channel.mercadolibremx.statusOrder(integration.id, resource);
              break;
            case 'orders_v2':
              await sails.helpers.channel.mercadolibremx.orders(integration.id, resource);
              break;
            case 'items':
              await sails.helpers.channel.mercadolibremx.productQc(integration.id, resource);
              break;
            case 'claims':
              await sails.helpers.channel.mercadolibremx.claims(integration.id, resource);
              break;
            case 'messages':
              await sails.helpers.channel.mercadolibremx.messages(integration.id, resource);
              break;
            default:
              break;
          }
        }
      } catch(err) {
        console.log(`Error ${err.message}`);
      }
    }
  },
  dafitiSync : async (req, res)=>{
    let data = req.body.payload;
    let identifier = req.param('identifier');
    let integration = await Integrations.findOne({key: identifier}).populate('channel');
    await sails.helpers.channel.successRequest(res);
    switch (req.body.event) {
      case 'onOrderCreated':
        if(identifier){
          let order = req.body.payload.OrderId;
          let data = await sails.helpers.channel.dafiti.orderbyid(integration.id,  integration.seller,  ['OrderId='+order]);
          let seller = await Seller.findOne({id: integration.seller});
          if (data && seller.integrationErp) {
            await sails.helpers.integrationsiesa.exportOrder(data);
          }
        }
        break;
      case 'onOrderItemsStatusChanged':
        let state = await sails.helpers.orderState(data.NewStatus);
        if (state) {
          let sign = await sails.helpers.channel.dafiti.sign(integration.id, 'GetOrder',integration.seller, ['OrderId='+data.OrderId]);
          let response = await sails.helpers.request(integration.channel.endpoint,'/?'+sign,'GET');
          let result = await JSON.parse(response);
          let dord = result.SuccessResponse.Body.Orders.Order;
          const order = await Order.findOne({channelref:data.OrderId});
          await Order.updateOne({id:order.id}).set({updatedAt:parseInt(moment(dord.UpdatedAt).valueOf()),currentstatus:state});
          for(let it of data.OrderItemIds){
            await OrderItem.updateOne({order: order.id, externalReference: it,updatedAt:parseInt(moment(dord.UpdatedAt).valueOf())}).set({currentstatus: state});
          }
          await OrderHistory.create({
            order:order.id,
            state:state,
            createdAt:parseInt(moment(dord.CreatedAt).valueOf()),
            updatedAt:parseInt(moment(dord.UpdatedAt).valueOf())
          });
          let seller = await Seller.findOne({id: order.seller});
          if (seller && seller.integrationErp && state) {
            let orderstate = await OrderState.findOne({id:state});
            let resultState = orderstate.name === 'en procesamiento' ? 'En procesa' : orderstate.name === 'reintegrado' ? 'Reintegrad' : orderstate.name.charAt(0).toUpperCase() + orderstate.name.slice(1);
            await sails.helpers.integrationsiesa.updateCargue(order.reference, resultState);
          }
          await sails.helpers.notification(order, state);
          break;
        }
      case 'onFeedCompleted':
        const feed = req.body.payload.Feed;
        await sails.helpers.channel.feedSync(integration, feed);
        break;
      case 'onProductCreated':
        const skus = req.body.payload.SellerSkus;
        await sails.helpers.channel.productSync(integration, skus);
        break;
      case 'onProductQcStatusChanged':
        const sellerSkus = req.body.payload.SellerSkus;
        await sails.helpers.channel.productQc(integration, sellerSkus);
        break;
      default:
        break;
    }
  },
  linioSync : async (req, res)=>{
    let data = req.body.payload;
    let identifier = req.param('identifier');
    let integration = await Integrations.findOne({key: identifier}).populate('channel');
    await sails.helpers.channel.successRequest(res);
    switch (req.body.event) {
      case 'onOrderCreated':
        if(identifier){
          let order = req.body.payload.OrderId;
          let data = await sails.helpers.channel.linio.orderbyid(integration.id, integration.seller,  ['OrderId='+order] );
          let seller = await Seller.findOne({id: integration.seller});
          if (data && seller.integrationErp) {
            await sails.helpers.integrationsiesa.exportOrder(data);
          }
        }
        break;
      case 'onOrderItemsStatusChanged':
        let state = await sails.helpers.orderState(data.NewStatus);
        if (state) {
          let sign = await sails.helpers.channel.linio.sign(integration.id, 'GetOrder',integration.seller, ['OrderId='+data.OrderId]);
          let response = await sails.helpers.request(integration.channel.endpoint,'/?'+sign,'GET');
          let result = await JSON.parse(response);
          let dord = result.SuccessResponse.Body.Orders.Order;
          const order = await Order.findOne({channelref:data.OrderId});
          await Order.updateOne({id:order.id}).set({updatedAt:parseInt(moment(dord.UpdatedAt).valueOf()),currentstatus:state});
          for(let it of data.OrderItemIds){
            await OrderItem.updateOne({order: order.id, externalReference: it,updatedAt:parseInt(moment(dord.UpdatedAt).valueOf())}).set({currentstatus: state});
          }
          await OrderHistory.create({
            order:order.id,
            state:state,
            createdAt:parseInt(moment(dord.CreatedAt).valueOf()),
            updatedAt:parseInt(moment(dord.UpdatedAt).valueOf())
          });
          let seller = await Seller.findOne({id: order.seller});
          if (seller && seller.integrationErp && state) {
            let orderstate = await OrderState.findOne({id:state});
            let resultState = orderstate.name === 'en procesamiento' ? 'En procesa' : orderstate.name === 'reintegrado' ? 'Reintegrad' : orderstate.name.charAt(0).toUpperCase() + orderstate.name.slice(1);
            await sails.helpers.integrationsiesa.updateCargue(order.reference, resultState);
          }
          await sails.helpers.notification(order, state);
          break;
        }
      case 'onFeedCompleted':
        const feed = req.body.payload.Feed;
        await sails.helpers.channel.feedSync(integration, feed);
        break;
      case 'onProductCreated':
        const skus = req.body.payload.SellerSkus;
        await sails.helpers.channel.productSync(integration, skus);
        break;
      case 'onProductQcStatusChanged':
        const sellerSkus = req.body.payload.SellerSkus;
        await sails.helpers.channel.productQc(integration, sellerSkus);
        break;
      default:
        break;
    }
  },
  liniomxSync : async (req, res)=>{
    let data = req.body.payload;
    let identifier = req.param('identifier');
    let integration = await Integrations.findOne({key: identifier}).populate('channel');
    await sails.helpers.channel.successRequest(res);
    switch (req.body.event) {
      case 'onOrderCreated':
        if(identifier){
          let order = req.body.payload.OrderId;
          await sails.helpers.channel.liniomx.orderbyid(integration.id, integration.seller,  ['OrderId='+order] );
        }
        break;
      case 'onOrderItemsStatusChanged':
        let state = await sails.helpers.orderState(data.NewStatus);
        if(state){
          let sign = await sails.helpers.channel.liniomx.sign(integration.id, 'GetOrder',integration.seller, ['OrderId='+data.OrderId]);
          let response = await sails.helpers.request(integration.channel.endpoint,'/?'+sign,'GET');
          let result = await JSON.parse(response);
          let dord = result.SuccessResponse.Body.Orders.Order;
          const order = await Order.findOne({channelref:data.OrderId});
          await Order.updateOne({id:order.id}).set({updatedAt:parseInt(moment(dord.UpdatedAt).valueOf()),currentstatus:state});
          for(let it of data.OrderItemIds){
            await OrderItem.updateOne({order: order.id, externalReference: it,updatedAt:parseInt(moment(dord.UpdatedAt).valueOf())}).set({currentstatus: state});
          }
          await OrderHistory.create({
            order:order.id,
            state:state,
            createdAt:parseInt(moment(dord.CreatedAt).valueOf()),
            updatedAt:parseInt(moment(dord.UpdatedAt).valueOf())
          });
          await sails.helpers.notification(order, state);
          break;
        }
      case 'onFeedCompleted':
        const feed = req.body.payload.Feed;
        await sails.helpers.channel.liniomx.feedSync(integration, feed);
        break;
      case 'onProductCreated':
        const skus = req.body.payload.SellerSkus;
        await sails.helpers.channel.liniomx.productSync(integration, skus);
        break;
      case 'onProductQcStatusChanged':
        const sellerSkus = req.body.payload.SellerSkus;
        await sails.helpers.channel.liniomx.productQc(integration, sellerSkus);
        break;
      default:
        break;
    }
  },
  buildmenu : async (req, res) =>{
    if (!req.isSocket) {
      return res.badRequest();
    }
    let space = parseInt(req.body.screen);
    
    if(!req.session.menu){
      req.session.menu = await sails.helpers.callMenu(req.body.hostname);
    }
    
    if(space<1024){
      return res.send(req.session.menu.navbarmobile);
    }else{
      return res.send(req.session.menu.navbar);
    }
    
  },
  downloadexcel: async function (req, res) {
    const Excel = require('exceljs');
    let products = req.body.products;
    let resultProducts = [];
    let workbook = new Excel.Workbook();
    let worksheet = workbook.addWorksheet('Inventario');
    worksheet.columns = [
      { header: 'Id', key: 'id', width: 26 },
      { header: 'Nombre', key: 'name', width: 45 },
      { header: 'Referencia', key: 'reference', width: 20 }
    ];
    worksheet.getRow(1).font = { bold: true };
    if (products[0].commission) {
      for (const order of products) {
        resultProducts.push(order.product);
      }
      worksheet.addRows(resultProducts);
    } else {
      worksheet.addRows(products);
    }
    const buffer = await workbook.xlsx.writeBuffer();
    return res.send(buffer);
  }
};
