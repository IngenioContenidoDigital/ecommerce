module.exports = async function unverified() {

  var req = this.req;
  var res = this.res;

  sails.log.verbose('Ran custom response: res.unverified()');
  await sails.helpers.sendEmail('email-verify',{fullName:req.session.user.fullName,verification:req.session.user.verification},req.session.user.emailAddress,'Verifica tu Cuenta');
  return res.view('pages/front/verify',{error:null});

};