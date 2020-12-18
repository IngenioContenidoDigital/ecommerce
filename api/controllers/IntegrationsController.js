/**
 * IntegrationsControllerController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
    meliauth:async (req,res) =>{
        let code = req.param('code');
        let integration = await Integrations.findOne({channel: 'mercadolibre', seller: req.param('state')});
        let redirectUri = 'https://'+req.hostname+'/mlauth/'+integration.user; // String | 
        let params = {
            'grant_type':'authorization_code',
            'client_id':integration.user,
            'client_secret':integration.key,
            'code':code,
            'redirect_uri':redirectUri,
        }
        let response = await sails.helpers.channel.mercadolibre.request('oauth/token',params,'POST')
        .intercept((err) =>{
            return res.redirect('/sellers?error='+err.message);
        });
        if(response){
          await Integrations.updateOne({id:integration.id}).set({url:result.body['refresh_token'],secret:result.body['access_token'],useridml:result.body['user_id']});
          return res.redirect('/sellers?success=Integración Habilitada Exitosamente');
        }
    }
};

