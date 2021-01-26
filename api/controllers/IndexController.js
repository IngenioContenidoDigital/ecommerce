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

    if(req.hostname==='1ecommerce.app'){
      return res.redirect('/login');
    }
    if(req.hostname==='iridio.co' || req.hostname==='localhost'){
      slider = await Slider.find({active:true}).populate('textColor');
    }
    if(req.hostname==='sanpolos.com'){
      seller = await Seller.findOne({domain:req.hostname/*'sanpolos.com'*/});
      slider = await Slider.find({active:true, seller:seller.id}).populate('textColor');
    }
    let viewed=[];
    let brands = null;
    if(req.session.viewed!==undefined){
      for(let s in req.session.viewed){
        if(req.session.viewed[s]===null || req.session.viewed[s].viewedAt===undefined){
          req.session.viewed.splice(s,1);
        }
      }
      if(req.session.viewed.length>0){
        let psorted = req.session.viewed.sort((a,b) => b.viewedAt - a.viewedAt );
        let pshow =[];
        for(let i in psorted){
          if(!pshow.includes(psorted[i].product)){
            pshow.push(psorted[i].product);
          }
        }
        pshow = pshow.reverse().slice(-4);
        if(pshow.length>0){
          let products = await Product.find({id:pshow})
          .populate('mainColor')
          .populate('tax')
          .populate('gender')
          .populate('manufacturer')
          .populate('seller');

          for(let p of products){
            p.cover= await ProductImage.findOne({product:p.id,cover:1});
            p.discount = await sails.helpers.discount(p.id);
            viewed.push(p);
          }
        }
      }
    }
    if(req.hostname==='iridio.co' || req.hostname==='localhost'){
      brands = await Manufacturer.find({active:true}).sort('name ASC');
    }
    return res.view('pages/homepage',{slider:slider,tag:await sails.helpers.getTag(req.hostname),menu:await sails.helpers.callMenu(seller!==null ? seller.domain : undefined),viewed:viewed,brands:brands, seller:seller});
  },
  admin: async function(req, res){
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    let questions = 0;
    let questionsSeller = 0;
    let seller = req.session.user.seller || '';
    // let channel = await Channel.findOne({name: 'mercadolibre'});
    // let integration = await Integrations.findOne({seller: seller, channel: channel});
    if(rights.name !== 'superadmin' && rights.name !== 'admin'){
      questionsSeller = await Question.count({status: 'UNANSWERED', seller: seller});
    } else {
      questions = await Question.count({status: 'UNANSWERED'});
    }
    req.session.questions = 0;
    return res.view('pages/homeadmin',{layout:'layouts/admin'});
  },
  filterDashboard:async (req, res) =>{
    let moment = require('moment');
    if (!req.isSocket) {
      return res.badRequest();
    }
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
      let dataTop = await sails.helpers.dashboard.top10(rights.name, seller, dateStart, dateEnd);
      sails.sockets.blast('datadashboardtop', {
        topProductsCant: dataTop.topProductsCant,
        topProductsPrice: dataTop.topProductsPrice,
        lessProducts: dataTop.lessProducts,
        id: req.session.user.id
      });
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

    // let dataInventory = await sails.helpers.dashboard.inventory(rights.name, seller);
    // sails.sockets.blast('datadashboardinventory', {
    //   totalInventory: dataInventory.totalInventory,
    //   totalProductsReference: dataInventory.totalProductsReference,
    //   totalProductsReferenceInactive: dataInventory.totalProductsReferenceInactive,
    //   totalProductsReferenceActive: dataInventory.totalProductsReferenceActive,
    //   productsInventory: dataInventory.productsInventory,
    //   productsUnd: dataInventory.productsUnd,
    //   id: req.session.user.id
    // });

    return res.ok();
  },
  generateReport:async (req, res) =>{
    const Excel = require('exceljs');
    const moment = require('moment');
    moment.locale('es');
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if(rights.name!=='superadmin' && !_.contains(rights.permissions,'report')){
      throw 'forbidden';
    }
    let sellerId = req.param('seller');
    let month = req.param('month');
    let dateStart = new Date(moment(month, 'MMMM YYYY').subtract(1, 'months').startOf('month').format('YYYY/MM/DD')).valueOf();
    let dateEnd = new Date(moment(month, 'MMMM YYYY').subtract(1, 'months').endOf('month').add(1, 'days').format('YYYY/MM/DD')).valueOf();
    let orders = await Order.find({
      where: {
        seller: sellerId,
        updatedAt: { '>': dateStart, '<': dateEnd }
      }
    }).populate('customer').populate('currentstatus');
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
        item.color = product.mainColor.name;
        item.size = productVariation ? productVariation.variation.col : '';
        item.customer = order.customer.fullName;
        item.currentstatus = order.currentstatus.name;
        item.paymentMethod = order.paymentMethod;
        item.paymentId = order.paymentId;
        item.channel = order.channel;
        item.channelref = order.channelref;
        item.orderref = order.reference;
        item.tracking = order.tracking;
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
    const moment = require('moment');
    const pdf = require('html-pdf');
    let sellerId = req.param('seller');
    let month = req.param('month');
    let data = await sails.helpers.reportSeller(sellerId, month);
    let date = moment(month, 'MMMM YYYY').subtract(1, 'months').locale('es').format('MMMM YYYY');
    try {
      const html = `<html lang="en">
      <head>
        <meta charset="utf-8">
        <title>Template Report</title>
      </head>
      <body>
        <div style="padding: 0mm 6.5mm;">
          <div style="float: left; width: 50%;">
            <h5 style="color: #4a4a4a;font-size: 60%;font-weight: 400;line-height: 1.25;">`+ data.seller.name.toUpperCase() + `<br>NIT. ` + data.seller.dni + `</h5>
            <h5 style="color: #4a4a4a;font-size: 60%;font-weight: 400;line-height: 1.25;">`+ data.address.addressline1 +`<br>Tel. `+ data.seller.phone +`<br>`+ data.address.city.name.toUpperCase()+' - '+ data.address.country.name.toUpperCase()+`</h5>
          </div>
          <div style="float: left; width: 50%;margin-top: 7mm;">
            <img style="margin-left: 30%;width: 45mm;" src="https://s3.amazonaws.com/iridio.co/images/sellers/`+ data.seller.logo +`">
          </div>
        </div>
        <div style="padding: 0mm 6.5mm;">
          <div style="float: left; width: 50%;display: table;clear: both;">
            <h5 style="color: #4a4a4a;font-size: 60%;line-height: 1.25;font-weight: bold;">BALANCE CON CORTE A:<br>ELABORACIÓN:</h5>
          </div>
          <div style="float: left; width: 50%;">
            <h5 style="color: #4a4a4a;font-size: 60%;line-height: 1.25;font-weight: bold;margin-left: 30%;margin-top: 0%;">`+ date.toLocaleUpperCase() +`<br>`+ moment().format('L') +`</h5>
          </div>
        </div>
        <div style="padding: 0mm 6.5mm;display: table;clear: both;">
          <div style="float: left;width: 40.5%;">
            <h5 style="color: #4a4a4a;font-size: 60%;line-height: 1.25;font-weight: bold;margin-top: 8px;margin-bottom: 0px;">Ordenes (CR)</h5>
            <h5 style="color: #4a4a4a;font-size: 60%;line-height: 1.25;font-weight: bold;margin-top: 194px;margin-bottom: 0px;">Reembolsos (CAN)</h5>
            <h5 style="color: #4a4a4a;font-size: 60%;line-height: 1.25;font-weight: bold;margin-top: 40px;margin-bottom: 0px;">Otros Conceptos</h5>
            
            <div style="margin-top: 130px">
              <h5 style="color: #4a4a4a;font-size: 60%;line-height: 1.25;font-weight: bold;margin-top: 8px;margin-bottom: 0px;">Retencion por servicios</h5>
              <h5 style="color: #4a4a4a;font-size: 60%;line-height: 1.25;font-weight: bold;margin-top: 8px;margin-bottom: 0px;">Retencion de Ica 9,66/1000</h5>
              <h5 style="color: #4a4a4a;font-size: 60%;line-height: 1.25;font-weight: bold;margin-top: 8px;margin-bottom: 0px;">Ajuste al peso</h5>
            </div>
          </div>
          <div style="float: left;width: 28%;">
            <h5 style="color: #4a4a4a;font-size: 60%;line-height: 1.25;font-weight: bold;margin-top: 8px;margin-bottom: 0px;">Total 1Ecommerce</h5>
            <p style="color: #4a4a4a;font-size: 60%;font-weight: 400;line-height: 1.25;margin-top: 8px;margin-bottom: 0px;">Valor Pedidos Entregados</p>
            <p style="color: #4a4a4a;font-size: 60%;line-height: 1.25;font-weight: bold;margin-top: 8px;margin-bottom: 0px;">Otros Ingresos</p>
            <p style="color: #4a4a4a;font-size: 60%;font-weight: 400;line-height: 1.25;margin-top: 8px;margin-bottom: 0px;">Siniestros</p>
            <p style="color: #4a4a4a;font-size: 60%;font-weight: 400;line-height: 1.25;margin-top: 8px;margin-bottom: 0px;">Ajustes (CC)</p>
            <div style="margin-top: 30px">
              <p style="color: #4a4a4a;font-size: 60%;line-height: 1.25;font-weight: bold;margin-top: 8px;margin-bottom: 0px;">Cargos</p>
              <p style="color: #4a4a4a;font-size: 60%;font-weight: 400;line-height: 1.25;margin-top: 8px;margin-bottom: 0px;">Comisión 1Ecommerce</p>
              <p style="color: #4a4a4a;font-size: 60%;font-weight: 400;line-height: 1.25;margin-top: 8px;margin-bottom: 0px;">Penalidades (PEN)</p>
              <p style="color: #4a4a4a;font-size: 60%;font-weight: 400;line-height: 1.25;margin-top: 8px;margin-bottom: 0px;">Marketplace en siniestros</p>
            </div>
            <div style="margin-top: 30px">
              <p style="color: #4a4a4a;font-size: 60%;font-weight: 400;line-height: 1.25;margin-top: 8px;margin-bottom: 0px;">Ordenes devueltas y/o canceladas</p>
            </div>
            <div style="margin-top: 30px">
              <p style="color: #4a4a4a;font-size: 60%;font-weight: 400;line-height: 1.25;margin-top: 8px;margin-bottom: 0px;">Referencias Activas (SKU)</p>
              <p style="color: #4a4a4a;font-size: 60%;font-weight: 400;line-height: 1.25;margin-top: 8px;margin-bottom: 0px;">Fotografia (FTG)</p>
              <p style="color: #4a4a4a;font-size: 60%;font-weight: 400;line-height: 1.25;margin-top: 8px;margin-bottom: 0px;">Marketing (MKT)</p>
              <p style="color: #4a4a4a;font-size: 60%;font-weight: 400;line-height: 1.25;margin-top: 8px;margin-bottom: 0px;">Serv Envio (ENV)</p>
              <p style="color: #4a4a4a;font-size: 60%;font-weight: 400;line-height: 1.25;margin-top: 8px;margin-bottom: 0px;">Ajustes (CC - CAN)</p>
            </div>
          </div>
          <div style="float: left;width: 28%;">
            <div style="padding: 0rem 1.5rem;display: table;clear: both;">
              <div style="margin-left: 110px;float: left;width: 28%;">
                <p style="color: #4a4a4a;font-size: 60%;font-weight: 400;line-height: 1.25;margin-top: 8px;margin-bottom: 0px;">`+ Math.round(data.totalPrice).toLocaleString('es-CO') +`</p>
              </div>
            </div>
            <p style="color: #4a4a4a;font-size: 60%;font-weight: 400;line-height: 1.25;margin-top: 8px;margin-bottom: 0px;">`+ Math.round(data.totalPrice).toLocaleString('es-CO') +`</p>
            
            <div style="padding: 0rem 1.5rem;display: table;clear: both;">
              <div style="margin-left: 110px;float: left;width: 28%;">
                <p style="color: #4a4a4a;font-size: 60%;font-weight: 400;line-height: 1.25;margin-top: 91px;margin-bottom: 0px;">`+ Math.round(data.totalCommission).toLocaleString('es-CO') +`</p>
              </div>
            </div>
            <p style="color: #4a4a4a;font-size: 60%;font-weight: 400;line-height: 1.25;margin-top: 8px;margin-bottom: 0px;">`+ Math.round(data.totalCommission).toLocaleString('es-CO') +`</p>
            
            <div style="padding: 0rem 1.5rem;display: table;clear: both;">
              <div style="margin-left: 110px;float: left;width: 28%;">
                <p style="color: #4a4a4a;font-size: 60%;font-weight: 400;line-height: 1.25;margin-top: 54px;margin-bottom: 0px;">0</p>
              </div>
            </div>
            <p style="color: #4a4a4a;font-size: 60%;font-weight: 400;line-height: 1.25;margin-top: 8px;margin-bottom: 0px;">0</p>
            
            <div style="padding: 0rem 1.5rem;display: table;clear: both;">
              <div style="margin-left: 110px;float: left;width: 28%;">
                <p style="color: #4a4a4a;font-size: 60%;font-weight: 400;line-height: 1.25;margin-top: 20px;margin-bottom: 0px;">`+ Math.round(data.totalSku).toLocaleString('es-CO') +`</p>
              </div>
            </div>
            <p style="color: #4a4a4a;font-size: 60%;font-weight: 400;line-height: 1.25;margin-top: 5px;margin-bottom: 0px;">`+ Math.round(data.totalSku).toLocaleString('es-CO') +`</p>
    
            <div style="padding: 0rem 1.5rem;display: table;clear: both;">
              <div style="margin-top: 100px;float: left;width: 28%;margin-left: 110px;">
              <p style="color: #4a4a4a;font-size: 60%;font-weight: 400;line-height: 1.25;margin-top: 8px;margin-bottom: 0px;">`+ Math.round(data.totalRetFte).toLocaleString('es-CO') +`</p>
              <p style="color: #4a4a4a;font-size: 60%;font-weight: 400;line-height: 1.25;margin-top: 8px;margin-bottom: 0px;">`+ Math.round(data.totalRetIca).toLocaleString('es-CO') +`</p>
              </div>
            </div>
          </div>
        </div>
        <h2 style="color: #4a4a4a;font-size: 110%;line-height: 1.25;font-weight: bold;margin-top: 22px;margin-left: 306px;">Balance Total  $`+Math.round(data.totalBalance).toLocaleString('es-CO')+`</h2>
      </body>
    </html>`;
      const options = { format: 'Letter' };
      pdf.create(html, options).toBuffer((err, buffer) => {
        if (err) {return console.log(err);}
        return res.send(buffer);
      });
    } catch (err) {
      return res.notFound(err);
    }
  },
  showreport: async function(req, res){
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if(rights.name!=='superadmin' && !_.contains(rights.permissions,'report')){
      throw 'forbidden';
    }
    const moment = require('moment');
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
    if(req.hostname!=='iridio.co' && req.hostname!=='localhost' && req.hostname!=='1ecommerce.app'){seller = await Seller.findOne({domain:req.hostname/*'sanpolos.com'*/});}

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

    return res.view('pages/front/checkout', {addresses:addresses, cart:cart, error:error, tokens:tokens,tag:await sails.helpers.getTag(req.hostname),seller:seller});
  },
  list: async function(req, res){
    let entity = req.param('entity');
    let ename = req.param('name');
    let seller = null;
    let object = null;
    if(req.hostname!=='iridio.co' && req.hostname!=='localhost' && req.hostname!=='localhost'){seller = await Seller.findOne({domain:req.hostname/*'sanpolos.com'*/});}
    let exists = async (element,compare) =>{
      for(let c of element){
        if(c.id === compare.id){return true;}
      }
      return false;
    };
    switch(entity){
      case 'categoria':
        try{
          //let parent = await Category.findOne({url:req.param('parent')});
          if(seller===null){
            object = await Category.findOne({url:ename/*, parent:parent.id*/})
            .populate('products',{where:{active:true},sort: 'updatedAt DESC'})
            .populate('children');
          }else{
            object = await Category.findOne({url:ename/*, parent:parent.id*/})
            .populate('products',{where:{active:true, seller:seller.id},sort: 'updatedAt DESC'})
            .populate('children');
          }
          object.route = '/images/categories/';
          for(let c of object.children){
            c.parent = await Category.findOne({id:c.parent});
          }
        }catch(err){
          return res.notFound(err);
        }
        break;
      case 'marca':
        try{
          if(seller===null){
            object = await Manufacturer.findOne({url:ename}).populate('products',{where:{active:true},sort: 'updatedAt DESC'});
          }else{
            object = await Manufacturer.findOne({url:ename}).populate('products',{where:{active:true, seller:seller.id},sort: 'updatedAt DESC'});
          }
          object.route = '/images/brands/';
        }catch(err){
          return res.notFound(err);
        }
        break;
      default:
        return res.notFound();
    }

    let colors = [];
    let brands = [];
    let genders = [];

    object.products.forEach(async p=>{
      p.cover= await ProductImage.findOne({product:p.id,cover:1});
      p.mainColor=await Color.findOne({id:p.mainColor});
      p.manufacturer=await Manufacturer.findOne({id:p.manufacturer});
      p.seller=await Seller.findOne({id:p.seller});
      p.tax=await Tax.findOne({id:p.tax});
      p.discount = await sails.helpers.discount(p.id);
      p.gender = await Gender.findOne({id:p.gender});

      if(!await exists(colors, p.mainColor)){colors.push(p.mainColor);}
      if(!await exists(brands, p.manufacturer)){brands.push(p.manufacturer);}
      if(!await exists(genders, p.gender)){genders.push(p.gender);}

    });
    return res.view('pages/front/list',{object:object,colors:colors,brands:brands,genders:genders,tag:await sails.helpers.getTag(req.hostname),menu:await sails.helpers.callMenu(seller!==null ? seller.domain : undefined),seller:seller});
  },
  search: async(req, res) =>{
    let seller = null;
    if(req.hostname!=='iridio.co' && req.hostname!=='localhost' && req.hostname!=='1ecommerce.app'){seller = await Seller.findOne({domain:req.hostname/*'sanpolos.com'*/});}
    let AWS = require('aws-sdk');
    AWS.config.loadFromPath('./config.json');
    let csd = new AWS.CloudSearchDomain({endpoint: 'search-iridio-kqxoxbqunm62wui765a5ms5nca.us-east-1.cloudsearch.amazonaws.com'});
    let params = {
      query: req.param('q'),
      return: 'id',
      queryParser: 'simple',
      size:50,
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
      params.filterQuery = 'seller:\''+seller.id+'\'';
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
        .populate('seller')
        .populate('gender');

        for(let p of set){
          p.cover= await ProductImage.findOne({product:p.id,cover:1});
          p.discount = await sails.helpers.discount(p.id);
          if(!await exists(colors, p.mainColor)){colors.push(p.mainColor);}
          if(!await exists(brands, p.manufacturer)){brands.push(p.manufacturer);}
          if(!await exists(genders, p.gender)){genders.push(p.gender);}
        }
        response['products'] = set;
      }
      return res.view('pages/front/list',{object:response,colors:colors,brands:brands,genders:genders,tag:await sails.helpers.getTag(req.hostname),menu:await sails.helpers.callMenu(seller!==null ? seller.domain : undefined),seller:seller});
    });
  },
  listproduct: async function(req, res){
    let seller = null;
    if(req.hostname!=='iridio.co' && req.hostname!=='localhost' && req.hostname!=='1ecommerce.app'){seller = await Seller.findOne({domain:req.hostname/*'sanpolos.com'*/});}
    let moment = require('moment');
    let product = await Product.findOne({name:decodeURIComponent(req.param('name')),reference:decodeURIComponent(req.param('reference'))})
      .populate('manufacturer')
      .populate('mainColor')
      .populate('tax')
      .populate('variations')
      .populate('images');

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
      menu:await sails.helpers.callMenu(seller!==null ? seller.domain : undefined),seller:seller});
  },
  cms: async (req,res)=>{
    let seller = null;
    if(req.hostname!=='iridio.co' && req.hostname!=='localhost' && req.hostname!=='1ecommerce.app'){seller = await Seller.findOne({domain:req.hostname/*'sanpolos.com'*/});}
    let content = '';
    switch(req.param('tipo')){
      case 'terminos-y-condiciones':
        content=`
        <div class="columns">
        <div class="column is-3">
        <div class="is-x-small has-text-black">
      <ul>
        <li><a class="has-text-dark" id="btn1" target="faq-tabs-1">TÉRMINOS Y CONDICIONES GENERALES</a></li>
        <li><a class="has-text-dark" id="btn2" target="faq-tabs-2">1. REGISTRO DEL CLIENTE EN EL PORTAL</a></li>
        <li><a class="has-text-dark" id="btn3" target="faq-tabs-3">2. FORMACIÓN DEL CONSENTIMIENTO DE COMPRA</a></li>
        <li><a class="has-text-dark" id="btn4" target="faq-tabs-4">3. PROMOCIONES</a></li>
        <li><a class="has-text-dark" id="btn5" target="faq-tabs-5">4. PROPIEDAD INTELECTUAL</a></li>
        <li><a class="has-text-dark" id="btn6" target="faq-tabs-6">5. PRODUCTOS</a></li>
        <li><a class="has-text-dark" id="btn7" target="faq-tabs-7">6. FACTURA</a></li>
        <li><a class="has-text-dark" id="btn8" target="faq-tabs-8">7. DERECHO DE RETRACTO, POLÍTICA DE CAMBIOS DE PRODUCTOS Y REVERSIÓN DEL PAGO</a></li>
        <li><a class="has-text-dark" id="btn9" target="faq-tabs-9">8. POLÍTICA DE TRATAMIENTO DE DATOS</a></li>
        <li><a class="has-text-dark" id="btn10" target="faq-tabs-10">9. MODIFICACIONES Y SOBRECARGOS</a></li>
        <li><a class="has-text-dark" id="btn11" target="faq-tabs-11">10. FUNCIONAMIENTO DEL PORTAL</a></li>
        <li><a class="has-text-dark" id="btn12" target="faq-tabs-12">11. LEY APLICABLE</a></li>
        <li><a class="has-text-dark" id="btn13" target="faq-tabs-13">12. CONTACTO</a></li>
        <li><a class="has-text-dark" id="btn14" target="faq-tabs-14">13. TÉRMINOS Y CONDICIONES GENERALES DE USO PARA PAGADORES</a></li>
      </ul>
      </div>
      </div>
      <div class="column is-9">
      <!----------------------------TÉRMINOS Y CONDICIONES GENERALES – INGENIO CONTENIDO DIGITAL SAS – INGENIO ------------------------------>
      <div id="faq-tabs-1" class="terms container is-size-7">
        <h2>TÉRMINOS Y CONDICIONES GENERALES</h2>
        <br>
        <p>A CONTINUACIÓN, SE DESCRIBEN LOS TÉRMINOS Y CONDICIONES GENERALES QUE REGULAN EL ACCESO, USO, REGISTRO Y REALIZACIÓN DE TRANSACCIONES COMERCIALES SOBRE LOS BIENES Y SERVICIOS OFRECIDOS DENTRO O A TRAVÉS DEL PORTAL WEB Y/O DE LAS APLICACIONES MÓVILES QUE ÉSTE ADMINISTRE (EN ADELANTE EL “PORTAL”) Y/U OTROS DOMINIOS O PORTALES RELACIONADOS.</p>
    
        <p><b>INGENIO CONTENIDO DIGITAL S.A.S.</b> es una sociedad comercial legalmente creada bajo las leyes de la República de Colombia, quien para todos los efectos del presente documento se denominará “INGENIO”.  Cualquier persona que se registre en el Portal y/o que realice una transacción comercial en este, declara que conoce y acepta todas y cada una de las disposiciones establecidas en los presentes Términos y Condiciones. En consecuencia, todos los actos y contratos que se celebren en o a través del Portal quedarán sujetos a las disposiciones contenidas en el presente documento y en la legislación colombiana vigente aplicable.<br>
    Los presentes Términos y Condiciones se referirán como el o los “Cliente(s)” conjuntamente a los visitantes del Portal, a los potenciales compradores y a los compradores.  Cualquier persona que no acepte estos Términos y Condiciones y la Política de Tratamiento de Datos de INGENIO, los cuales tienen carácter obligatorio y vinculante, deberá abstenerse de utilizar, acceder, registrarse o realizar cualquier acto de comercio en él o a través del Portal.</p>
    
      </div>
    <!----------------------------FIN TÉRMINOS Y CONDICIONES GENERALES – INGENIO CONTENIDO DIGITAL SAS – INGENIO------------------------------>
    <!----------------------------REGISTRO------------------------------>
      <div id="faq-tabs-2" class="terms container is-size-7 is-hidden">
        <h2>1. REGISTRO DEL CLIENTE EN EL PORTAL</h2>
        <br>
        <p>El registro en el Portal tiene por objeto permitir al Cliente inscribirse, acceder, usar y realizar transacciones comerciales a través del mismo. El Cliente tiene dos (2) opciones para registrarse:</p>
        <ul>
            <li class="ui-corner-left"><b>Inscribirse a través de aplicaciones de terceros,</b> tales como, pero sin limitarse a: Facebook, Google, Instagram o LinkedIn (en adelante “Aplicaciones de Terceros”). En este caso, el Cliente autoriza y entiende que INGENIO podrá recopilar otro tipo de información que esté disponible en su(s) cuenta(s) registrada(s) en las Aplicaciones de Terceros, tales como pero sin limitarse a nombre y apellidos, foto(s) de perfil, país y ciudad de residencia, correo electrónico, teléfono y fecha de nacimiento, entre otros; el Cliente declara entender y aceptar que las Aplicaciones de Terceros tienen sus propios términos y condiciones de uso y políticas de privacidad sin que INGENIO tenga ninguna injerencia sobre las mismas, ni sobre las características, actividades, anuncios, comportamientos y/o contenidos publicados, y mucho menos sobre las transacciones que el Cliente pueda realizar a través de dichas Aplicaciones de Terceros.</li>
            <li class="ui-corner-left"><b>Inscribirse directamente a través del Portal,</b> donde se solicitará el suministro de los datos personales básicos del Cliente, incluyendo pero sin limitarse a: (i) nombre y apellidos; (ii) cédula de ciudadanía o número de identificación; (iii) fecha de nacimiento; (iv) género; (v) correo electrónico; (vi) contraseña.  En caso que el Cliente realice una compra deberá suministrar adicionalmente, entre otros, (i) dirección, municipio y departamento; (ii) teléfono fijo y/o teléfono móvil.<br>
    El Cliente al ingresar sus datos declara bajo juramento que los mismos corresponden a información veraz y vigente.  INGENIO no se hace responsable por la certeza de los datos personales otorgados y/o suministrados por los Clientes.<br>
    Cada Cliente podrá ser titular de una sola cuenta en el Portal. En caso que INGENIO evidencie que una cuenta o registro está siendo utilizada para fines fraudulentos, indebidos o que contraríen la buena fé y/o las buenas costumbres, o no pueda confirmar el origen de la misma, INGENIO estará facultado para eliminar o suspender el registro en el Portal, así como para iniciar las acciones legales a que haya lugar.<br>
    El acceso, uso, registro y las transacciones comerciales que se lleven a cabo a través del Portal deberán ser realizados por personas mayores de edad.<br>
    Los datos de registro de los Clientes serán recolectados, almacenados y utilizados por INGENIO conforme a la Política de Tratamiento de Datos Personales de INGENIO que se encuentra publicada en el <a href="/politica-de-privacidad">siguiente link</a>.  Solamente podrán acceder, usar, registrarse o realizar cualquier acto de comercio en o a través del Portal las personas que tengan capacidad legal para contratar y obligarse, es decir aquellas personas mayores de dieciocho (18) años. En consecuencia, con el registro el Cliente declara y certifica que INGENIO no se hace responsable por la información que suministren sus Clientes incluyendo su fecha de nacimiento y el número de identificación, entre otros.<br>
    Si eventualmente las operaciones y/o transacciones fuesen realizadas por menores de edad las mismas se entenderán efectuadas bajo la responsabilidad de sus padres y/o acudientes.  La realización la compras en el Portal requerirá, según el medio de pago seleccionado, el suministro de información financiera, incluyendo información específica de la tarjeta de crédito o débito, teléfono y dirección de envío. INGENIO no almacena ni guarda ninguna información relacionada con datos bancarios o información financiera del Cliente.<br>
    INGENIO se reserva el derecho, en cualquier momento de: (i) Contactar y solicitar información adicional con el fin de corroborar datos personales; (ii) Suspender temporal o definitivamente las compras de aquellos Clientes cuyos datos no hayan podido ser confirmados, sean sospechosos o que sean identificados como posiblemente fraudulentos; (iii) Eliminar cualquier registro previamente aceptado; (iv) Rechazar cualquier nueva solicitud, sin que esté obligado a comunicar o exponer las razones de su decisión, y sin que ello genere algún derecho a indemnización o resarcimiento a favor del Cliente.</li>
        </ul>
        <h3>1.1. CLAVE SECRETA</h3>
        <p>Una vez registrado en el Portal, el Cliente deberá ingresar la clave secreta que le ha sido asignada para poder ingresar a su cuenta y/o para realizar compras. Lo anterior permitirá el acceso personalizado, confidencial y seguro del Cliente al Portal. La clave secreta es personal e intransferible, razón por la cual todas las operaciones efectuadas desde la cuenta son y serán siempre de absoluta responsabilidad del Cliente.<br>
    La entrega de la Clave Secreta a terceras personas o su utilización no implicará responsabilidad alguna para INGENIO. El Cliente tendrá la posibilidad de cambiar la clave de acceso en cualquier momento, para lo cual deberá sujetarse al procedimiento establecido en el Portal.  En el evento en que el Cliente tenga conocimiento de algún acceso y/o uso indebido de su cuenta por parte de un tercero deberá comunicarlo de manera inmediata al área de servicio al Cliente de INGENIO, por cualquiera de los canales de atención dispuestos:  contacto@ingeniocontenido.co o teléfono en la ciudad de Bogotá D.C. 7424498.</p>
        <h3>1.2. PROCEDIMIENTO PARA HACER USO DE ESTE PORTAL</h3>
        <p>En el Portal se informan los pasos que deben seguirse para comprar productos a través del Portal, así como los diferentes canales de atención disponibles para identificar, actualizar y corregir sus datos, según la pólitica de tratamiento de datos de INGENIO.<br>
    El uso de las tarjetas bancarias aceptadas en el Portal, esta sujeto al contrato existente entre el Cliente y el Banco emisor, sin que INGENIO tenga responsabilidad o injerencia alguna en relación con los aspectos señalados en los mismos. La información sobre los datos de sus cuentas bancarias, tarjetas de crédito y tarjetas débito son administrados exclusivamente por los terceros que brinden este servicio para INGENIO, sin que INGENIO tenga ningún tipo de responsabilidad en la administración, operación y/o almacenamiento de los mismos. Cualquier reclamación atinente al uso y pago a través de tarjetas bancarias deberá realizarse directamente ante el tercero indicado.<br>
    En el evento en que INGENIO identifique que el Cliente está haciendo un uso inadecuado o indebido del Portal, tal como pero sin limitarse a, dos o más cancelaciones repetitivas, fraude, entre otros, sin importar el medio de pago utilizado, INGENIO tendrá la facultad de bloquear al Cliente, sin que este tenga la facultad ni el derecho a pedir ningún tipo de indemnización por dicha situación.  Cuando el Cliente tenga alguna duda o inquietud frente al proceso de compra en el Portal podrá comunicarse con los canales de atención de servicio al cliente, quienes les brindarán soporte y ayuda frente al mismo.</p>
    </div>
    <!----------------------------FIN REGISTRO------------------------------>
    <!----------------------------2. FORMACIÓN DEL CONSENTIMIENTO DE COMPRA------------------------------>
      <div id="faq-tabs-3" class="terms container is-size-7 is-hidden">
        <h2>2. FORMACIÓN DEL CONSENTIMIENTO DE COMPRA</h2>
        <br>
        <p>El consentimiento por parte del Cliente se manifiesta con la realización y aceptación de cada uno de los pasos de compra del Portal y se perfecciona con la manifestación final de compra después de haber revisado el resumen del pedido en el cual se encuentran detallados cada uno de los productos, su precio individual, los gastos de envío (en caso de ser aplicable), los demás que tenga a su cargo, y la sumatoria total que el Cliente debe cancelar. 
    Al momento de realizar la orden de pedido, INGENIO expedirá una confirmación y acuse de recibo del pedido al correo electrónico informado por el Cliente al momento del registro.</p>
      </div>
    <!----------------------------FIN 2. FORMACIÓN DEL CONSENTIMIENTO DE COMPRA------------------------------>
    <!----------------------------3. PROMOCIONES:----------------------------->
      <div id="faq-tabs-4" class="terms container is-size-7 is-hidden">
        <h2>3. PROMOCIONES</h2>
        <br>
        <h3>3.1. Comunicaciones Promocionales o Publicitarias</h3>
        <p>El Cliente autoriza expresamente a INGENIO y/o a sus proveedores, vinculados o relacionados para que le sean enviados boletines de noticias al correo electrónico registrado en el Portal, que podrán incluir promociones conforme a las características de cada Cliente, según las compras realizadas y enlaces visitados, de acuerdo con la autorización que imparten al realizar el registro en el Portal. 
    El Cliente podrá solicitar la suspensión de toda comunicación promocional o publicitaria enviada a su correo electrónico enviando una solicitud en tal sentido a: contacto@ingeniocontenido.co, a través de nuestros canales de atención de servicio al cliente o en el botón de cancela la suscripción que se encuentra en la parte inferior de cada uno de los boletines.</p>
        <h3>3.2. Uso de Cupones</h3>
        <p>INGENIO en cualquier momento podrá expedir cupones de descuento para promover la adquisición de los Productos comercializados a través del Portal.  
    El uso de un cupón de descuento no es acumulable con otras promociones o descuentos a menos que se establezca lo contrario en el mismo; no es transferible a terceros, ni canjeable por dinero u otros productos, y sólo podrá ser usado por una única vez por cada Cliente registrado en el Portal.  En el cupón de descuento se indicará la fecha de vigencia, y las demás condiciones que apliquen, tales como pero sin limitarse a: vigencia, condiciones, productos seleccionados, compras mínimas requeridas, entre otras.  El uso y aplicación de valores de descuento descritos en el cupón están 100% sujetos al correcto uso del mismo, es decir, antes de finalizar la compra el usuario debe hacer CLICK en el botón “USAR CUPÓN” para que el descuento sea aplicado en la respectiva compra. Si el cupón se usa correctamente el valor del descuento se verá reflejado en el carrito de compra.   Ningún cupón será redimible o reembolsable en efectivo, cheque, devolución a la tarjeta de crédito o débito, y en general por ningún otro medio de pago, sin perjuicio de lo dispuesto en el numeral (i) siguiente. En el evento en que el Cliente utilice el cupón y posteriormente proceda a ejercer el derecho de retracto sobre el producto adquirido, se dará aplicación a una de las siguientes opciones, según sea el caso:</p>
        <ul>
            <li class="ui-corner-left">Si el cupón fue creado para un Cliente en particular y para su uso exclusivo y personal, se le expedirá un nuevo cupón para que sea utilizado en otra compra, bajo las mismas condiciones del cupón inicial.</li>
            <li class="ui-corner-left">Si el cupón fue creado para el público en general, para la totalidad o para un segmento especial de los Clientes que ya se encuentran registrados, para publicidad de compras en las aplicaciones móviles, es, decir,  no fue creado para un Cliente en particular, el cupón se extinguirá con su uso en la primera compra y en consecuencia no será redimible nuevamente.</li>
        </ul>
        <h3>3.3. Vigencia y Condiciones de Promociones</h3>
        <p>Las ofertas y/o promociones tendrán la vigencia indicada y comunicada al Cliente. En caso de estar sujetas a disponibilidad de inventarios, se entenderá que la promoción se extiende hasta agotar el inventario destinado para esa oferta o hasta la fecha de vigencia indicada para la misma, lo que suceda primero. 
    Las promociones no son acumulables con otras promociones o descuentos a menos de que en el Portal o promoción se especifique lo contrario. Cuando el Cliente usa el cupón o lo redime (hace CLICK en el botón “USAR CUPON”) las ofertas o promociones acepta íntegramente las condiciones para acceder a estas y los presentes Términos y Condiciones. </p>
      </div>
    <!----------------------------FIN 3. PROMOCIONES:------------------------------>
    <!----------------------------4. PROPIEDAD INTELECTUAL------------------------------>
      <div id="faq-tabs-5" class="terms container is-size-7 is-hidden">
        <h2>4. PROPIEDAD INTELECTUAL</h2>
        <br>
        <p>Los derechos de propiedad intelectual sobre el Portal y sobre todo el contenido publicado en el mismo son de propiedad exclusiva de INGENIO o han sido licenciados a éste por sus terceros proveedores y/o aliados. Queda expresamente prohibida la reproducción, copia, alteración, modificación, divulgación, reutilización total o parcial de todo material publicado en el Portal, sin la previa autorización expresa y por escrito por parte de INGENIO.</p>    
      </div>
    <!----------------------------FIN 4. PROPIEDAD INTELECTUAL------------------------------>
    <!----------------------------5. PRODUCTOS------------------------------>
      <div id="faq-tabs-6" class="terms container is-size-7 is-hidden">
        <h2>5. PRODUCTOS</h2>
        <br>
        <h3>5.1. Tallas</h3>
        <p>El Cliente al momento de seleccionar un producto deberá escoger y seleccionar la talla del mismo en el Portal. El Cliente declara entender y aceptar que la talla indicada en los productos y en la caja de empaque de los mismos, puede variar y diferir con la que normalmente el Cliente usa en Colombia, dado que el fabricante utiliza sus propias tallas y muchas veces las mismas se encuentran de acuerdo con la costumbre internacional del país de origen del fabricante o productor.  Es importante advertir que tratándose de calzado pueden variar las tallas dependiendo si se trata de zapatos, sandalias, botas o tenis deportivos, como también el tipo de medias que se utilicen con los mismos. Es responsabilidad del Cliente revisar muy bien las indicaciones informadas en el Portal y en caso de alguna duda puede solicitar la información que considere necesaria a través del área de servicio al Cliente de INGENIO. El cambio del producto por una talla diferente será procedente de acuerdo a lo establecido en los numerales 7.1 “Derecho de Retracto” y 7.4.1 “Cambio por talla”. </p>
        <h3>5.2. Colores</h3>
        <p>INGENIO ha realizado su mayor esfuerzo para que los colores de los productos que se ven en las fotos sean lo más cercanos posible a la realidad. Sin embargo, el color de los productos puede cambiar o variar por factores como la luz, el contraste, la calidad del monitor del computador en el que se visualizan, entre otros. INGENIO no puede garantizar que los colores que se visualizan en el Portal correspondan exactamente a los de la realidad de los Productos.</p>
        <h3>5.3. Inventarios Agotados</h3>
        <p>El Cliente declara entender y aceptar que entre el momento en que realiza la selección del Producto en el Portal y el momento en el que efectivamente se realiza la aceptación de la transacción por parte de la respectiva entidad financiera, el producto seleccionado se puede agotar, razón por la cual INGENIO queda facultado para devolver la transacción y en consecuencia devolver el dinero pagado por el producto agotado, en caso que dicha situación se llegue a presentar. De presentarse dicha situación, INGENIO procederá de manera oportuna a informar esta situación al Cliente, sin que la misma genere responsabilidad alguna para INGENIO, ni la facultad de solicitar indemnización de perjuicios por parte del Cliente.</p>
        <h3>5.4. Precios</h3>
        <p>Todos los precios de los productos publicados en el Portal están expresados en pesos colombianos y corresponden al precio unitario de cada producto. No incluyen gastos adicionales de envío, ni ningún otro gasto adicional.<br>
    Los gastos adicionales, como impuestos o envíos que se causen por motivo de la compra, se indicarán e informarán en la Orden de Pedido, previa a la aceptación de la Orden de Pedido.</p>
        <p><b>5.4.1. Precios Tachados</b> Cuando en el Portal se muestre un precio tachado en los productos y en su lugar se indique otro precio de venta, dicho precio tachado corresponde al precio que anteriormente tenía el producto, y el precio que no se encuentra tachado corresponde al nuevo precio que debe pagar el Cliente. Siempre el precio tachado será superior al nuevo ofrecido por INGENIO, y en caso en que así no lo sea, el Cliente solamente estará obligado a pagar el que resulte ser menor entre ambos precios indicados. Se deja publicado el precio tachado para que el Cliente evidencie la disminución del precio inicial de venta de los productos que realizó INGENIO por mera libertad.</p>
        <p><b>5.4.2. Precios de productos vendidos por INGENIO bajo la modalidad de Retail</b> Los precios de los productos vendidos directamente por INGENIO solo tendrán vigencia y aplicación en esta modalidad, y no serán aplicables a otros canales de venta de las “Tiendas Asociadas”; ni a los productos ofrecidos bajo la modalidad de Marketplace (ver “TÉRMINOS Y CONDICIONES MODALIDAD MARKETPLACE PRODUCTOS VENDIDOS POR TERCEROS ALIADOS-TIENDAS ASOCIADAS”), ni a las las ventas físicas, ventas telefónicas, por catálogo o por otro sitio web.  Debajo de la descripción de cada producto siempre se indica quien es el proveedor y responsable por el despacho del producto.</p>
        <p><b>5.4.3. Precio Productos Agrupados</b> En el Portal existe una herramienta que agrupa los productos que se encuentran disponibles en diferentes colores, sin embargo, solamente se muestra el precio del producto que se ve y describe en la primera imagen. En razón a lo anterior, el Cliente declara entender y aceptar que el precio de los productos puede cambiar dependiendo del color que escoja.</p>
        <p><b>5.4.4 Errores Tipográficos</b> INGENIO comercializa sus productos a través del Portal que se define como una plataforma tecnológica; en este sentido es probable que por errores en el sistema o por errores tipográficos se pueda presentar un precio incorrecto. El Cliente declara entender y aceptar que en el evento en que lo anterior llegase a ocurrir, INGENIO le informará tal circunstancia y podrá cancelar la(s) orden(es) de compra que contenga(n) el(los) producto(s) cuyo(s) precio(s) sea(n) incorrecto(s), procediendo a realizar la devolución del dinero por este concepto.</p>
        <h3>5.5 Envío y Entrega</h3>
        <p><b>5.5.1.</b> INGENIO comercializa sus productos a través del Portal que se define como una plataforma tecnológica; en este sentido es probable que por errores en el sistema o por errores tipográficos se pueda presentar un precio incorrecto. El Cliente declara entender y aceptar que en el evento en que lo anterior llegase a ocurrir, INGENIO le informará tal circunstancia y podrá cancelar la(s) orden(es) de compra que contenga(n) el(los) producto(s) cuyo(s) precio(s) sea(n) incorrecto(s), procediendo a realizar la devolución del dinero por este concepto.</p>
        <p><b>5.5.2.</b> En caso que el pago del Producto sea contra entrega, será obligación del Cliente pagar en efectivo o mediante datáfono antes de recibir el Producto. Es obligación del Cliente inspeccionar el Producto inmediatamente después de la entrega.<br>
    En el evento en que el Cliente detecte que el empaque de el(los) Producto(s) se encuentra deteriorado o abierto, debe proceder a abrir el mismo y constatar el estado de el(los) mismo(s), y dejar constancia por escrito de tal situación ante la presencia del funcionario de la empresa prestadora del servicio de transporte de INGENIO. De igual manera, en caso de presentarse cualquier falla, defecto o daño en el Producto, el Cliente deberá comunicarse con el área de servicio al cliente e informar tal situación y entregar y poner el producto a disposición de INGENIO dentro de los cuarenta y cinco (45) días calendario de vigencia del “DERECHO DE RETRACTO”).</p>
        <p><b>5.5.3.</b> Una vez el Cliente o la persona designada por éste, como por ejemplo la empleada doméstica o el vigilante del edificio o conjunto residencial, haya recibido el Producto, INGENIO no será responsable por la pérdida o destrucción del Producto entregado.</p>
        <p><b>5.5.4.</b> Si la entrega del Producto se retrasa: i) Porque el Cliente se niega a recibirla sin justificación alguna; ii) Por no haberla recibido dentro de las dos (2) semanas siguientes contadas a partir del primer intento de entrega por parte de la empresa del servicio de transporte o; iii) Por la incapacidad de la empresa prestadora del servicio de transporte de encontrar la dirección que ha sido suministrada de manera equivocada por parte del Cliente, INGENIO podrá (sin perjuicio a ejercer otro derecho o recurso disponible) no realizar la entrega del Producto y en consecuencia proceder a notificar al Cliente que la orden de pedido ha sido cancelada por su incumplimiento, en cuyo caso se reintegrará al Cliente la totalidad del dinero pagado.</p>
        <p><b>5.5.5.</b> El costo de envío del Producto se establecerá dependiendo de la ciudad o municipio donde el Cliente quiera recibir el Producto, el valor a pagar por los productos, y el tipo de servicio de entrega que escoja.  Dicho valor se le informará al Cliente en el resumen reflejado en el carrito de compra al momento de realizar la transacción en el Portal.  El servicio de envío tiene costo siempre que las compras sean inferiores a $129.900 y éste dependerá de la ubicación de la dirección proporcionada por el Cliente, dependiendo del municipio o ciudad donde se encuentre. Si las compras son iguales o superiores a $129.900, el envío es totalmente gratis para las localidades definidas por INGENIO como “NACIONAL 1” Y “NACIONAL 2”. Las localidades que INGENIO denomine como “TRAYECTO ESPECIAL 1” y “TRAYECTO ESPECIAL 2” tendrán un costo sin importar el valor de la compra. El Cliente puede ver la tabla de precios de envío por ciudad en el siguiente enlace Tabla de costos por ciudad. Si la compra es inferior o igual a $49.900, el Cliente incurrirá en un mayor costo de envío, el cual podrá ser validado en el siguiente enlace Tabla de costos por ciudad.</p>
        <p><b>5.5.6.</b> Envíos especiales. La compañía ofrece los servicios de envíos especiales que se describen más adelante. INGENIO se reserva el derecho de activar o desactivar en cualquier momento y sin previa autorización o aviso al Cliente tales servicios especiales, siempre y cuando, el Cliente no haya realizado una compra con este servicio.  El costo que debe asumir el Cliente por dichos servicios serán publicados en el carrito de compra previo al momento del pago.  Los Envíos Especiales son:</p>
        <ul>
            <li class="ui-corner-left"><b>Entrega Mismo Día (EMD):</b> Este servicio estará disponible solo para entregas el mismo día en Bogotá a excepción de los barrios mencionados en: listado de barrios que no cubren este servicio.  Este servicio estará activo solo los días hábiles. Para que la entrega se pueda efectuar el mismo día, la compra debe realizarse por el Cliente antes de las 11:59 am del mismo día.  
    Si la compra se paga en línea (por ejemplo: a través de tarjetas de crédito, tarjetas de débito, PSE o Baloto), la aprobación de la transacción que realiza nuestra pasarela de pagos (proveedor encargado de procesar los pagos en línea de la compañía) debe quedar hecha antes de las 2:00pm del mismo día.  En caso que la transacción sea aprobada con posterioridad a este horario, el área de Servicio al Cliente se comunicará con el Cliente para informarle que su pedido será entregado al día siguiente y que se le devolverá, una vez sea entregado el producto y mediante los procesos que tiene la compañía establecidos, el dinero equivalente al costo de este servicio especial. Para compras con la opción de pago contra entrega no habrá condicionales de aprobación. El costo de este servicio será publicado en el carrito de compra previo al momento del pago.</li>
            <li class="ui-corner-left"><b>Entrega Día Siguiente (EDS):</b> este servicio estará disponible para entregas al día siguiente en Bogotá a excepción de los barrios mencionados en: listado de barrios que no cubren este servicio, y en ciudades principales que serán detalladas en: listado de ciudades a nivel nacional activas.  Este servicio tendrá diferentes características dependiendo si la entrega es en Bogotá (se llamará EDS Bogotá) o en las ciudades detalladas en listado de ciudades a nivel nacional activas (se llamará EDS Nacional):</li>
            <li class="ui-corner-left"><b>EDS Bogotá:</b> este servicio estará disponible solo para entregas al siguiente día en Bogotá a excepción de los barrios mencionados en: listado de barrios que no cubren este servicio.  Este servicio estará activo de Domingo a Jueves. La compra debe realizarse por el Cliente antes de las 11:59 pm del día anterior a la fecha de entrega prevista.  El costo de este servicio será publicado en el carrito de compra previo al momento del pago.</li>
            <li class="ui-corner-left"><b>EDS Nacional:</b> este servicio estará disponible solo para entregas al día siguiente en las ciudades detalladas en listado de ciudades a nivel nacional activas. Este servicio estará activo solo los días hábiles entre Lunes y Jueves.  La compra debe realizarse por el Cliente antes de las 11:59 am del día anterior a la fecha de entrega.  En caso que la compra se realice en línea (por ejemplo: a través de medios de pago como tarjetas de crédito, tarjetas de débito, PSE o Baloto), la aprobación de la transacción que realiza nuestra pasarela de pagos (proveedor encargado de procesar los pagos en línea de la compañía) debe quedar hecha antes de las 2:00pm del mismo día.  En caso que la transacción sea aprobada con posterioridad a este horario, Servicio al Cliente se comunicará con el comprador para informarle que su pedido será entregado al día hábil siguiente del acordado y una vez sea entregado el producto se hará mediante los procesos que tiene la compañía establecidos, la devolución del dinero equivalente al costo de este servicio especial.  Para compras con la opción de pago contra entrega no habrá condicionales de aprobación.  El costo de este servicio será publicado en el carrito de compra previo al momento del pago. </li>
        </ul>
      </div>
    <!----------------------------FIN 5. PRODUCTOS------------------------------>
    <!----------------------------6. FACTURA------------------------------>
      <div id="faq-tabs-7" class="terms container is-size-7 is-hidden">
        <h2>6. FACTURA</h2>
        <br>
        <p>La factura de venta con el detalle de la transacción efectuada por el Cliente será expedida y enviada en formato electrónico al correo electrónico con el que se registró en el Portal, a través del proveedor autorizado por la Dirección de Impuestos y Aduanas Nacionales (DIAN). Adicionalmente podrá ser descargada directamente por el Cliente en el Portal ingresando a su cuenta a “Mis Pedidos”.</p>
      </div>
    <!----------------------------FIN 6. FACTURA------------------------------>
    <!----------------------------7. DERECHO DE RETRACTO, POLÍTICA DE CAMBIOS DE PRODUCTOS Y REVERSIÓN DEL PAGO------------------------------>
      <div id="faq-tabs-8" class="terms container is-size-7 is-hidden">
        <h2>7. DERECHO DE RETRACTO POLÍTICA DE CAMBIOS DE PRODUCTOS Y REVERSIÓN DEL PAGO</h2>
        <br>
        <h3>7.1. DERECHO DE RETRACTO</h3>
        <p>Se entenderá como “DERECHO DE RETRACTO” la facultad que tiene el Cliente de terminar el contrato, arrepentirse o desistir del mismo dentro de los cuarenta y cinco (45) días calendario siguientes contados a partir de la entrega del Producto; término dentro del cual deberá informar y devolver los productos adquiridos a INGENIO.
    El Derecho de Retracto no aplica en caso de bienes de uso personal, tales como ropa interior, trajes de baño, fajas, medias, accesorios para el cabello, perfumes, cremas (incluyendo productos capilares), cosméticos, aretes y joyas. Igualmente, el Producto no debe mostrar señales de uso, suciedad o desgaste, estar averiado o deteriorado.</p>
        <p><b>7.1.1. Procedimiento:</b> El Cliente deberá manifestar su voluntad de ejercer el derecho de retracto durante el término de cuarenta y cinco (45) días calendario siguientes a la entrega del Producto.  El procedimiento se detallará paso a paso y lo podrá ver ingresando a nuestra web en la sessión de ayuda disponible en las opciones de cuenta.  También podrá comunicarse con nuestra área de Servicio al Cliente a través de los siguientes medios: en las líneas de atención para Bogotá D.C., 7424498 o al correo electrónico contacto@ingeniocontenido.co en el horario: de lunes a viernes de 08:00 a.m. a 6:00 p.m. y sábados de 8:00 a.m. a 5:00 p.m. jornada continua.</p>
        <p><b>7.1.2. Condiciones de reembolso del dinero.</b> Sí el Producto a devolver fue pagado con tarjeta débito se reembolsará la totalidad del dinero efectivamente pagado mediante: i) transferencia bancaria (a la cuenta bancaria que se informe); ii) si el pago se realizó con tarjeta de crédito se solicitará la devolución al emisor de la tarjeta para que el Cliente reciba ese dinero descontado en su extracto; iii) Si el pago se realizó contra entrega el Cliente deberá informar la cuenta bancaria a la cual se le podrá realizar el reembolso del dinero.  En el evento en que el Cliente no cuente con una cuenta bancaria, INGENIO realizará el reembolso del dinero a través de Efecty.  La devolución del dinero por  transferencia bancaria, en efectivo a través de Efecty se realizará dentro de los treinta (30) días calendario siguientes a la fecha en que INGENIO reciba los Productos devueltos en su bodega en las mismas condiciones en las que se entregaron al Cliente. INGENIO verificará que el derecho de retracto se haya ejercido en el término y condiciones especificadas en los presentes Términos y Condiciones Generales, para que el mismo sea aceptado.  En los casos donde la devolución se haga a una cuenta bancaria o a través de Efecty la devolución se hará a nombre de la persona que realizó la compra. No se harán devoluciones de dinero a nombre de terceros, con la finalidad de evitar fraudes. <br>
    En caso que el Cliente decida solicitar la devolución del dinero por un medio de pago diferente al que utilizó originalmente, así deberá informarlo en el momento de hacer la solicitud, incluyendo cuando menos la información y/o datos necesarios para efectuar dicho reembolso.  En caso que el Cliente decida solicitar la entrega de un bono por el valor de los productos sobre los cuales ejerció la devolución, el mismo será enviado a su correo electrónico a más tardar en un plazo de seis (6) días hábiles, y podrá ser utilizado desde ese momento y hasta los seis (6) meses siguientes a su recepción.  En el evento que se incumpla con el término comprometido para hacer la entrega del Producto o cuando el Producto entregado no corresponda al solicitado, el Cliente tendrá derecho a solicitar la resolución o terminación del contrato, y obtener la devolución total de su dinero sin que haya lugar a retención o descuento alguno.</p>
        <h3>7.2. REVERSIÓN DEL PAGO</h3>
        <p>El Cliente podrá solicitar que se reverse el pago de un producto comprado en el Portal directamente cuando el producto adquirido no sea recibido, o el producto entregado no corresponda a lo solicitado o sea defectuoso. Si el Cliente detecta que se realizó una operación fraudulenta, es decir que se le cobró a su tarjeta de crédito o débito una orden a nombre de INGENIO, deberá contactarse con su entidad bancaria emisora de dicha tarjeta para informar de dicho evento para que, mediante los procesos de la entidad bancaria, se le reintegre el dinero correspondiente, si así lo considera luego de hacer las investigaciones correspondientes del caso.</p>
        <p><b>7.2.1 Procedimiento:</b> Para solicitar la reversión del pago, el Cliente deberá notificarlo al área de servicio al Cliente de INGENIO dentro de los cinco (5) días hábiles siguientes a
    la fecha en que debió haber recibido un Producto y no lo recibió; la fecha en que recibió un Producto defectuoso o sin que correspondiera a lo solicitado.<br>
    En éste último caso el Cliente deberá realizar la devolución del Producto de acuerdo al procedimiento establecido para ejercer el derecho de retracto. <br>
    Para ambos casos si el pago se realizó con una tarjeta de crédito, INGENIO solicitará la reversión del pago al intermediario que provea al servicio. Si la compra se realizó con tarjeta de débito u otro medio de pago electrónico diferente a tarjeta de crédito o bajo la modalidad de pago contra entrega, se devolverá el dinero a través de transferencia bancaria (a la cuenta bancaria que nos informe).  En el evento en que el Cliente no tenga una cuenta bancaria, INGENIO realizará el reembolso del dinero a través de Efecty.  En los casos donde la devolución se haga a una cuenta bancaria o a través de Efecty la devolución se hará a nombre de la persona que realizó la compra.  No se harán devoluciones de dinero a nombre de terceros, con la finalidad de evitar fraudes.
    Así mismo, la notificación de las situaciones descritas anteriormente al área de servicio al Cliente de INGENIO no lo exime de la responsabilidad que tiene el Cliente de notificar la reclamación al emisor del instrumento de pago electrónico utilizado para realizar la compra.<br>
    Cuando el pago corresponda a varios productos, el Cliente podrá solicitar la reversión parcial del pago de aquellos respecto de los cuales realiza la solicitud. En este caso el Cliente deberá expresar de manera clara cuál es el Producto y el valor por el cual solicita la reversión.  Una vez el Cliente notifica a INGENIO la solicitud de reversión, INGENIO debe avisar al proveedor intermediario de procesar las transacciones electrónicas para que ellos avisen inmediatamente al  emisor del instrumento de pago.  Los tiempos de la entidad emisora de las tarjetas para que reflejen la reversión del pago en sus extractos pueden ser demorados y están por fuera de toda responsabilidad de INGENIO.</p>
        <h3>7.3. GARANTÍA</h3>
        <p>Salvo que en el Portal se indique algo distinto en relación con un Producto en particular, por regla general los productos que allí se comercializan tendrán una garantía de novena (90) días calendario o la ofrecida por el productor, la que sea superior, en ambos casos contada partir de la recepción del Producto por parte del Cliente.<br>
    Todos los Productos que se vendan en el Portal tienen una Garantía de calidad limitada por el término indicado anteriormente. Para poder hacer efectiva la Garantía es obligación del Cliente cumplir a cabalidad con todas las condiciones y requisitos indicados en el aparte “POLÍTICA DE CAMBIOS” expuesto en los presentes Términos y Condiciones. 
    INGENIO tendrá el derecho de reparar o reponer el bien, o devolver el dinero pagado por el producto. El producto reparado o su reposición por otro nuevo se enviarán al Cliente a la dirección suministrada en el registro o al lugar indicado por escrito al área de servicio al Cliente de INGENIO.<br>
    La reparación en caso que se pueda efectuar, se realizará dentro de los treinta (30) días hábiles siguientes contados a partir del día siguiente en que se reciba el Producto en las bodegas de INGENIO. En caso de tomar más tiempo debido a la complejidad de la reparación, se le informará al Cliente tal situación. En caso que el Producto no pueda ser reparado o la falla inicial persista se procederá a reponer el producto por uno idéntico o de características similares; o se generará un bono o el reembolso de dinero al Cliente, según lo que este decida. En ningún caso las características del Producto podrán ser inferiores a las del bien que dio lugar a la garantía. Las reparaciones realizadas a los productos no tendrán ningún costo, y su transporte será asumido por INGENIO. Si se decide reponer el bien por otro igual o uno con características similares, el cambio se realizará dentro de los diez (10) días hábiles siguientes a la fecha en que se reciba el producto objeto de cambio en las bodegas de INGENIO, y el término de la garantía empieza a correr nuevamente. Para los casos de devolución de dinero INGENIO tiene hasta quince (15) días hábiles a partir de la aceptación de la garantía para efectuar el reembolso. La aceptación de una Garantía dependerá de la categoría a la cual pertenezca el producto.  A continuación, se enuncian los casos en los que opera y no opera la garantía según cada categoría:</p>
        <ul>
            <li class="ui-corner-left"><b>Zapatos</b> No son motivos de Garantía: Rasgones, raspones, ruptura de materiales (cuero, sintético, textiles), así como de partes que conforman el zapato como lo son tacones, suelas, tapas, cremalleras y demás accesorios del zapato ocasionados por el mal uso del producto. Los cambios en el color, tonalidad y texturas que sean naturales del material del zapato. Pliegues o rugosidad ocasionadas por la flexión del empeine. Productos que ya hayan sido manipulados por zapaterías, talleres de calzado u otro tipo de terceros, así como también daños ocasionados por arreglos y limpiezas inadecuadas. Para todos los casos el Cliente deberá seguir las recomendaciones e instrucciones de empleo proporcionadas junto con el empaque o en el Portal.
    </li>
            <li class="ui-corner-left"><b>Prendas de Vestir y Accesorios:</b> Comprende Prendas de vestir, bolsos, maletas, maletines y todos los accesorios diferentes a bisutería. Es indispensable tener en cuenta las instrucciones de cuidado de las prendas (lavado, secado, planchado y uso). Las prendas no deben presentar cambios o modificaciones de su estado natural para hacer efectiva la garantía, así como tampoco estar deterioradas por acciones correspondientes al uso que le ha dado el Cliente. En ningún caso se acepta cambio o devolución de medias, ropa interior, pijamas, fajas, trajes de baño ni accesorios para el cabello. Productos que ya hayan sido manipulados por talleres de ropa o accesorios u otro tipo de terceros, así como también daños ocasionados por arreglos y limpiezas inadecuadas no aplican para garantía. Para todos los casos el Cliente deberá seguir las recomendaciones e instrucciones de empleo proporcionadas junto con el empaque o en el Portal.</li>
            <li class="ui-corner-left"><b>Bisutería</b> Estos productos son para darle un uso especial, no están diseñados para trabajos pesados, se debe evitar el contacto con el agua, perfumes, jabones y otro producto químico en el momento de usarlos. Por lo anterior INGENIO no se hace responsable del deterioro normal de un producto ni por los daños que este sufra por motivos de descuido o mal uso. Productos que ya hayan sido manipulados por talleres u otro tipo de terceros, así como también daños ocasionados por arreglos y limpiezas inadecuadas no aplican para garantía. Para todos los casos el Cliente deberá seguir las recomendaciones e instrucciones de empleo proporcionadas junto con el empaque o en el Portal. De estar vigente la garantía, INGENIO se hace responsable por los defectos de fábrica que presente el producto. Solamente aplicará la garantía de estos productos cuando se evidencie un error de fabricación o en los materiales usados.</li>
            <li class="ui-corner-left"><b>Relojes:</b>Para solicitar este tipo de garantías los productos no pueden presentar daños ocasionados por contacto con químicos, por uso de baterías no prescritas por la marca, por mal uso o por manipulación por parte de servicios de reparación distintos a la marca del producto, así como el desgaste de la correa u otros accesorios del reloj. La garantía no cubre la duración de la pila. Para todos los casos el Cliente deberá seguir las recomendaciones e instrucciones de empleo proporcionadas junto con el empaque o en el Portal o citadas anteriormente como causas en las que no aplica la garantía, en especial las que tengan relación con el uso, el mantenimiento del reloj y la resistencia al agua. Productos que ya hayan sido manipulados por relojerías o talleres de reparación u otro tipo de terceros, así como también daños ocasionados por arreglos y limpiezas inadecuadas no aplican para garantía.</li>
        </ul>
        <h3>7.4. POLÍTICA DE CAMBIOS</h3>
        <p>La política de cambios opera en dos (2) eventos: (i) el primero, en caso que el Cliente adquiera el Producto y la talla escogida no se encuentre a su conformidad y; (ii) el segundo, en el caso de presentarse un producto con defectos de calidad o idoneidad que permita solicitar la garantía del producto o la garantía legal según sea el caso.</p>
        <p><b>7.4.1. Cambio por talla</b>
    Para que proceda el cambio del Producto por talla no podrá tratarse de bienes de uso personal mencionados en el inciso 7.1 “Derecho de Retracto”. 
    El Producto objeto de cambio debe estar sin uso, con etiquetas en perfectas condiciones y debe tener los embalajes originales en el caso que la diferencia de talla haya podido ser detectada a primera vista.
    Así, el Cliente contará con un término de cuarenta y cinco (45) días calendario siguientes a partir de la entrega del producto para solicitar el cambio del mismo, siguiendo las indicaciones a que hace referencia el punto 7.4.3.“Procedimiento”.</p>
        <p><b>7.4.2. Cambio defectos de calidad e idoneidad</b> Para que sea procedente realizar cambios por garantía se requiere que el Producto presente defectos en la calidad o idoneidad; es decir, que tenga deficiencias de fabricación, elaboración, y/o que no sea enteramente apto para el uso al que está destinado.<br>
    Salvo que en el Portal de INGENIO se indique algo distinto, los productos vendidos directamente por INGENIO tendrán una garantía de noventa (90) días calendario o el término que ofrezca el productor del bien (el que sea superior), a partir de la recepción del Producto por parte del Cliente.<br>
    Para solicitar la efectividad de la garantía el Cliente debe ponerse en contacto con el área de servicio al Cliente (teléfono, chat o correo electrónico) e informar el daño que tiene el Producto y ponerlo a disposición de INGENIO dentro de los quince (15) días hábiles siguientes a la fecha en que haya notificado la solicitud de la garantía.<br>
    Una vez recibida a solicitud de garantía, INGENIO generará la guía inversa para que el Producto sea entregado en los puntos de atención de Servientrega dispuestos para la recolección y se la enviará al correo electrónico del Cliente que se encuentre registrado en la orden de compra o que haya sido informado al momento de efectuar la solicitud.  El cliente también podrá solicitar, en caso de ser posible debido a su dirección, que el producto sea recogido en el domicilio indicado.  
    En todo caso, el Cliente es el único responsable por el envío del Producto a las bodegas de INGENIO en la ciudad de Bogotá D.C., dentro del término antes indicado. En caso que por cualquier circunstancia no se haya realizado el envío al Cliente de la guía inversa por parte del área de servicio al Cliente de INGENIO, para que se acerque a la oficina de Servientrega de su preferencia, esto no será excusa para que el Cliente cumpla con su obligación de enviar el Producto a las respectivas bodegas en los términos aquí previstos.</p>
        <p><b>7.4.3. Procedimiento</b> El Cliente deberá ingresar al portal y seguir los pasos que allí se mencionan.<br>
    INGENIO cuenta con dos (2) modalidades para la devolución de los Productos: (i) El Cliente deberá dejar el Producto en cualquiera de las oficinas de Servientrega, siguiendo el procedimiento que se establece más adelante, o; (ii) Solicitar la recolección en el mismo lugar donde se entregó el Producto.  En ambos casos el Producto deberá estar en su empaque original, sellado y en las mismas condiciones en las que fue entregado.  Al margen del método de devolución escogido, el Cliente deberá retornar el producto objeto de cambio a las bodegas de INGENIO, a más tardar dentro de los quince (15) días hábiles siguientes a la fecha en que haya realizado la solicitud. De no hacerlo se entenderá que desistió de la solicitud de cambio.</p>
        <p><b>7.4.4. Formas en que habrá de hacerse el cambio.</b> Las formas de cambio que contempla INGENIO son: Cambio por el mismo producto, cambio por cupón o devolución del dinero.</p>
      </div>
    <!----------------------------FIN 7. DERECHO DE RETRACTO, POLÍTICA DE CAMBIOS DE PRODUCTOS Y REVERSIÓN DEL PAGO------------------------------>
    <!----------------------------8. POLÍTICA DE TRATAMIENTO DE DATOS------------------------------>
      <div id="faq-tabs-9" class="terms container is-size-7 is-hidden">
        <h2>8. POLÍTICA DE TRATAMIENTO DE DATOS</h2>
        <br>
        <p>La POLÍTICA PARA EL TRATAMIENTO DE DATOS PERSONALES INGENIO CONTENIDO DIGITAL SAS. es la publicada <a href="/politica-de-privacidad">haciendo click aquí</a>. Así mismo, en relación con la Política de Tratamiento de Datos de INGENIO CONTENIDO DIGITAL SAS. el Cliente declara entender y aceptar que una vez se registra en el Portal y/o la aplicación móvil, acepta recibir ofertas por correo electrónico y la Política de Tratamiento de Datos. Existen varias formas de recibir comunicaciones de INGENIO, tales como pero sin limitarse a: correos electrónicos de campañas publicitarias, correos electrónicos transaccionales, correos electrónicos de cumpleaños, mensajes de texto, push notifications (mensajes que emite la aplicación móvil), entre otros. En consecuencia, en el evento en que un Cliente se desinscriba “cancele la suscripción” para no recibir más comunicaciones de INGENIO o solicite la eliminación de sus datos personales, el Cliente declara entender y aceptar que INGENIO desactivará sus datos o los suprimirá según el caso, sin embargo si el Cliente tiene descargada la aplicación móvil en su celular o tableta, seguirá recibiendo los “push notifications” definidos estos como los mensajes que se visualizan en la pantalla del celular o tableta que no son mensajes de texto, pues las únicas formas posibles de impedir la recepción de los mismos es bloqueando las notificaciones de la aplicación en los ajustes de celular o tableta, o eliminando la aplicación móvil. </p>
      </div>
    <!----------------------------FIN 8. POLÍTICA DE TRATAMIENTO DE DATOS------------------------------>
    <!----------------------------9. MODIFICACIONES Y SOBRECARGOS------------------------------>
      <div id="faq-tabs-10" class="terms container is-size-7 is-hidden">
        <h2>9. MODIFICACIONES Y SOBRECARGOS</h2>
        <br>
        <p>INGENIO podrá modificar cualquier información contenida en este Portal, en cualquier momento y sin previo aviso, hasta el momento de la validación de una transacción, momento a partir del cual INGENIO quedará obligado a mantener las condiciones inicialmente ofrecidas y vigentes para ese momento.</p>
      </div>
    <!----------------------------FIN 9. MODIFICACIONES Y SOBRECARGOS------------------------------>
    <!----------------------------10. FUNCIONAMIENTO DEL PORTAL------------------------------>
      <div id="faq-tabs-11" class="terms container is-size-7 is-hidden">
        <h2>10. FUNCIONAMIENTO DEL PORTAL</h2>
        <br>
        <p>INGENIO hará su mejor esfuerzo para que - dentro de lo posible - el funcionamiento del Portal sea permanente y sin errores, sin embargo, dada la naturaleza del Portal y dado que el mismo funciona en internet, dicha garantía no puede ser absoluta, por lo que INGENIO no asegura la actividad libre de errores e interrupciones. El Cliente declara entender y aceptar que el sistema bajo el cual funciona el Portal puede presentar fallas, por lo que INGENIO no estará en la obligación de cumplir con las órdenes de compra que se hayan generado con base a estos errores.</p>
      </div>
    <!----------------------------FIN 10. FUNCIONAMIENTO DEL PORTAL------------------------------>
    <!----------------------------11. LEY APLICABLE------------------------------>
      <div id="faq-tabs-12" class="terms container is-size-7 is-hidden">
        <h2>11. LEY APLICABLE</h2>
        <br>
        <p>Este acuerdo será interpretado conforme las leyes de Colombia, sin que se puedan presentar conflictos de ley (Derecho Internacional Privado). Si alguna declaración de estos Términos y Condiciones está incompleta, es inaplicable, se declara nula, inexistente o ineficaz, deberá ser interpretada dentro del marco del mismo y en cualquier caso no afectará la validez y la aplicabilidad de las indicaciones restantes.</p>
      </div>
    <!----------------------------FIN 11. LEY APLICABLE------------------------------>
    <!----------------------------12. CONTACTO------------------------------>
      <div id="faq-tabs-13" class="terms container is-size-7 is-hidden">
        <h2>12. CONTACTO</h2>
        <br>
        <p>El área de Servicio al Cliente atenderá las peticiones, quejas, reclamos y consultas de los usuarios a través de los siguientes medios: en las líneas de atención para Bogotá D.C., 7424498 o al correo electrónico contacto@ingeniocontenido.co en el horario: de lunes a viernes de 08:00 a.m. a 6:00 p.m. y sábados de 8:00 a.m. a 5:00 p.m. jornada continua.</p>
      </div>
    <!----------------------------FIN 12. CONTACTO------------------------------>
    <!----------------------------13. TÉRMINOS Y CONDICIONES GENERALES DE USO PARA PAGADORES PAYU------------------------------>
      <div id="faq-tabs-14" class="terms container is-size-7 is-hidden">
        <h2>13. TÉRMINOS Y CONDICIONES GENERALES DE USO PARA PAGADORES EPAYCO</h2>
        <br>
        <p>El Cliente declara entender y aceptar que en el evento que use la pasarela de pagos (ePayco) aplicarán los términos y condiciones generales de uso para compradores los cuales podrán ser validados directamente en la página www.epayco.co.</p>
      </div>
    <!----------------------------FIN 13. TÉRMINOS Y CONDICIONES GENERALES DE USO PARA PAGADORES PAYU------------------------------>
      </div>
      </div>
      <script>
        live('a','click',e =>{
          for(let s of document.querySelectorAll('.terms')){
            addClass(s,'is-hidden');
          }
          let obj = document.querySelector('#'+e.target.getAttribute('target'))
          removeClass(obj,'is-hidden')
        })
      </script>
      `;
        break;
      case 'aviso-de-privacidad':
        content=`<div class="container">
        <p class="has-text-centered"><b>AVISO DE PRIVACIDAD.</b></p>
        <hr>
    <div class="fsm">
    <div style="text-align:justify">
    
    <p> En cumplimiento de la Ley 1581 de 2012 y del Decreto 1377 de 2013, <strong>INFORMAMOS A NUESTROS CLIENTEs</strong>, informa que contamos con Bases de Datos que contienen información y Datos Personales de sus Clientes, Trabajadores y/o terceros y que por consiguiente ha adoptado una Política para el Tratamiento de Datos Personales que se encuentra disponible en <a href="/contenido/politica-de-privacidad">nuestra página web</a>
    <br></p>
    <br>
    <p><strong>Somos</strong> responsables del Tratamiento y por tanto podremos recolectar, almacenar, circular, transferir, transmitir y usar de sus datos para las siguientes finalidades:
      </p>
    <br>
    <p>i) El adecuado desarrollo de su objeto social, incluida la utilización de los datos para la ejecución de la relación contractual, negocio o alianza comercial existente con sus clientes, contratistas, proveedores, aliados, usuarios, empleados y terceros.</p>
    <br>
    <p>ii) Promover sus servicios y productos y los de sus vinculadas, filiales, subsidiarias, terceros aliados comerciales y los aliados de estos.</p><br> 
    <p>iii) Entregar o enviar sus Datos Personales a empresas vinculadas, filiales, subsidiarias y terceros aliados comerciales y los aliados de estos que requieran la información para los fines aquí descritos.  </p><br>     
    <p>iv) Lograr una comunicación eficiente relacionada con sus productos, servicios, estudios, ofertas, así como los de sus filiales, subsidiarias, vinculadas, terceros aliados comerciales y los aliados de estos para facilitar el acceso general a la información recolectada.</p><br>     
    <p>v) Enviar a través de cualquier medio de comunicación que se encuentre creado o vaya a crearse, información publicitaria, promocional y de mercadeo propia, de sus vinculadas, filiales, subsidiarias, de terceros aliados comerciales o de los aliados de estos; la implementación de una estrategia global de marketing destinada a actos de promoción y publicidad de sus productos, servicios, ofertas, promociones, invitaciones, descuentos, premios, programas de fidelización, campañas, sorteos, entre otras.  </p><br> 
    <p>vi) Suministrar la información a terceros o aliados comerciales con los cuales tengamos relación contractual y que sea necesario entregársela para el cumplimiento del objeto contratado. </p><br> 
    <p>vii) Contactar, gestionar trámites (PQR’s) y realizar evaluaciones de calidad de los productos y servicios, y en general para la actualización de datos y demás actividades de mercadeo y administración necesarias para el cabal desarrollo de su objeto social, así como de sus filiales, vinculadas, subsidiarias, terceros aliados comerciales o de los aliados de estos. </p><br> 
    <p>viii) Informar sobre nuevos productos o servicios que estén relacionados con el desarrollo del objeto social, de sus filiales, vinculadas, subsidiarias, terceros aliados comerciales, o de los aliados de estos. </p><br>     
    <p>ix) Dar a conocer, transferir y/o transmitir Datos Personales dentro y fuera del país a las compañías matrices, filiares o subsidiarias o a terceros en virtud de un contrato, la Ley o cualquier relación jurídica que así lo requiera o para implementar servicios de almacenamiento o computación en la “nube”. </p><br> 
    <p>x) Realizar estudios internos sobre hábitos de consumo.</p><br> 
    <p>xi) Ordenar, clasificar, o separar la información suministrada; así como para verificar, confirmar, validar, investigar y comparar la información suministrada por el Titular con cualquier información obtenida legítimamente. </p><br>     
    <p>xii) Seguridad y mejoramiento del servicio y la experiencia del Titular a través del Portal. </p><br> 
    <p>xii) Realizar las gestiones tributarias, contables, fiscales y de facturación que sean necesarias.  </p><br> 
    <p>xii) Dar cumplimiento a las obligaciones contraídas con el Titular de la Información, con relación al pago de salarios, prestaciones sociales y demás retribuciones consagrados en el contrato de trabajo o según lo disponga la ley (en caso de que se trate de empleados de la organización).  </p>
    <br>    
    <p>Los datos personales que sean suministrados por El Titular serán tratados y utilizados solamente para las finalidades aquí previstas, y  por un plazo contado desde el momento que se otorgó la autorización hasta el plazo determinado para la vigencia de la sociedad De igual modo, la información suministrada por El Titular podrá ser compartida con agencias, encargados de la información, proveedores de servicios, aliados comerciales, aliados de estos, y terceros en general que presten servicios a nosotros o a terceros en nuestro nombre. </p><br>     
    <p>De igual forma le recordamos que usted tiene el derecho de conocer, actualizar, rectificar y solicitar la supresión de sus Datos Personales en cualquier momento, para lo cual les solicitamos comunicarnos su decisión a la cuenta de correo anteriormente mencionada</p><br>     
    </p><br> 
    <p>Para mayor información se le informa al Titular es de información que puede comunicarse con el Servicio al Cliente, mediante <a href="/">nuestra página web</a>  o vía correo electrónico <a href="#"></a><br> 
    <br> </p>
    </div>
    <br>
    </div></div>`;
        break;
      case 'politica-de-datos':
        content=`
        <div class="container">
          <p class="has-text-centered"><b>POLITICA PARA EL TRATAMIENTO DE LOS DATOS PERSONALES.</b></p>
          <hr>
          <div class="text_box1">
<div id="textbox_tit">
POLÍTICA PARA EL TRATAMIENTO DE DATOS PERSONALES INGENIO CONTENIDO DIGITAL S.A.S.<!-- Titulo -->
<div id="line3"></div><div id="line4"></div>
</div>
<span class="text_default">
<p><strong>1. RESPONSABLE DEL TRATAMIENTO: INGENIO CONTENIDO DIGITAL S.A.S </strong>,&nbsp;sociedad legalmente constituida bajo las leyes colombianas, domiciliada en la ciudad de Bogotá D.C e identificada con el NIT. 900.521.885-1 (En adelante “INGENIO” o el “Responsable”).</p> <!-- 1 politica --><br>

<p><strong>2. DESCRIPCIÓN GENERAL: INGENIO, </strong> de conformidad con lo dispuesto en la Constitución Política de Colombia, la Ley 1581 de 2.012, el Decreto Reglamentario 1377 de 2.013, Decreto 1074 de 2015 y demás disposiciones complementarias, adopta la siguiente Política de Tratamiento de Datos Personales, la cual será aplicada por <strong>INGENIO</strong> en todo lo que respecta a la recolección, almacenamiento, uso, circulación, supresión y en general a todas las diferentes actividades que constituyan o puedan llegar a constituir Tratamiento de Datos Personales de acuerdo a la legislación vigente.
</p><!-- 2 politica --> <br>

<p><strong>3. DEFINICIONES:</strong>&nbsp;Para dar aplicación a lo dispuesto en la presente Política, se entiende por:
</p><!-- 4 politica -->

<p><strong></strong></p><ol><strong>Aliados Comerciales:</strong>&nbsp;&nbsp;Toda persona jurídica o natural que promueve, ofrece o comercializa productos y/o servicios propios o ajenos, con los cuales <strong>INGENIO</strong> tiene una relación comercial para el desarrollo y amplitud de su portafolio.
<p></p></ol> <!-- 3.1 politica -->

<p><strong></strong></p><ol><strong>Autorización:</strong>&nbsp;&nbsp;Consentimiento previo, expreso e informado del Titular para llevar a cabo el Tratamiento de Datos Personales de acuerdo a la presente Política de Tratamiento de Datos Personales.<p></p></ol> <!-- 3.2 politica -->

<p><strong></strong></p><ol><strong>Autorizado:</strong>&nbsp;&nbsp;Hace referencia a todas las personas que bajo responsabilidad de la Compañía o sus Encargados pueden realizar Tratamiento de Datos Personales.<p></p></ol> <!-- 3.3 politica -->

<p><strong></strong></p><ol><strong>Aviso de privacidad:</strong>&nbsp;&nbsp;Comunicación verbal, escrita o remitida a través de cualquier medio tecnológico vigente, generada por el Responsable o por cualquier tercero designado por este para los efectos, dirigida al Titular para el Tratamiento de sus Datos Personales, mediante la cual se le informa acerca de la existencia de las políticas de Tratamiento de Datos Personales que le serán aplicables, la forma de acceder a las mismas y las finalidades del Tratamiento que se pretende dar a los datos personales suministrados.<p></p></ol>
<!-- 3.4 politica -->

<p><strong></strong></p><ol><strong>Base de Datos:</strong>&nbsp;&nbsp;Significa el conjunto organizado de Datos Personales que sean objeto de Tratamiento, electrónico o no, cualquiera que fuere la modalidad de su formación, almacenamiento, organización y acceso. (En adelante las “Bases de Datos”)
<p></p></ol>
<!-- 3.5 politica -->

<p><strong></strong></p><ol><strong>Consulta:</strong>&nbsp;&nbsp;Significa la solicitud del Titular del Dato Personal, de las personas autorizadas por éste, o las autoridades por Ley, para conocer la información que reposa sobre él en las Bases de Datos del Responsable. 
<p></p></ol>
<!-- 3.6 politica -->


<p><strong></strong></p><ol><strong>Dato(s) Personal(es):</strong>&nbsp;&nbsp;Cualquier información vinculada o que pueda asociarse a una o varias personas naturales determinadas o determinables. Para efectos de la presente Política serán Datos Personales entre otros los siguientes: nombre, apellidos, edad, género, estado civil, correo electrónico, dirección de correspondencia, número de identificación, fecha de nacimiento, teléfono y profesión (En adelante los “Datos Personales”).
<p></p></ol><!-- 3.7 politica -->


<p><strong></strong></p><ol><strong>Dato Privado:</strong>&nbsp;&nbsp;Es el dato que por su naturaleza íntima o reservada sólo es relevante para el Titular
<p></p></ol><!-- 3.8 politica -->

<p><strong></strong></p><ol><strong>Dato(s) sensible(s):</strong>&nbsp;Se entiende por Datos Sensibles aquellos que afectan la intimidad del Titular o cuyo uso indebido puede generar su discriminación, tales como aquellos que revelen el origen racial o étnico, la orientación política, las convicciones religiosas o filosóficas, la pertenencia a sindicatos, organizaciones sociales, de derechos humanos o que promueva intereses de cualquier partido político o que garanticen los derechos y garantías de partidos políticos de oposición, así como los datos relativos a la salud, a la vida sexual, y los datos biométricos. (En adelante los “Datos Sensibles”). 
<p></p></ol> <!-- 3.9 politica -->

<p><strong></strong></p><ol><strong>Encargado del Tratamiento:</strong>&nbsp;&nbsp;Es la persona natural o jurídica que realiza el tratamiento de datos personales, a partir de una delegación que le hace el responsable, recibiendo instrucciones acerca de la forma en la que deberán ser administrados los datos (En adelante el “Encargado”).<p></p></ol> <!-- 3.10 politica -->

<p><strong></strong></p><ol><strong>Reclamo:</strong>&nbsp;&nbsp;Hace referencia a la solicitud del Titular de los Datos Personales o las personas autorizadas por éste o por la Ley para corregir, actualizar o suprimir sus Datos Personales o cuando advierten que existe un presunto incumplimiento del régimen de protección de datos.<p></p></ol> <!-- 3.11 politica -->

<p><strong></strong></p><ol><strong>Responsable del Tratamiento:</strong>&nbsp;Persona natural o jurídica, pública o privada, que por sí misma o en asocio con otros, decida sobre la finalidad de las bases de datos y/o el Tratamiento de los mismos. (en adelante <strong>"INGENIO"</strong> o el “Responsable”).
<p></p></ol> <!-- 3.12 politica -->


<p><strong></strong></p><ol><strong>Titular:</strong>&nbsp;Es la persona natural cuyos Datos Personales son objeto de Tratamiento.<p></p></ol><!-- 3.13 politica -->

<p><strong></strong></p><ol><strong>Transferencia:</strong>&nbsp;Se trata de la operación que realiza el Responsable o el Encargado del Tratamiento de los datos personales, cuando envía la información a otro receptor nacional o internacional, que, a su vez, se convierte en Responsable del tratamiento de esos datos.  <p></p></ol><!-- 3.14 politica -->

<p><strong></strong></p><ol><strong>Transmisión:</strong>&nbsp;Tratamiento de Datos Personales que implica la comunicación de los mismos dentro o fuera del territorio de la República de Colombia cuando tenga por objeto la realización de un Tratamiento por el Encargado por cuenta del Responsable.   <p></p></ol><!-- 3.15 politica -->

<p><strong></strong></p><ol><strong>Tratamiento de Datos Personales: </strong>&nbsp;Cualquier operación o conjunto de operaciones sobre Datos Personales, tales como la recolección, almacenamiento, uso, circulación o supresión. El Tratamiento puede ser nacional o internacional. (En adelante el “Tratamiento”)<p></p> </ol>
<!-- 3.15 politica --> <br>

<p><strong>4. PRINCIPIOS: INGENIO</strong> definirá su política de Tratamiento de Datos Personales teniendo en cuenta los siguientes principios:
</p> <!-- 4 politica -->


<p><strong></strong></p><ol><strong>Principio de finalidad:</strong>&nbsp;El Tratamiento de Datos Personales debe obedecer a una finalidad legítima de acuerdo con la Constitución Política de Colombia y la Ley, la cual debe ser informada al Titular.
<p></p></ol> <!-- 4.1 politica -->

<p><strong></strong></p><ol><strong>Principio de libertad:</strong>&nbsp;El Tratamiento sólo puede ejercerse con el consentimiento, previo, expreso e informado del Titular. Los Datos Personales no podrán ser obtenidos o divulgados sin previa autorización, o en ausencia de mandato legal o judicial que releve el consentimiento.<p></p></ol>
<!-- 4.2 politica -->

<p><strong></strong></p><ol><strong>Principio de veracidad o calidad:</strong>&nbsp;La información sujeta a Tratamiento debe ser veraz, completa, exacta, actualizada, comprobable y comprensible. Se prohíbe el Tratamiento de datos parciales, incompletos, fraccionados o que induzcan a error.
<p></p></ol>
<!-- 4.3 politica -->

<p><strong></strong></p><ol><strong>Principio de transparencia:</strong>&nbsp;En el Tratamiento debe garantizarse el derecho del Titular a obtener en cualquier momento y sin restricciones, información acerca de la existencia de datos que le conciernan.
<p></p></ol><!-- 4.4 politica -->

<p><strong></strong></p><ol><strong>Principio de acceso y circulación restringida:</strong> Los Datos Personales, salvo la información pública, no podrán estar disponibles en Internet u otros medios de divulgación o comunicación masiva, salvo que el acceso sea técnicamente controlable para brindar un conocimiento restringido sólo al Titular es o terceros autorizados conforme a la Ley.
<p></p></ol><!-- 4.5 politica -->

<p><strong></strong></p><ol><strong>Principio de seguridad:</strong>&nbsp;La información sujeta a Tratamiento, se deberá manejar con las medidas técnicas, humanas y administrativas que sean necesarias para otorgar seguridad a los registros evitando su adulteración, pérdida, consulta, uso o acceso no autorizado o fraudulento.
<p></p></ol><!-- 4.6 politica -->

<p><strong></strong></p><ol><strong>Principio de confidencialidad:</strong> Todas las personas que intervengan en el Tratamiento de Datos Personales están obligadas a garantizar la reserva de la información, inclusive después de finalizada su relación con alguna de las labores que comprende el tratamiento, pudiendo sólo realizar suministro o comunicación de Datos Personales cuando ello corresponda al desarrollo de las actividades expresamente autorizadas en la Ley.
<p></p></ol>
<!-- 4.7 politica -->

<p><strong></strong></p><ol><strong>Política de Tratamiento de Datos:</strong> Se refiere a los términos y condiciones contenidos en la presente Política de Tratamiento de Datos. (En adelante la “Política”)
<p></p></ol><br>
<!-- 4.8 politica -->


<p><strong>5. TRATAMIENTO Y FINALIDAD DE LA RECOLECCIÓN DE DATOS PERSONALES: </strong></p>

<p><strong></strong></p><ol><strong>5.1 INGENIO</strong>&nbsp;realizará el Tratamiento de los Datos Personales para el cumplimiento de las actividades propias de su objeto social, todo de conformidad con lo dispuesto en la Ley 1581 de 2012, el Decreto Reglamentario 1377 de 2.013, el Decreto 1074 de 2015 y demás disposiciones complementarias. El Tratamiento se podrá realizar a través de medios electrónicos, físicos, automatizados y/o utilizando cualquier medio digital conocido o por conocerse, que podrá variar dependiendo de la forma de recolección de la información. <p></p></ol>

<p><strong></strong></p><ol><strong>5.2</strong>&nbsp;La finalidad para la cual <strong>INGENIO</strong> recolecta, almacena, usa, depura, analiza, trata, circula, transmite o transfiere directa o indirectamente Datos Personales del  Titular, es:
<p></p></ol>


<p></p><ol>i) El adecuado desarrollo de su objeto social, incluida la utilización de los datos para la ejecución de la relación contractual, negocio o alianza comercial existente con sus clientes, contratistas, proveedores, aliados, usuarios, empleados y terceros.
</ol>

 <p></p><ol> ii) Promover sus servicios y productos y los de sus vinculadas, filiales, subsidiarias, terceros aliados comerciales y los aliados de estos.</ol><p></p>

<p></p><ol> iii) Entregar o enviar sus Datos Personales a empresas vinculadas, filiales, subsidiarias y terceros aliados comerciales y los aliados de estos que requieran la información para los fines aquí descritos.</ol><p></p>

<p></p><ol> iv) Lograr una comunicación eficiente relacionada con sus productos, servicios, estudios, ofertas, así como los de sus filiales, subsidiarias, vinculadas, terceros aliados comerciales y los aliados de estos para facilitar el acceso general a la información recolectada</ol><p></p>

<p></p><ol> v) Enviar a través de cualquier medio de comunicación que se encuentre creado o vaya a crearse, información publicitaria, promocional y de mercadeo propia, de sus vinculadas, filiales, subsidiarias, de terceros aliados comerciales o de los aliados de estos; la implementación de una estrategia global de marketing destinada a actos de promoción y publicidad de sus productos, servicios, ofertas, promociones, invitaciones, descuentos, premios, programas de fidelización, campañas, sorteos, entre otras.</ol><p></p>

<p></p><ol>vi) Suministrar la información a terceros o aliados comerciales con los cuales INGENIO CONTENIDO DIGITAL S.A.S. tenga relación contractual y que sea necesario entregársela para el cumplimiento del objeto contratado.</ol><p></p>

<p></p><ol>vii) Contactar, gestionar trámites (PQR’s) y realizar evaluaciones de calidad de los productos y servicios, y en general para la actualización de datos y demás actividades de mercadeo y administración necesarias para el cabal desarrollo de su objeto social, así como de sus filiales, vinculadas, subsidiarias, terceros aliados comerciales o de los aliados de estos.
</ol><p></p>

<p></p><ol>viii) Informar sobre nuevos productos o servicios que estén relacionados con el desarrollo del objeto social, de sus filiales, vinculadas, subsidiarias, terceros aliados comerciales, o de los aliados de estos.
</ol><p></p>

<p></p><ol>ix) Dar a conocer, transferir y/o transmitir Datos Personales dentro y fuera del país a las compañías matrices, filiares o subsidiarias de <strong>INGENIO</strong> o a terceros en virtud de un contrato, la Ley o cualquier relación jurídica que así lo requiera o para implementar servicios de almacenamiento o computación en la “nube”. 
</ol><p></p>

<p></p><ol>x) Realizar estudios internos sobre hábitos de consumo.</ol><p></p>

<p></p><ol>xi) Ordenar, clasificar, o separar la información suministrada; así como para verificar, confirmar, validar, investigar y comparar la información suministrada por el Titular con cualquier información obtenida legítimamente.</ol><p></p>

<p></p><ol>xii) Seguridad y mejoramiento del servicio y la experiencia del Titular a través del Portal. </ol><p></p>

<p></p><ol>xiii) Realizar las gestiones tributarias, contables, fiscales y de facturación que sean necesarias.  </ol><p></p>

<p></p><ol>xiv) Dar cumplimiento a las obligaciones contraídas por <strong>INGENIO CONTENIDO DIGITAL S.A.S.</strong> con el Titular de la Información, con relación al pago de salarios, prestaciones sociales y demás retribuciones consagrados en el contrato de trabajo o según lo disponga la ley (en caso de que se trate de empleados de la organización).
  </ol><p></p>


<p><strong>Parágrafo Primero:</strong> Los Datos Personales que sean suministrados por el Titular serán tratados y utilizados solamente para las finalidades aquí previstas, y por un plazo contado desde el momento que se otorgó la autorización hasta el plazo determinado para la vigencia de la sociedad <strong>INGENIO CONTENIDO DIGITAL S.A.S.</strong> </p>

<p><strong>Parágrafo Segundo:</strong> La información suministrada por el Titular podrá ser compartida con agencias, encargados de la información, proveedores de servicios, aliados comerciales, aliados de estos, y terceros en general que presten servicios a <strong>INGENIO</strong> o a terceros en nombre y por cuenta de <strong>INGENIO</strong> </p>


<p><strong>Parágrafo Tercero: INGENIO</strong> no solicita ni realiza Tratamiento sobre datos sensibles.</p>


<p><strong>Parágrafo Cuarto: INGENIO</strong> garantiza que los mecanismos a través de los cuales hace uso de los Datos Personales son seguros y confidenciales, ya que cuentan con mecanismos de seguridad informática y los medios tecnológicos idóneos para asegurar que sean almacenados de manera tal que se impida el acceso indeseado por parte de terceras personas.
</p><br>


<!-- 6 politica -->

<p><strong>6. AUTORIZACIÓN:</strong>&nbsp;La recolección, almacenamiento, el uso, depuración, análisis, circulación, transmisión o transferencia, circulación o supresión de Datos Personales por parte de <strong>INGENIO</strong> requiere siempre del consentimiento previo, expreso e informado del Titular de aquellos. En cumplimiento de la legislación vigente, <strong>INGENIO</strong> ha dispuesto los siguientes mecanismos para obtener la autorización o ratificación por parte del  Titular de los Datos Personales:</p>


<p></p><ol><strong>6.1</strong> La Autorización puede constar en un documento físico, electrónico o cualquier otro que permita garantizar su posterior consulta, o a través de un mecanismo técnico o tecnológico idóneo mediante el cual se pueda concluir que el Titular  otorgó su autorización para almacenar sus datos en nuestra Base de Datos. Para los efectos se entiende por autorización aquella dada mediante mecanismos tecnológicos tales como pero sin limitarse a un “click” de aceptación a nuestros Términos y Condiciones y la Política para el Tratamiento de Datos Personales, al momento de ingresar sus datos para el envío de correos electrónicos, o “Newsletter”; el diligenciamiento de formularios en el sitio web y/o mediante la suscripción por medio de aplicaciones de terceros tales como pero sin limitarse a Facebook, Instagram o LinkedIn.</ol><p></p>

<p></p><ol><strong>6.2</strong> Con este procedimiento de Autorización consentida se garantiza expresamente que el Titular de los Datos Personales conoce y acepta que <strong>INGENIO</strong> recolectará, almacenará, usará, depurará, analizará, circulará, transmitirá, transferirá, actualizará o suprimirá en los términos de Ley, la información para los fines que al efecto le informe de manera previa al otorgamiento de la autorización, y para la finalidad contenida en el presente documento.</ol><p></p>

<p></p><ol><strong>6.3</strong> En la autorización solicitada por <strong>INGENIO</strong> se establecerá como mínimo: (i) La identificación completa de la persona de quien se recopilan Datos Personales; (ii) La Autorización a que hace referencia el numeral 7.2 anterior;  (iii) La finalidad del Tratamiento de los Datos Personales, y; (iv) Los derechos de acceso, corrección, actualización o supresión de los Datos Personales suministrados por el Titular de los mismos.
</ol><p></p>

<p></p><ol><strong>6.4</strong> Será responsabilidad de <strong>INGENIO</strong> adoptar las medidas necesarias para mantener registros de cuándo y cómo se obtuvo autorización por parte de los Titulares.</ol><p></p>

<p></p><ol><strong>6.5</strong> Los Titular es de Datos Personales podrán solicitar en cualquier momento y sin limitación de ninguna índole, la supresión de sus datos y/o revocar la autorización otorgada para el Tratamiento de los mismos.</ol><p></p>

<p></p><ol><strong>6.6</strong> Para los datos recolectados antes de la expedición del Decreto 1377 de 2013, es decir el 27 de junio de 2013 se enviará un correo electrónico a todas las personas respecto de las cuales INGENIO posea Datos Personales informándoles acerca de la implementación de la Política de Tratamiento de Datos Personales <strong>INGENIO</strong> y el modo de ejercer sus derechos. En dicho correo electrónico se incluirá el Aviso de Privacidad en el cual se incluirá como mínimo: i) Nombre o razón social y datos de contacto de <strong>INGENIO</strong>. ii) Los mecanismos de acceso por los cuales el Titular es pueden acceder a los datos registrados en la base de datos de <strong>INGENIO</strong>, en los cuales se dará a conocer la Política de Tratamiento de Datos Personales de <strong>INGENIO</strong> y los cambios sustanciales que se produzcan a la misma.
</ol><p></p>

<p>Si en el término de treinta (30) días hábiles, contados a partir de la fecha de envío de la comunicación, el Titular no ha dado respuesta o no se ha contactado por cualquier medio con <strong>INGENIO</strong> para solicitar la supresión de sus datos personales, se podrá continuar realizando el Tratamiento de los datos. 
</p>

<p>De igual forma y para garantizar que el Aviso de Privacidad llegue a todos los empleados, proveedores, clientes, usuarios, y terceros que puedan tener cualquier tipo de relación con INGENIO, el mismo se publicará en la página web.
</p>


<p><strong>PARÁGRAFO:</strong>&nbsp;Será obligación de <strong>INGENIO</strong> y en particular del área de marketing llevar registro y tener soporte de todas las autorizaciones emitidas por el Titular o en su defecto del envío de la comunicación a que hace referencia el presente artículo. Todos los soportes deberán estar disponibles en todo momento mientras se lleve a cabo el Tratamiento de Datos Personales y cinco (5) años más. Para el almacenamiento <strong>INGENIO</strong> podrá emplear medios informáticos, electrónicos o cualquier otra tecnología.
</p><br>

<!-- 7 politica -->


<p><strong>7. TRANSFERENCIA Y TRANSMISIÓN INTERNACIONAL DE DATOS:</strong>El Titular  autoriza a <strong>INGENIO</strong> para que realice la transferencia o transmisión internacional de Datos Personales, garantizando los niveles adecuados para la protección de mismos y el cumplimiento de los requisitos contemplados en la Ley 1581 de 2012 y sus Decretos Reglamentarios; así mismo, autoriza a <strong>INGENIO</strong> para que realice el envío y/o transmisión internacional de Datos Personales a uno o varios Encargados ubicados dentro o fuera del territorio nacional para el Tratamiento de Datos Personales en los términos de la Ley 1581 de 2012  y sus Decretos Reglamentarios.</p><br>


<!-- 8 politica -->

<p><strong>8. DERECHOS DEL TITULAR ES DE LA INFORMACIÓN</strong>&nbsp;El Titular de los Datos Personales tendrá los siguientes derechos:</p>

<p>Conocer, actualizar y rectificar sus Datos Personales frente a <strong>INGENIO</strong>. Este derecho se podrá ejercer, entre otros frente a datos parciales, inexactos, incompletos, fraccionados, que induzcan a error, o aquellos cuyo Tratamiento esté expresamente prohibido o no haya sido autorizado;</p>

<p>Solicitar cuando proceda prueba de la autorización otorgada a <strong>INGENIO</strong>.</p>

<p>Ser informado por <strong>INGENIO</strong> o el Encargado del Tratamiento, respecto del uso que le ha dado a sus Datos Personales;</p>

<p>Presentar ante la Superintendencia de Industria y Comercio quejas por infracciones a lo dispuesto en la Ley 1581 de 2.012, previo agotamiento del procedimiento de reclamaciones establecido en la Política de Tratamiento de Datos Personales;</p>

<p>Revocar la autorización y/o solicitar la supresión de los Datos Personales cuando en el Tratamiento no se respeten los principios, derechos y garantías constitucionales y legales. De igual forma, la revocatoria y/o supresión procederá cuando la Superintendencia de Industria y Comercio haya determinado que los Responsables o Encargados han incurrido en conductas contrarias a esta Ley y a la Constitución.
</p>

<p>Acceder en forma gratuita a sus Datos Personales que hayan sido objeto de tratamiento.</p><br>

<!-- 9 politica -->

<p><strong>9. DEBERES DE INGENIO:</strong>&nbsp;En calidad de Responsable del Tratamiento de los Datos Personales, <strong>INGENIO</strong> sus contratistas y sus trabajadores se comprometen a cumplir con los siguientes deberes:</p>

<p>Garantizar al Titular de la información, en todo tiempo, el pleno y efectivo ejercicio del derecho de hábeas data.
</p>

<p>Conservar copia de la comunicación y de la respectiva autorización otorgada por el Titular.
</p>

<p>Informar debidamente al Titular sobre la finalidad de la recolección y los derechos que le asisten por virtud de la autorización otorgada.</p>


<p>Conservar la información bajo las condiciones de seguridad necesarias para impedir su adulteración, pérdida, consulta, uso o acceso no autorizado o fraudulento.</p>

<p>En caso de compartir y/o actualizar la información con algún Encargado del Tratamiento, garantizar que la autorización dada por el Titular sea suficiente y que la información misma sea veraz, completa, exacta, actualizada, comprobable y comprensible.
</p>

<p>Tramitar las consultas y reclamos formulados por el Titular en los términos del presente Manual y la Política de Tratamiento de Datos Personales INGENIO.</p>

<p>Rectificar la información cuando sea incorrecta.</p>

<p>Tramitar las consultas y reclamos formulados por el Titular en los términos de la presente Política de Tratamiento de Datos Personales <strong>INGENIO</strong>.
</p>

<p>Informar a solicitud del Titular sobre el uso dado a sus datos.</p>

<p>Informar a la autoridad de protección de datos cuando se presenten violaciones a los códigos de seguridad y existan riesgos en la administración de la información de los Titulares.</p>

<p>Cumplir las instrucciones y requerimientos que imparta la Superintendencia de Industria y Comercio.</p>

<p>Cumplir con las demás disposiciones contenidas en la Ley y en los decretos reglamentarios.</p>

<p>Registrar en la base de datos la leyenda "reclamo en trámite” cuando corresponda.</p>

<p>Insertar en la base de datos la leyenda "información en discusión judicial" una vez notificado por parte de la autoridad competente sobre procesos judiciales relacionados con la calidad del dato personal;</p>

<p>Abstenerse de circular información que esté siendo controvertida por el Titular y cuyo bloqueo haya sido ordenado por la Superintendencia de Industria y Comercio;</p>

<p>Permitir el acceso a la información únicamente a las personas que pueden tener acceso a ella;
</p>

<p>Informar a través de la página web de <strong>INGENIO</strong> los nuevos mecanismos que implemente para que los titulares de la información hagan efectivos sus derechos, así como cualquier modificación a la Política de Tratamiento de Datos Personales.</p>

<p>En cumplimiento a la prohibición expresa contenida en el artículo 12 del Decreto 1377 de 2.013, <strong>INGENIO</strong> se abstiene de recolectar datos personales de niños, niñas y adolescentes en sus bases de datos.</p><br>


<!-- 10 politica -->

<p><strong>10. ÁREA RESPONSABLE Y PROCEDIMIENTO PARA EL EJERCICIO DE LOS DERECHOS DEL TITULAR:
</strong>&nbsp;El Titular, su representante o causahabiente podrá presentar en cualquier momento y de manera gratuita, consultas, peticiones y/o reclamos ante <strong>INGENIO</strong> para conocer, actualizar, rectificar, solicitar la supresión de sus Datos Personales y/o revocar la autorización. Por esta razón, es responsabilidad de todo el equipo de trabajadores directos e indirectos de <strong>INGENIO</strong>, sin excepción, cumplir con la Política de Tratamiento de la Información, y en especial con la debida atención de las peticiones, quejas y reclamos que el Titular presente ante la compañía por este concepto.
</p>


<p>Para ejercer sus derechos, el Titular o quien actúe en su nombre y representación, podrá presentar sus peticiones, quejas y/o reclamos ante <strong>INGENIO</strong> por los siguientes medios:</p>

<p></p><ol>i) Por correo electrónico a:&nbsp;contacto@ingeniocontenido.co <p></p></ol>
<p></p><ol>ii) Teléfono: 742 4498 en Bogotá<p></p></ol>
<p></p><ol>iii) Comunicación escrita por medio electrónico mediante la página web de <strong>INGENIO</strong>.<p></p></ol>

<p>El área responsable del manejo y tratamiento de la bases de datos, según el caso, será siempre el responsable del departamento de servicio al cliente quien estará encargado de atender las peticiones, quejas y reclamos que formule el Titular en ejercicio de sus derechos</p>

<p>La atención de una consulta, petición, queja o reclamo (PQR), recibida por escrito, correo electrónico, por medio electrónico, vía telefónica o verbalmente, se tramitará de acuerdo al siguiente procedimiento:</p>

<p><strong>CONSULTA:</strong>&nbsp;Cuando la pretensión principal sea una consulta, es decir, se consulte la información personal de El Titular que repose en la base de datos de <strong>INGENIO</strong>, el procedimiento será el aquí establecido:</p>

<p>La consulta se formulará mediante el diligenciamiento de los formatos de PQR <strong>INGENIO</strong> contenidos en la página web o al correo electrónico:&nbsp;contacto@ingeniocontenido.co.</p>

<p>Una vez recibido la consulta se deberá dar respuesta a El Titular, cualquiera que ella sea, dentro de los diez (10) días hábiles siguientes contados a partir de la fecha de recibo de la misma.</p>

<p>Si no fuere posible atender la consulta dentro de dicho término, se informará a El Titular, expresando los motivos de la demora e indicando la fecha en la que se atenderá la consulta, la cual no podrá superar los cinco (5) días hábiles siguientes al vencimiento del primer término.</p>

<p><strong>RECLAMO:</strong>&nbsp;Cuando la pretensión principal sea un reclamo, es decir, cuando el Titular considere que la información contenida en las Bases de Datos de <strong>INGENIO</strong> debe ser objeto de corrección, actualización o supresión, o cuando advierta el incumplimiento de cualquiera de los deberes contenidos en la Ley 1581 de 2012 por parte de <strong>INGENIO</strong>, el procedimiento será el aquí establecido:
</p>

<p></p><ol>(i) El reclamo se formulará mediante solicitud dirigida al Responsable o Encargado de la Información, con el número de identificación de el Titular, la descripción de los hechos que dan lugar al reclamo, la dirección y los documentos que considere necesarios.<p></p></ol>

<p></p><ol>(ii) Si el reclamo se encuentra incompleto, se requerirá a el Titular o quien hiciera sus veces dentro de los cinco (5) días hábiles siguientes al recibo del reclamo a fin que subsane los errores.<p></p></ol>

<p></p><ol>(iii) Si pasados dos (2) meses desde la fecha del requerimiento de subsanación, el Titular o quien hiciere sus veces no presenta la información requerida, se entenderá que ha desistido del reclamo.<p></p></ol>

<p></p><ol>(iv) Una vez se reciba un reclamo con el lleno de los requisitos, se deberá incluir el mismo en las bases de datos en un término no mayor a dos (2) días hábiles identificándolo con una leyenda que diga "reclamo en trámite" y el motivo del mismo. Dicha leyenda deberá mantenerse hasta que el reclamo sea decidido<p></p></ol>

<p></p><ol>(v) Si pasados dos (2) meses desde la fecha del requerimiento de subsanación, el Titular o quien hiciere sus veces no presenta la información requerida, se entenderá que ha desistido del reclamo.<p></p></ol>

<p></p><ol>(vi) El término máximo para atender el reclamo será de quince (15) días hábiles contados a partir del día siguiente de su recibo. Cuando no fuere posible atender el reclamo dentro de este término, se informará al interesado los motivos de la demora y la fecha en la que se atenderá su reclamo, la cual no podrá superar ocho (8) días hábiles siguientes al vencimiento del término.
<p></p></ol>

<p></p><ol>(vii) En caso que <strong>INGENIO</strong> reciba un reclamo y no sea competente para resolverlo, dará traslado, en la medida de lo posible, a quien corresponda en un término máximo de dos (2) días hábiles e informará de la situación al interesado.
<p></p></ol>

<p></p><ol>(viii) Cuando la solicitud sea formulada por persona distinta del Titular y no se acredite que la misma actúa en representación de aquél, se tendrá por no presentada<p></p></ol><br>



<!-- 11 politica -->

<p><strong>11. RECTIFICACIÓN, ACTUALIZACIÓN Y SUPRESIÓN DE DATOS PERSONALES:</strong>&nbsp;De acuerdo a lo establecido en el punto 10 anterior, <strong>INGENIO</strong> rectificará, actualizará o suprimirá a solicitud del Titular, cualquier tipo de información, según el procedimiento y los términos señalados en el artículo anterior. Tratándose de rectificación y/o actualización, las correcciones propuestas deberán estar debidamente fundamentadas.
</p>

<p><strong>Parágrafo:</strong>&nbsp;El Titular de la información en todo momento tendrá derecho a solicitar la eliminación total o parcial de sus Datos Personales y para ello se seguirá el procedimiento establecido en el punto 10 anterior. <strong>INGENIO</strong> sólo podrá negar la eliminación cuando: i) El Titular tenga el deber legal y/o contractual de permanecer en la base de datos; ii) La supresión de los datos obstaculice actuaciones judiciales o administrativas en curso, y; iii) En los demás casos contemplados en el artículo 10 de la Ley 1581 de 2012, cuando sea procedente.</p><br>

<!-- 12 politica -->

<p><strong>12. MEDIDAS DE SEGURIDAD DE LA INFORMACIÓN: INGENIO</strong> adoptará las medidas técnicas, humanas y administrativas que sean necesarias para otorgar seguridad a los registros evitando su adulteración, pérdida, consulta, uso o acceso no autorizado o fraudulento; Dichas medidas responderán a los requerimientos mínimos hechos por la legislación vigente.</p><br>


<!-- 13 politica -->

<p><strong>13. DESIGNACIÓN: INGENIO</strong> designa al departamento de servicio al cliente o quien haga sus veces, para cumplir con la función de protección de Datos Personales, así como para dar trámite a las solicitudes de los Titulares, para el ejercicio de los derechos de acceso, consulta, rectificación, actualización, supresión y revocatoria a que se refiere la Ley 1581 de 2012, el Decreto 1377 de 2013 y la Política de Tratamiento de Datos Personales <strong>INGENIO</strong></p><br>

<!-- 14 politica -->

<p><strong>14. VIGENCIA:</strong>&nbsp;La presente Política para el Tratamiento de Datos Personales <strong>INGENIO</strong> estará vigente por un término igual al estatutariamente establecido para la duración de la sociedad o sus prórrogas.</p>

<p>De igual forma le recordamos que usted tiene el derecho de conocer, actualizar, rectificar y solicitar la supresión de sus datos personales en cualquier momento, para lo cual les solicitamos comunicarnos su decisión a la cuenta de correo anteriormente mencionada o mediante la página web.</p>

<p>Las bases de datos en las que se registrarán los datos personales tendrán una vigencia igual al tiempo en que se mantenga y utilice la información para las finalidades descritas en esta política. Una vez se cumplan esas finalidades y siempre que no exista un deber legal o contractual de conservar su información, sus datos serán eliminados de nuestras bases de datos</p> <br>

<p>Atentamente,</p>

<p><strong>INGENIO CONTENIDO DIGITAL SAS</strong></p>

</span></div>
        </div>
        `;
        break;
    }
    return res.view('pages/front/cms',{content:content,tag:await sails.helpers.getTag(req.hostname),menu:await sails.helpers.callMenu(seller!==null ? seller.domain : undefined),seller:seller});
  },

  dafitiSync : async (req, res)=>{
    let data = req.body.payload;
    let identifier = req.param('identifier');
    let integration;

    switch (req.body.event) {
      case 'onOrderCreated':
        if(identifier){
          let order = req.body.payload.OrderId;

          if(!order){
            return res.serverError('No se Localizó la Orden Solicitada'+req.body.payload.OrderId);
          }

          integration = await Integrations.findOne({ channel : 'dafiti', key : identifier}).catch((e)=> {return res.serverError('No se localizó lla integracion');});
          let data = await sails.helpers.channel.dafiti.orderbyid(integration.seller,  ['OrderId='+order] ).catch((e)=> {return res.serverError('Error durante la generación de la orden'); });
          let seller = await Seller.findOne({id: integration.seller});
          if (data && seller.integrationErp) {
            await sails.helpers.integrationsiesa.exportOrder(data);
          }
        }
        break;
      case 'onOrderItemsStatusChanged':

        let state = await sails.helpers.orderState(data.NewStatus).catch((e)=>{return res.serverError('Error Actualizando el estado del pedido'); });

        if(!state){
          return res.serverError('Nuevo estado del pedido no identificado');
        }
        let order = await Order.updateOne({ channelref:data.OrderId}).set({ currentstatus : state });
        let seller = await Seller.findOne({id: order.seller});
        if (seller && seller.integrationErp && state) {
          let resultState = state.name === 'en procesamiento' ? 'En procesa' : state.name === 'reintegrado' ? 'Reintegrad' : state.name.charAt(0).toUpperCase() + state.name.slice(1);
          await sails.helpers.integrationsiesa.updateCargue(order.reference, resultState);
        }
        break;
      default:
        break;
    }

    return res.ok();
  },

  linioSync : async (req, res)=>{
    let data = req.body.payload;
    let identifier = req.param('identifier');
    let integration;

    switch (req.body.event) {
      case 'onOrderCreated':
        if(identifier){
          let order = req.body.payload.OrderId;

          if(!order){
            return res.serverError('No se Localizó la Orden Solicitada'+req.body.payload.OrderId);
          }

          integration = await Integrations.findOne({ channel : 'linio', key : identifier}).catch((e)=> {return res.serverError('No se localizó la integracion');});
          let data = await sails.helpers.channel.linio.orderbyid(integration.seller,  ['OrderId='+order] ).catch((e)=> {return res.serverError('Error durante la generación de la orden'); });
          let seller = await Seller.findOne({id: integration.seller});
          if (data && seller.integrationErp) {
            await sails.helpers.integrationsiesa.exportOrder(data);
          }
        }
        break;
      case 'onOrderItemsStatusChanged':

        let state = await sails.helpers.orderState(data.NewStatus).catch((e)=>{return res.serverError('Error Actualizando el estado del pedido'); });

        if(!state){
          return res.serverError('Nuevo estado del pedido no identificado');
        }
        let order = await Order.updateOne({ channelref:data.OrderId}).set({ currentstatus : state });
        let seller = await Seller.findOne({id: order.seller});
        if (seller && seller.integrationErp && state) {
          let resultState = state.name === 'en procesamiento' ? 'En procesa' : state.name === 'reintegrado' ? 'Reintegrad' : state.name.charAt(0).toUpperCase() + state.name.slice(1);
          await sails.helpers.integrationsiesa.updateCargue(order.reference, resultState);
        }
        break;
      default:
        break;
    }

    return res.ok();
  }

};

