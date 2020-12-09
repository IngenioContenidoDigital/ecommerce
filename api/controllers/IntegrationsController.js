/**
 * IntegrationsControllerController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
    meliauth:async (req,res) =>{
        let clientId = req.param('code');
        const meli = require('mercadolibre-nodejs-sdk');
        let integration = await Integrations.findOne({channel: 'mercadolibre', seller: req.param('state')});
        let mercadolibre = new meli.OAuth20Api();

        // Get the Auth URL, for example, country Argentina -> 1
        const authUrl = mercadolibre.apiClient.getBasePathFromSettings(3);
        // Auth URLs Options by country
        // [0]  - https://api.mercadolibre.com (default API endpoint)
        // [1]  - https://auth.mercadolibre.com.ar
        // [2]  - https://auth.mercadolivre.com.br
        // [3]  - https://auth.mercadolibre.com.co
        // [4]  - https://auth.mercadolibre.com.mx
        // [5]  - https://auth.mercadolibre.com.uy
        // [6]  - https://auth.mercadolibre.cl
        // [7]  - https://auth.mercadolibre.com.cr
        // [8]  - https://auth.mercadolibre.com.ec
        // [9]  - https://auth.mercadolibre.com.ve
        // [10] - https://auth.mercadolibre.com.pa
        // [11] - https://auth.mercadolibre.com.pe
        // [12] - https://auth.mercadolibre.com.pt
        // [13] - https://auth.mercadolibre.com.do

        // Use the correct auth URL
        mercadolibre.apiClient.basePath = authUrl;

        let redirectUri = 'https://'+req.hostname+'/mlauth/'+integration.user; // String | 
        mercadolibre.auth('code', clientId, redirectUri, async (error, data, result) => {
            if(error){ return res.redirect('/sellers?error='+err);}
            let updated = await Integrations.updateOne({id:integration.id}).set({url:result['refresh_token'],secret:result['access_token'],useridml:result['user_id']});
            if(updated){
                return res.redirect('/sellers?success=Integración Habilitada Exitosamente');
            }else{
                return res.redirect('/sellers?error=Error en el proceso, verifica los datos e intenta nuevamente.');
            }
        });
    }
};

