/**
 * UserController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
  registerform: async function(req, res){
    let countries = await Country.find();
    return res.view('pages/front/register',{countries:countries});
  },
  createuser: async function(req, res){

    let https = require('https');
    let randomize = require('randomatic');
    const querystring = require('querystring');
    let data = {secret:'6LfK2-kUAAAAAF6eGv3Ykl2hiz1nxw7FexjIrqOt',response:req.body.token};
    let options = {
      hostname: 'www.google.com',
      port:443,
      path:'/recaptcha/api/siteverify',
      method:'POST',
      headers : {
	    'Content-Type': 'application/x-www-form-urlencoded'
	  }
    };

    const rq = https.request(options, rs =>{
      rs.on('data', async d =>{
        let captcha = JSON.parse(d.toString());
        let msg='';
        if(captcha.success){
          let verification = randomize('0',6);
          //Enviar un Email de Verificación con el código para validar.
          try{
            let country = await Country.findOne({id:req.body.country});
            let user = await User.create({
              emailAddress:req.body.email,
              emailStatus:'unconfirmed',
              password:await sails.helpers.passwords.hashPassword(req.body.password),
              fullName:req.body.fullname,
              verification:verification,
              dniType:req.body.dnitype,
              dni:req.body.dni,
              mobilecountry:country.id,
              mobile:req.body.mobile,
              mobileStatus:'unconfirmed'
            }).fetch();
            req.session.user=user;
            return res.view('pages/front/verify',{error:null});
          }catch(err){
            switch(err.code){
              case 'E_UNIQUE':
                msg = 'El email ya se encuentra registrado';
                break;
              default:
                msg = 'Ocurrió un error en el proceso, Por favor intenta nuevamente.';
                break;
            }
            return res.redirect('/register?error='+msg);
          }
        }else{
          msg='Error de Verificación Captcha.';
          return res.redirect('/register?error='+msg);
        }
      },req, res);
    }, req, res);

    rq.on('error', error => {
      return res.redirect('/register?error='+error);
    }, req, res);

    rq.write(querystring.stringify(data));
    rq.end();
  },
  validatemail: async function(req, res){
    /*if (!req.isSocket) {
      return res.badRequest();
    }*/
    let code = req.body.code1+req.body.code2+req.body.code3+req.body.code4+req.body.code5+req.body.code6;


    let user = await User.updateOne({emailAddress:req.body.email,verification:code}).set({emailStatus:'confirmed'});
    if(user===undefined){
      return res.view('pages/front/verify',{error:'El Código Ingresado es incorrecto. verifica el código e intenta nuevamente.'});
    }else if(user.emailStatus==='confirmed'){
      req.session.user=user;
      return res.redirect('/');
    }else{
      return res.view('pages/front/verify',{error:'Error en el proceso. Por favor Verifica e intenta nuevamente.'});
    }
  },
  users: async (req, res)=>{
    let error= req.param('error') ? req.param('error') : null;
    let user = null;
    let action = req.param('action') ? req.param('action') : null;
    let id = req.param('id') ? req.param('id') : null;
    let users = await User.find();
    if(id){
      user = await User.findOne({id:id});
    }
    let countries = await Country.find();
    let sellers = await Seller.find();
    return res.view('pages/configuration/users',{users:users, user:user,countries:countries,sellers:sellers,action:action,error:error});
  },
  admincreate: async (req, res) =>{
    let error = null;
    let isActive = (req.body.activo==='on') ? true : false;
    try{
      let country = await Country.findOne({id:req.body.country});
      await User.create({
        emailAddress:req.body.email,
        emailStatus:'confirmed',
        password:await sails.helpers.passwords.hashPassword(req.body.password),
        fullName:req.body.fullname,
        dniType:req.body.dnitype,
        dni:req.body.dni,
        mobilecountry:country.id,
        mobile:req.body.mobile,
        mobileStatus:'confirmed',
        seller:req.body.seller,
        active:isActive
      });
    }catch(err){
      error=err;
    }
    if(error!==null && error!==undefined){
      return res.redirect('/users?error='+error);
    }else{
      return res.redirect('/users');
    }
  },
  adminedit: async (req, res) =>{
    let error = null;
    let isActive = (req.body.activo==='on') ? true : false;
    try{
      if(req.body.password!=='' && req.body.password!==null && req.body.password!==undefined){
        await User.updateOne({id:req.param('id')}).set({
          emailAddress:req.body.email,
          fullName:req.body.fullname,
          dniType:req.body.dnitype,
          dni:req.body.dni,
          password:await sails.helpers.passwords.hashPassword(req.body.password),
          mobilecountry:req.body.country,
          mobile:req.body.mobile,
          seller:req.body.seller,
          active:isActive
        });
      }else{
        await User.updateOne({id:req.param('id')}).set({
          emailAddress:req.body.email,
          fullName:req.body.fullname,
          dniType:req.body.dnitype,
          dni:req.body.dni,
          mobilecountry:req.body.country,
          mobile:req.body.mobile,
          seller:req.body.seller,
          active:isActive
        });
      }
    }catch(err){
      error = err;
    }

    if(error!==null && error!==undefined){
      return res.redirect('/users?error='+error);
    }else{
      return res.redirect('/users');
    }
  },
  userstate: async (req,res) =>{
    if (!req.isSocket) {
      return res.badRequest();
    }
    var id = req.param('id');
    var state = req.body.active;
    var updatedUser = await User.updateOne({id:id}).set({active:state});
    return res.send(updatedUser);
  }
};

