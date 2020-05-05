module.exports = function unverified() {

  var req = this.req;
  var res = this.res;

  sails.log.verbose('Ran custom response: res.unverified()');

  return res.view('pages/front/verify',{error:null});
  
};