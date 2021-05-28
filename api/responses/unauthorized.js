/**
 * unauthorized.js
 *
 * A custom response that content-negotiates the current request to either:
 *  • log out the current user and redirect them to the login page
 *  • or send back 401 (Unauthorized) with no response body.
 *
 * Example usage:
 * ```
 *     return res.unauthorized();
 * ```
 *
 * Or with actions2:
 * ```
 *     exits: {
 *       badCombo: {
 *         description: 'That email address and password combination is not recognized.',
 *         responseType: 'unauthorized'
 *       }
 *     }
 * ```
 */
module.exports = async function unauthorized() {

  var req = this.req;
  var res = this.res;
  let seller = null;
  if(req.hostname!=='iridio.co' && req.hostname==='demo.1ecommerce.app' && req.hostname!=='localhost' && req.hostname!=='1ecommerce.app'){seller = await Seller.findOne({domain:req.hostname/*'sanpolos.com'*/});}
  sails.log.verbose('Ran custom response: res.unauthorized()');

  /*if (req.wantsJSON) {
    return res.sendStatus(401);
  }*/
  // Or log them out (if necessary) and then redirect to the login page.
  /*else {

    if (req.session.userId) {
      delete req.session.userId;
    }

    return res.redirect('/login');
  }*/
  return res.view('pages/configuration/login',{error:null,referer:req.originalUrl,seller:seller});

};
