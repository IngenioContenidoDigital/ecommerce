module.exports = async function (req, res, proceed) {
  if (req.session.user.emailStatus==='confirmed') {return proceed();}
  return res.unverified();
};