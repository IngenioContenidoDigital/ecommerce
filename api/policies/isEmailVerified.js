module.exports = async function (req, res, proceed) {
  if (req.session.user.emailStatus==='confirmed') {return proceed();}
  //Enviar un Email de Verificación con el código para validar.
  return res.unverified();
};