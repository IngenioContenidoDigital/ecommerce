/**
 * UserController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
  registerform: async function(req, res){
    return res.view('pages/front/register');
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
            let user = await User.create({emailAddress:req.body.email,emailStatus:'unconfirmed',password:await sails.helpers.passwords.hashPassword(req.body.password),fullName:req.body.fullname,verification:verification}).fetch();
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
  }
};

