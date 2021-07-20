/* eslint-disable camelcase */
/**
 * OrderController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
  liststates: async function(req, res){
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if(rights.name!=='superadmin' && !_.contains(rights.permissions,'liststates')){
      throw 'forbidden';
    }
    let error= req.param('error') ? req.param('error') : null;
    let state = null;
    let action = req.param('action') ? req.param('action') : null;
    let id = req.param('id') ? req.param('id') : null;
    let orderstate = await Seller.find();
    let colors = await Color.find();
    if(id){
      state = await OrderState.findOne({id:id}).populate('color');
    }

    orderstate = await OrderState.find().populate('color');
    return res.view('pages/orders/orderstate',{layout:'layouts/admin',action:action, error:error, orderstate:orderstate, state:state, colors:colors});
  },
  stateadd: async function(req, res){
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if(rights.name!=='superadmin' && !_.contains(rights.permissions,'stateadd')){
      throw 'forbidden';
    }
    let error = null;
    let isActive = (req.body.activo==='on') ? true : false;
    try{
      await OrderState.create({name:req.body.name.trim().toLowerCase(), color:req.body.color, valid:isActive});
      return res.redirect('/order/state');
    }catch(err){
      error = err;
      return res.redirect('/order/state?error?'+error);
    }
  },
  stateedit: async function(req, res){
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if(rights.name!=='superadmin' && !_.contains(rights.permissions,'stateedit')){
      throw 'forbidden';
    }
    let error = null;
    let isActive = (req.body.activo==='on') ? true : false;
    try{
      await OrderState.updateOne({id:req.param('id')}).set({name:req.body.name.trim().toLowerCase(), color:req.body.color, valid:isActive});
      return res.redirect('/order/state');
    }catch(err){
      error = err;
      return res.redirect('/order/state?error?'+error);
    }
  },
  validstate: async function(req, res){
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if(rights.name!=='superadmin' && !_.contains(rights.permissions,'validstate')){
      throw 'forbidden';
    }
    if (!req.isSocket) {
      return res.badRequest();
    }
    var id = req.param('id');
    var state = req.body.active;
    var updatedState = await OrderState.updateOne({id:id}).set({valid:state});
    return res.send(updatedState);
  },
  createorder:async function(req, res){
    let seller = null;
    if(req.hostname!=='iridio.co' && req.hostname!=='demo.1ecommerce.app' && req.hostname!=='localhost' && req.hostname!=='localhost' && req.hostname!=='1ecommerce.app'){seller = await Seller.findOne({domain:req.hostname/*'sanpolos.com'*/});}
    let order = [];
    let payment = null;
    let address = await Address.findOne({id:req.body.deliveryAddress})
    .populate('country')
    .populate('city');
    let user = await User.findOne({id:req.session.user.id});
    let cart = await Cart.findOne({id:req.session.cart.id}).populate('discount');

    let carttotal = req.session.cart.total+req.session.cart.shipping;
    let paymentmethod = req.body.paymentMethod;

    switch(paymentmethod){
      case 'CC':

        try{
          paymentInfo = {
            token_card:null,
            customer_id:null,
            doc_type: null,
            doc_number: null,
            name: null,
            last_name: ' ',
            email: user.emailAddress,
            bill: 'CR-'+cart.id,
            description: 'Orden de Pedido '+cart.id,
            value: carttotal,
            tax: ((carttotal/1.19)*0.19).toString(),
            tax_base: (carttotal/1.19).toString(),
            currency: 'COP',
            dues: req.body.payments,
            ip:require('ip').address(), /*This is the client's IP, it is required */
            url_response: req.protocol+'://'+req.hostname+'/respuesta?tx='+cart.id,
            url_confirmation: req.protocol+'://'+req.hostname+'/confirmacion',
            method_confirmation: 'POST',
            //Extra params: These params are optional and can be used by the commerce
            use_default_card_customer: false,/*if the user wants to be charged with the card that the customer currently has as default = true*/
          };
          let t = null;
          if(req.body.token!==undefined && req.body.token!==null){
            t = await Token.findOne({id:req.body.token});
          }
          if(t!==null){

            paymentInfo['token_card']=t.token;
            paymentInfo['customer_id']= t.customerId;
            paymentInfo['doc_type']= t.docType;
            paymentInfo['doc_number']= t.docNumber;
            paymentInfo['name']= t.name;
            paymentInfo['dues']=t.dues;

          }else{
            let creditInfo = {
              'card[number]': req.body.card,
              'card[exp_year]': req.body.year,
              'card[exp_month]': req.body.month,
              'card[cvc]': req.body.cvv
            };
            let token = await sails.helpers.payment.tokenize(creditInfo);

            let customerInfo = {
              token_card: token.id,
              name: req.body.cardname.toUpperCase().trim(),
              last_name: ' ',
              email: user.emailAddress,
              default: true,
              //Optional parameters: These parameters are important when validating the credit card transaction
              city: address.city.name,
              address: address.addressline1+' '+address.addressline2,
              /*phone: '3005234321',*/
              cell_phone: user.mobile.toString()
            };
            let customer = await sails.helpers.payment.customer(customerInfo,paymentmethod);

            paymentInfo['token_card']=token.id;
            paymentInfo['customer_id']= customer.data.customerId;
            paymentInfo['doc_type']= req.body.tid;
            paymentInfo['doc_number']= req.body.dni;
            paymentInfo['name']= req.body.cardname;

            if(req.body.tokenize==='on'){

              await Token.create({
                token:token.id,
                customerId:customer.data.customerId,
                docType:req.body.tid,
                docNumber:req.body.dni,
                mask:token.card.mask,
                frch:token.card.name,
                dues:req.body.payments,
                name:req.body.cardname,
                user:user.id
              });
            }
          }

          payment = await sails.helpers.payment.payment({mode:paymentmethod, info:paymentInfo});
          if(payment.success){
            order = await sails.helpers.order({address:address,user:user,cart:cart,method:paymentmethod,payment:payment,carrier:'coordinadora'});
          }else{
            let msg='Error en el proceso. Por favor intenta nuevamente';
            return res.redirect('/checkout?error='+msg);
          }
        }catch(err){
          return res.redirect('/checkout?error='+err);
        }
        break;
      case 'PSE':
        let pseInfo = {
          bank: req.body.bank,
          invoice: 'CR-'+cart.id,
          description: 'Orden de Pedido '+cart.id,
          value: (carttotal).toString(),
          tax: ((carttotal/1.19)*0.19).toString(),
          tax_base: (carttotal/1.19).toString(),
          currency: 'COP',
          type_person: req.body.person,
          doc_type: user.dniType,
          doc_number: user.dni.toString(),
          name: user.fullName,
          last_name: ' ',
          email: user.emailAddress,
          country: 'CO',
          cell_phone: user.mobile.toString(),
          ip:require('ip').address(), /*This is the client's IP, it is required */
          url_response: req.protocol+'://'+req.hostname+'/respuesta?tx='+cart.id,
          url_confirmation: req.protocol+'://'+req.hostname+'/confirmacion',
          method_confirmation: 'POST',
        };
        payment = await sails.helpers.payment.payment({mode:paymentmethod, info:pseInfo});
        if(payment.success){
          order = await sails.helpers.order({address:address,user:user,cart:cart,method:paymentmethod,payment:payment,carrier:'coordinadora'});
          delete req.session.cart;
          if(payment.data.urlbanco!=='' && payment.data.urlbanco!==null){
            return res.redirect(payment.data.urlbanco);
          }
        }else{
          let msg='Error en el proceso. Por favor intenta nuevamente';
          if(payment.data.errores[0]!==undefined){
            msg =payment.data.errores[0].errorMessage;
          }
          return res.redirect('/checkout?error='+msg);
        }
        break;
      case 'CS':
        try{
          let moment = require('moment');
          let cashInfo = {
            invoice: 'CR-'+cart.id,
            description: 'Orden de Pedido '+cart.id,
            value: (carttotal).toString(),
            tax: ((carttotal/1.19)*0.19).toString(),
            tax_base: (carttotal/1.19).toString(),
            currency: 'COP',
            type_person: '0',
            doc_type: user.dniType,
            doc_number: user.dni,
            name: user.fullName,
            last_name: ' ',
            email: user.emailAddress,
            cell_phone: user.mobile.toString(),
            end_date: moment().add(3, 'days').format('YYYY-MM-DD').toString(),//'2020-12-05',
            ip:require('ip').address(), /*This is the client's IP, it is required */
            url_response: req.protocol+'://'+req.hostname+'/respuesta?tx='+cart.id,
            url_confirmation: req.protocol+'://'+req.hostname+'/confirmacion',
            method_confirmation: 'POST',
          };
          payment = await sails.helpers.payment.payment({mode:paymentmethod, info:cashInfo, method:req.body.cash});
          if(payment.success){
            order = await sails.helpers.order({address:address,user:user,cart:cart,method:paymentmethod,payment:payment,extra:req.body.cash,carrier:'coordinadora'});
          }else{
            let msg='Error en el proceso. Por favor intenta nuevamente';
            if(payment.data.errores[0]!==undefined && payment.data.errores[0]!==null){
              msg =payment.data.errores[0].errorMessage;
            }
            return res.redirect('/checkout?error='+msg);
          }
        }catch(err){
          return res.redirect('/checkout?error='+err);
        }
        break;
      case 'COD':
        payment={data:{estado:'Pendiente',ref_payco:''}};
        order = await sails.helpers.order({address:address,user:user,cart:cart,method:paymentmethod,payment:payment,extra:req.body.codOp,carrier:'coordinadora'});
        break;
    }
    delete req.session.cart;
    await sails.helpers.sendEmail('email-order',{fullName:req.session.user.fullName,order:order,payment:payment},req.session.user.emailAddress,'Confirmación de Pedido');
    return res.view('pages/front/order',{order:order, payment:payment, tag:await sails.helpers.getTag(req.hostname),seller:seller});
  },
  listorders: async function(req, res){
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if(rights.name!=='superadmin' && !_.contains(rights.permissions,'listorders')){
      throw 'forbidden';
    }
    let moment = require('moment');
    let filter ={};
    let orders = [];
    const perPage = sails.config.custom.DEFAULTPAGE;
    if(rights.name!=='superadmin' && rights.name!=='admin'){ filter.seller = req.session.user.seller;}
    totalorders = await Order.count(filter);
    let pages = Math.ceil(totalorders/perPage);
    for(let st of orders){
      st.currentstatus = await OrderState.findOne({id:st.currentstatus.id})
      .populate('color');
    }

    return res.view('pages/orders/orders',{layout:'layouts/admin',
      orders:orders,
      pages:pages,
      moment:moment,
    });
  },
  findorders: async (req, res) =>{
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if(rights.name!=='superadmin' && !_.contains(rights.permissions,'listorders')){
      throw 'forbidden';
    }
    if (!req.isSocket) { return res.badRequest();}
    let filter = {};
    let ordersdata = [];
    let row = [];
    let moment = require('moment');
    let page = req.param('page') ? parseInt(req.param('page')) : 1;
    const perPage = sails.config.custom.DEFAULTPAGE;
    if(rights.name!=='superadmin' && rights.name!=='admin'){ filter.seller = req.session.user.seller;}
    ordersdata = [];
    let orders = null;
    orders = await Order.find({
      where: filter,
      sort: 'createdAt DESC',
      skip: ((page-1)*perPage),
      limit: perPage,
    })
      .populate('customer')
      .populate('seller');

    for(let o of orders){
      let track = '';
      let oitems = await OrderItem.find({order:o.id});
      const documentType = oitems[0].shippingType;
      o.currentstatus = await OrderState.findOne({id:o.currentstatus}).populate('color');
      if(o.tracking!==''){
        if (documentType === 'Cross docking') {
          track = `<a href="#" class="button trackingCrossDocking" tracking=${o.tracking}><span class="icon" tracking=${o.tracking}><i class="bx bx-printer" tracking=${o.tracking}></i></span></a>`;
        } else {
          track ='<a href="/guia/'+o.tracking+'" target="_blank" class="button"><span class="icon"><i class="bx bx-printer"></i></span></a>';
        }
      }
      row = [
        `<td class="align-middle><div class="field">
          <input class="is-checkradio is-small is-info" id="checkboxselect${o.id}" data-product="${o.id}" type="checkbox" name="checkboxselect">
          <label for="checkboxselect${o.id}"></label>
        </div></td>`,
        '<td scope="row" class="align-middle">'+o.reference+'</td>',
        '<td scope="row" class="align-middle">'+o.channel+'</td>',
        '<td scope="row" class="align-middle">'+o.paymentId ? o.paymentId : ''+'</td>',
        `<td class="align-middle"><ul>${o.manifest}</ul></td>`,
        '<td class="align-middle is-uppercase">'+o.paymentMethod+'</td>',
        '<td class="align-middle">'+o.customer.fullName+'</td>',
        '<td class="align-middle is-capitalized"><p class="container has-text-centered" style="background-color:'+o.currentstatus.color.code+'"><span class="is-size-7 has-text-black has-background-white">'+o.currentstatus.name+'</span></p></td>',
        '<td class="align-middle is-capitalized has-text-right">$&nbsp;'+Math.round(o.totalOrder).toLocaleString('es-CO')+'</td>',
        '<td class="align-middle">'+moment(o.createdAt).locale('es').format('DD MMMM YYYY HH:mm:ss')+'</td>',
        '<td class="align-middle"><span>'+o.seller.name+'</span></td>',
        '<td class="align-middle"><a href="/order/edit/'+o.id+'" target="_blank" class="button"><span class="icon"><i class="bx bx-duplicate"></i></span></a>'+track+'</td>',
      ];
      if(rights.name!=='superadmin' && rights.name!=='admin'){row.splice(10,1);}
      ordersdata.push(row);
    }
    return res.send(ordersdata);
  },
  ordermgt: async (req, res) =>{
    let id = req.param('id') ? req.param('id') : null;
    let error = req.param('error') ? req.param('error') : null;
    let action = req.param('action') ? req.param('action') : null;
    let moment = require('moment');
    let order = null;
    let ostates = null;
    let items = null;
    let countries = null;
    let documentType = null;
    if(id){
      order = await Order.findOne({id:id})
      .populate('addressDelivery')
      .populate('customer')
      .populate('currentstatus');

      order.addressDelivery = order.addressDelivery ? await Address.findOne({id:order.addressDelivery.id})
      .populate('country')
      .populate('region')
      .populate('city') : null;
      order.currentstatus = await OrderState.findOne({id:order.currentstatus.id}).populate('color');

      ostates = await OrderState.find().populate('color');

      items = await OrderItem.find({order:order.id});
      documentType = items[0].shippingType;
      for(let item of items){
        item.product = await Product.findOne({id:item.product})
        .populate('images',{cover:1})
        .populate('manufacturer')
        .populate('mainColor');
        item.currentstatus = await OrderState.findOne({id:item.currentstatus}).populate('color');
        item.productvariation = await ProductVariation.findOne({id:item.productvariation}).populate('variation');
        if(order.channel==='walmart'){
          let seller = await Seller.findOne({id:order.seller}).populate('currency');
          let channel = await Channel.findOne({name:order.channel}).populate('currency');
          if(seller.currency.isocode !== channel.currency.isocode){
            let exchange_rate = await sails.helpers.currencyConverter(seller.currency.isocode, channel.currency.isocode);
            item.originalPrice = item.originalPrice*exchange_rate.result;
          }
        }
      }
      countries = await Country.find();
    }

    return res.view('pages/orders/order',{layout:'layouts/admin',
      error:error,
      moment:moment,
      action:action,
      order:order,
      items:items,
      states:ostates,
      countries,
      documentType
    });
  },
  updateorder: async (req, res) =>{
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if(rights.name!=='superadmin' && !_.contains(rights.permissions,'updateorder')){
      throw 'forbidden';
    }
    if (!req.isSocket) {
      return res.badRequest();
    }
    let id = req.body.id;
    let user = req.session.user ? req.session.user : null;
    const ord = await Order.findOne({id:id});
    await sails.helpers.notification(ord, req.body.orderState);
    let order = await Order.updateOne({id:id}).set({currentstatus:req.body.orderState});
    let newstate = await OrderState.findOne({id:req.body.orderState}).populate('color');
    let seller = await Seller.findOne({id: order.seller});
    let oitems = await OrderItem.find({order:order.id});
    for(let it of oitems){
      await OrderItem.updateOne({id: it.id}).set({currentstatus: req.body.orderState});
    }
    if (seller && seller.integrationErp && newstate) {
      let resultState = newstate.name === 'en procesamiento' ? 'En procesa' : newstate.name === 'reintegrado' ? 'Reintegrad' : newstate.name.charAt(0).toUpperCase() + newstate.name.slice(1);
      await sails.helpers.integrationsiesa.updateCargue(order.reference, resultState);
    }
    if(newstate.name==='empacado' && order.tracking===''){
      await sails.helpers.carrier.shipment(id);
    }

    if(user!==null && user!== undefined){
      await OrderHistory.create({order:order.id,state:req.body.orderState,user:user.id});
    }else{
      await OrderHistory.create({order:order.id,state:req.body.orderState});
    }
    return res.send({newstate:newstate,order:order});
  },
  confirmation: async(req, res)=>{
    let orders = await Order.find({paymentId:req.body.x_ref_payco});
    let state = await sails.helpers.orderState(req.body.x_response);
    if(orders.length>0){
      for(let o in orders){
        if(orders[o].currentstatus!==state){
          await Order.updateOne({id:orders[o].id}).set({
            currentstatus:state
          });

          await OrderHistory.create({
            order:orders[o].id,
            state:state
          });

          await OrderItem.update({order:orders[o].id}).set({
            currentstatus: state
          });
        }
      }
    }
    return res.ok();
  },
  response: async(req, res)=>{
    let seller = null;
    if(req.hostname!=='iridio.co' && req.hostname!=='demo.1ecommerce.app' && req.hostname!=='localhost' && req.hostname!=='1ecommerce.app'){seller = await Seller.findOne({domain:req.hostname/*'sanpolos.com'*/});}
    let order = await Order.find({cart:req.param('tx')})
    .populate('currentstatus')
    .populate('seller');

    let valor = 0;
    let shipping = 0;
    for(let o of order){
      valor+=o.totalOrder;
      shipping+=o.totalShipping;
    }

    let payment={
      sucess:true,
      data:{
        ref_payco:order[0].paymentId,
        valor:valor,
        valor_pesos:valor,
        shipping:shipping,
        banco:'',
        codigoproyecto:'',
        pin:'',
      }
    };
    return res.view('pages/front/order',{order:order, payment:payment, tag:await sails.helpers.getTag(req.hostname),seller:seller});
  },
  report: async (req, res) => {
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if (rights.name!=='superadmin' && !_.contains(rights.permissions,'report')) {
      throw 'forbidden';
    }
    let sellers = [];
    let seller = req.session.user.seller;

    if (seller) {
      seller = await Seller.find({id:req.session.user.seller});
    } else {
      sellers = await Seller.find({});
    }
    return res.view('pages/orders/report', { layout: 'layouts/admin', sellers: sellers, seller: seller});
  },
  generateReportExcel:async (req, res) =>{
    const Excel = require('exceljs');
    const moment = require('moment');
    if (!req.isSocket) {
      return res.badRequest();
    }

    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if(rights.name!=='superadmin' && !_.contains(rights.permissions,'report')){
      throw 'forbidden';
    }

    let dateStart = new Date(req.param('startFilter')).valueOf();
    let dateEnd = new Date(req.param('endFilter')).valueOf();
    let seller = req.body.seller;

    let orders = await Order.find({
      where: {
        updatedAt: { '>': dateStart, '<': dateEnd },
        seller:seller
      }
    }).populate('customer').populate('currentstatus');

    let workbook = new Excel.Workbook();
    let worksheet = workbook.addWorksheet('Reporte');
    let ordersItem = [];
    worksheet.columns = [
      { header: 'Id', key: 'id', width: 26 },
      { header: 'Cliente', key: 'customer', width: 35 },
      { header: 'Email cliente', key: 'emailcustomer', width: 35 },
      { header: 'Fecha de creación', key: 'createdAt', width: 20 },
      { header: 'Estado', key: 'currentstatus', width: 12 },
      { header: 'Marca', key: 'manufacturer', width: 22 },
      { header: 'Producto', key: 'product', width: 56 },
      { header: 'Referencia', key: 'externalReference', width: 22 },
      { header: 'Color', key: 'color', width: 15 },
      { header: 'Talla', key: 'size', width: 15 },
      { header: 'Precio', key: 'price', width: 12 },
      { header: 'Método de pago', key: 'paymentMethod', width: 26 },
      { header: 'Código de pago', key: 'paymentId', width: 20 },
      { header: 'Marketplace', key: 'channel', width: 12 },
      { header: 'Referencia marketplace', key: 'channelref', width: 22 },
      { header: 'Referencia del pedido', key: 'orderref', width: 15 },
      { header: 'Número de rastreo', key: 'tracking', width: 20 },
      { header: 'Ciudad', key: 'city', width: 20 },
      { header: 'Departamento', key: 'region', width: 20 },
      { header: 'Dirección', key: 'address', width: 46 },
    ];
    worksheet.getRow(1).font = { bold: true };

    for (const order of orders) {
      let items = await OrderItem.find({order: order.id});
      let address = await Address.find({id:order.addressDelivery}).populate('region').populate('city');
      items.forEach(async item => {
        let product = await Product.findOne({id: item.product}).populate('mainColor').populate('seller').populate('manufacturer');
        let productVariation = await ProductVariation.findOne({id: item.productvariation}).populate('variation');
        item.id = order.id;
        item.customer = order.customer.fullName;
        item.emailcustomer = order.customer.emailAddress;
        item.createdAt = moment(order.createdAt).format('DD-MM-YYYY');
        item.currentstatus = order.currentstatus.name;
        item.manufacturer = product.manufacturer.name;
        item.product = product.name;
        item.color = product.mainColor.name;
        item.size = productVariation ? productVariation.variation.col : '';
        item.paymentMethod = order.paymentMethod;
        item.paymentId = order.paymentId;
        item.channel = order.channel;
        item.channelref = order.channelref;
        item.orderref = order.reference;
        item.tracking = order.tracking;
        item.city = address.length > 0 ? address[0].city.name : '';
        item.region = address.length > 0 ? address[0].region.name : '';
        item.address = address.length > 0 ? address[0].addressline1 : '';
        ordersItem.push(item);
      });
    }
    worksheet.addRows(ordersItem);
    const buffer = await workbook.xlsx.writeBuffer();
    return res.send(buffer);
  },
  updatecoppel:async (req, res) =>{
    if (!req.isSocket) {
      return res.badRequest();
    }
    try{
      let response = await sails.helpers.channel.coppel.shipping(req.body);
      return res.send(response);
    }catch(e){
      console.log(e);
    }
  },
  manifest: async function(req, res){
    const moment = require('moment');
    const seller = req.session.user.seller;
    let listOrders = [];
    let orders = await Order.find({where: {seller: seller, channel: 'dafiti', manifest: {'!=': ''}}});
    for(let order of orders){
      if(!listOrders.some(e => e.manifest === order.manifest) && order.manifest){
        listOrders.push({manifest: order.manifest, date: order.dateManifest});
      }
    }
    res.view('pages/orders/manifest',{layout:'layouts/admin', listOrders, moment});
  },
  generatemanifest: async (req, res) =>{
    const jsonxml = require('jsontoxml');
    const seller = req.session.user.seller;
    const result = req.body.ordersSelected;
    let listItems = [];
    try {
      let orders = await Order.find({where: {id: result, seller: seller, channel: 'dafiti'}});
      for (const order of orders) {
        if (!order.manifest) {
          const orderItems = await OrderItem.find({order:order.id});
          for(let item of orderItems){
            if(!listItems.includes(item.externalReference)){
              listItems.push(item.externalReference);
            }
          }
        }
      }
      if (listItems.length > 0) {
        const OrderItemIds = listItems.join(',');
        const body = {
          Request: {
            OrderItemIds
          }
        };
        let integration = await Integrations.findOne({id: orders[0].integration}).populate('channel');
        const xml = jsonxml(body, true);
        let sign = await sails.helpers.channel.dafiti.sign(integration.id,'CreateForwardManifest',integration.seller);
        await sails.helpers.request(integration.channel.endpoint,'/?'+sign,'POST', xml).then(async (resData)=>{
          resData = JSON.parse(resData);
          if(resData.SuccessResponse.Body.ManifestCode){
            const manifest = resData.SuccessResponse.Body.ManifestCode;
            for (const order of orders) {
              await Order.updateOne({id:order.id}).set({manifest:manifest, dateManifest: moment().valueOf()});
            }
            return res.send({manifest, error: null});
          }else{
            return res.send({manifest: null, error: resData.ErrorResponse.Head.ErrorMessage});
          }
        });
      } else {
        return res.send({manifest: null, error: 'No hay items para generar el manifiesto'});
      }
    } catch (error) {
      return res.send({manifest: null, error: 'Error al generar el manifiesto'});
    }
  },
  verifyorder: async (req, res) =>{
    if (!req.isSocket) {return res.badRequest();}
    let id = req.body.id;
    const order = await Order.findOne({id:id});
    let stateOrder = !order.addressDelivery || (!order.tracking && !order.carrier) ? true : false;
    let stateAddress = order.addressDelivery ? true : false;
    return res.send({stateOrder, stateAddress});
  },
  guideprocess: async (req, res) =>{
    let id = req.param('id');
    try {
      let order = await Order.findOne({id:id});
      let address = null;
      if (req.body.addressline1) {
        address = await Address.findOrCreate({addressline1:req.body.addressline1},{
          name: req.body.addressline1,
          addressline1: req.body.addressline1,
          addressline2: req.body.addressline2,
          country: req.body.country,
          region: req.body.region,
          city: req.body.city,
          notes: req.body.notes,
          zipcode: req.body.zipcode,
          user: order.customer,
        });
      }
      const carrier = await Carrier.findOne({name:req.body.transport.trim().toLowerCase()});
      order = await Order.updateOne({id:id}).set({transport:req.body.transport,currentstatus:req.body.status,addressDelivery: address ? address.id : order.addressDelivery, carrier: carrier.id});
      let oitems = await OrderItem.find({order:order.id});
      for(let it of oitems){
        await OrderItem.updateOne({id: it.id}).set({currentstatus: req.body.status});
      }
      if(order.tracking === ''){
        await sails.helpers.carrier.shipment(id);
      }
      return res.redirect('/order/edit/'+order.id);
    } catch (err) {
      return res.redirect('/order/edit/'+id+'?error='+err.message);
    }
  },
  downloadordersexcel: async function (req, res) {
    const Excel = require('exceljs');
    const moment = require('moment');
    let orders = req.body.orders;
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
  }
};
