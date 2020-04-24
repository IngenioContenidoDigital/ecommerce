/* eslint-disable camelcase */
/**
 * OrderController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
  liststates: async function(req, res){
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
    return res.view('pages/orders/orderstate',{action:action, error:error, orderstate:orderstate, state:state, colors:colors});
  },
  stateadd: async function(req, res){
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
    let order = null;
    let payment = null;
    let address = await Address.findOne({id:req.body.deliveryAddress}).populate('country');
    let user = await User.findOne({id:req.session.user.id});
    let cart = await Cart.findOne({id:req.session.cart.id});
    let cartproducts = await CartProduct.find({cart:cart.id})
                  .populate('product')
                  .populate('productvariation');

    let carttotal = 0;
    cartproducts.forEach(async cp=>{
      carttotal+= cp.productvariation.price;
    });

    let paymentmethod = req.body.paymentMethod;

    switch(paymentmethod){
      case 'CC':

        let creditInfo = {
          'card[number]': req.body.card,
          'card[exp_year]': req.body.year,
          'card[exp_month]': req.body.month,
          'card[cvc]': req.body.cvv
        };
        let token = await sails.helpers.payment.tokenize(creditInfo);

        let customerInfo = {
          token_card: token.id,
          name: user.fullName,
          last_name: ' ',
          email: user.emailAddress,
          default: true,
          //Optional parameters: These parameters are important when validating the credit card transaction
          city: address.city,
          address: address.addressline1+' '+address.addressline1,
          /*phone: '3005234321',
          cell_phone: '3010000001'*/
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
        if(payment.status){
          order = await sails.helpers.order({address:address,user:user,cart:cart,method:paymentmethod,payment:payment});
        }else{
          let msg='Error en el proceso. Por favor intenta nuevamente';
          return res.redirect('/checkout?error='+msg);
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
          doc_type: 'CC',
          doc_number: '10358519',
          name: user.fullName,
          last_name: ' ',
          email: user.emailAddress,
          country: 'CO',
          cell_phone: '3010000001',
          ip:require('ip').address(), /*This is the client's IP, it is required */
          url_response: 'http://localhost:1337/respuesta',
          url_confirmation: 'http://localhost:1337/confirmacion',
          method_confirmation: 'POST',
        };
        payment = await sails.helpers.payment.payment({mode:paymentmethod, info:pseInfo});
        if(payment.data.urlbanco!=='' && payment.data.urlbanco!==null){
          const open = require('open');
          (async ()=>{
            await open(payment.data.urlbanco);
          })();
        }
        order = await sails.helpers.order({address:address,user:user,cart:cart,method:paymentmethod,payment:payment});
        break;
      case 'CS':
        let moment = require('moment');
        let cashInfo = {
          invoice: 'CR-'+cart.id,
          description: 'pay test',
          value: (carttotal).toString(),
          tax: ((carttotal/1.19)*0.19).toString(),
          tax_base: (carttotal/1.19).toString(),
          currency: 'COP',
          type_person: '0',
          doc_type: 'CC',
          doc_number: '10358519',
          name: user.fullName,
          last_name: ' ',
          email: user.emailAddress,
          cell_phone: '3010000001',
          end_date: moment().add(3, 'days').format('YYYY-MM-DD').toString(),//'2020-12-05',
          ip:require('ip').address(), /*This is the client's IP, it is required */
          url_response: 'http://localhost:1337/respuesta',
          url_confirmation: 'http://localhost:1337/confirmacion',
          method_confirmation: 'POST',
        };
        payment = await sails.helpers.payment.payment({mode:paymentmethod, info:cashInfo, method:req.body.cash});
        order = await sails.helpers.order({address:address,user:user,cart:cart,method:paymentmethod,payment:payment,extra:req.body.cash});
        break;
      case 'COD':
        order = await sails.helpers.order({address:address,user:user,cart:cart,method:paymentmethod,payment:{data:{estado:'Pendiente',ref_payco:''}},extra:req.body.codOp});
        break;
    }
    delete req.session.cart;
    return res.view('pages/front/order',{order:order, payment:payment});
  },
  listorders: async function(req, res){
    let error = req.param('error') ? req.param('error') : null;
    let moment = require('moment');
    let orders = await Order.find().sort('createdAt DESC')
    .populate('customer')
    .populate('currentstatus');

    for(let st of orders){
      st.currentstatus = await OrderState.findOne({id:st.currentstatus.id})
      .populate('color');
    }
    return res.view('pages/orders/orders',{orders:orders,error:error, moment:moment});
  }

};

