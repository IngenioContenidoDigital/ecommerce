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

    /*
     Aceptada
        Franquicia: Visa
        Numero: 4575623182290326
        Fecha Expiración: 12/25
        Cvv: 123
        Estado: Aceptada
        Respuesta: Aceptada

      Fondos insuficientes
        Franquicia: Visa
        Numero: 4151611527583283
        Fecha Expiración: 12/25
        Cvv: 123
        Estado: Rechazada
        Respuesta: Fondos Insuficientes

      Fallida
        Franquicia: Mastercard
        Numero: 5170394490379427
        Fecha Expiración: 12/25
        Cvv: 123
        Estado: Fallida
        Respuesta: Error de comunicación con el centro de autorizaciones

      Pendiente
        Franquicia: American Express
        Numero: 373118856457642
        Fecha Expiración: 12/25
        Cvv: 123
        Estado: Pendiente
        Respuesta: Transacción pendiente por validación
    */
    let order = [];
    let payment = null;
    let address = await Address.findOne({id:req.body.deliveryAddress})
    .populate('country')
    .populate('city');
    let user = await User.findOne({id:req.session.user.id});
    let cart = await Cart.findOne({id:req.session.cart.id});

    let carttotal = req.session.cart.total;
    let paymentmethod = req.body.paymentMethod;

    switch(paymentmethod){
      case 'CC':
        try{

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

          let customer = await sails.helpers.payment.customer(customerInfo);

          let paymentInfo = {
            token_card: token.id,
            customer_id: customer.data.customerId,
            doc_type: req.body.tid,
            doc_number: req.body.dni,
            name: req.body.cardname,
            last_name: ' ',
            email: user.emailAddress,
            bill: 'CR-'+cart.id,
            description: 'Test Payment',
            value: carttotal,
            tax: ((carttotal/1.19)*0.19).toString(),
            tax_base: (carttotal/1.19).toString(),
            currency: 'COP',
            dues: req.body.payments,
            ip:require('ip').address(), /*This is the client's IP, it is required */
            url_response: 'http://localhost:1337/respuesta',
            url_confirmation: 'http://localhost:1337/confirmacion',
            method_confirmation: 'POST',
            //Extra params: These params are optional and can be used by the commerce
            use_default_card_customer: false,/*if the user wants to be charged with the card that the customer currently has as default = true*/
          };

          payment = await sails.helpers.payment.payment({mode:paymentmethod, info:paymentInfo});
          if(payment.success){
            order = await sails.helpers.order({address:address,user:user,cart:cart,method:paymentmethod,payment:payment});
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
          description: 'pay test',
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
          url_response: 'http://localhost:1337/respuesta',
          url_confirmation: 'http://localhost:1337/confirmacion',
          method_confirmation: 'POST',
        };
        payment = await sails.helpers.payment.payment({mode:paymentmethod, info:pseInfo});
        if(payment.success){
          if(payment.data.urlbanco!=='' && payment.data.urlbanco!==null){
            const open = require('open');
            (async ()=>{
              await open(payment.data.urlbanco);
            })();
          }
          order = await sails.helpers.order({address:address,user:user,cart:cart,method:paymentmethod,payment:payment});
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
            description: 'pay test',
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
            url_response: 'http://localhost:1337/respuesta',
            url_confirmation: 'http://localhost:1337/confirmacion',
            method_confirmation: 'POST',
          };
          payment = await sails.helpers.payment.payment({mode:paymentmethod, info:cashInfo, method:req.body.cash});
          if(payment.success){
            order = await sails.helpers.order({address:address,user:user,cart:cart,method:paymentmethod,payment:payment,extra:req.body.cash});
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
        order = await sails.helpers.order({address:address,user:user,cart:cart,method:paymentmethod,payment:{data:{estado:'Pendiente',ref_payco:''}},extra:req.body.codOp});
        break;
    }
    delete req.session.cart;
    return res.view('pages/front/order',{order:order, payment:payment});
  },
  listorders: async function(req, res){
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if(rights.name!=='superadmin' && !_.contains(rights.permissions,'listorders')){
      throw 'forbidden';
    }
    let error = req.param('error') ? req.param('error') : null;
    let action = req.param('action') ? req.param('action') : null;
    let id = req.param('id') ? req.param('id') : null;
    let moment = require('moment');
    let items = null;
    let order = null;
    let ostates = null;

    if(id){
      order = await Order.findOne({id:id})
      .populate('addressDelivery')
      .populate('customer')
      .populate('currentstatus');

      order.addressDelivery = await Address.findOne({id:order.addressDelivery.id})
      .populate('country')
      .populate('region')
      .populate('city');
      order.currentstatus = await OrderState.findOne({id:order.currentstatus.id}).populate('color');

      ostates = await OrderState.find().populate('color');

      items = await OrderItem.find({order:order.id})
      .populate('product')
      .populate('productvariation');

      items.forEach(async item =>{
        item.product = await Product.findOne({id:item.product.id})
        .populate('images')
        .populate('manufacturer')
        .populate('mainColor');

        item.productvariation = await ProductVariation.findOne({id:item.productvariation.id}).populate('variation');
      });
    }

    let orders = await Order.find().sort('createdAt DESC')
    .populate('customer')
    .populate('currentstatus');

    for(let st of orders){
      st.currentstatus = await OrderState.findOne({id:st.currentstatus.id})
      .populate('color');
    }

    return res.view('pages/orders/orders',{layout:'layouts/admin',
      orders:orders,
      error:error,
      moment:moment,
      action:action,
      order:order,
      items:items,
      states:ostates
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
    let order = await Order.updateOne({id:id}).set({currentstatus:req.body.orderState});
    let newstate = await OrderState.findOne({id:req.body.orderState}).populate('color');
    if(newstate.name==='empacado' && order.tracking===''){
      await sails.helpers.carrier.shipment(id);
    }

    if(user!==null && user!== undefined){
      await OrderHistory.create({order:order.id,state:req.body.orderState,user:user.id});
    }else{
      await OrderHistory.create({order:order.id,state:req.body.orderState});
    }
    return res.send(newstate);
  }

};

