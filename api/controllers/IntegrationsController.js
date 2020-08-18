/**
 * IntegrationsControllerController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
    meliauth:async (req,res) =>{
        let authcode = req.param('code');
        const meli = require('mercadolibre');
        let integration = await Integrations.findOne({channel:'mercadolibre',user:req.param('appid')});
        let mercadolibre = new meli.Meli(integration.user, integration.key);
        mercadolibre.authorize(authcode, 'https://'+req.hostname+'/mlauth/'+integration.user, async (err, result) =>{
            if(err){ return res.redirect('/sellers?error='+err);}
            await Integrations.updateOne({id:integration.id}).set({url:result['refresh_token'],secret:result['access_token']});
            return res.redirect('/products');
        });
    }
};

