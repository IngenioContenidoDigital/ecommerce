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
        let integration = await Integrations.findOne({channel: 'mercadolibre', seller: req.param('state')});
        let mercadolibre = new meli.Meli(integration.user, integration.key);

        mercadolibre.authorize(authcode, 'https://'+req.hostname+'/mlauth/'+integration.user, async (err, result) =>{
            if(err){ return res.redirect('/sellers?error='+err);}
            let updated = await Integrations.updateOne({id:integration.id}).set({url:result['refresh_token'],secret:result['access_token'],useridml:result['user_id']});
            if(updated){
                return res.redirect('/sellers?success=Integración Habilitada Exitosamente');
            }else{
                return res.redirect('/sellers?error=Error en el proceso, verifica los datos e intenta nuevamente.');
            }
        });
    }
};

