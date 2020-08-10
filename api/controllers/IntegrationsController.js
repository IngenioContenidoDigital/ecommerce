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
        mercadolibre.authorize(authcode, 'https://iridio.co/'+integration.user, async (err, result) =>{
            if(err){console.log(err);}
            await Integration.updateOne({id:integration.id}).set({url:result['refresh_token'],secret:result['access_token']});
            return res.redirect('/products');
        }); 
    }
};

