module.exports = function serverError(err, optionalData) {
  handleErrors(err)
  
  this.res.view('500', { error : err });
};
