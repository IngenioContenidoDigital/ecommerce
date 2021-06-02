/**
 * IntegrationsControllerController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
  meliauth:async (req,res) =>{
    let code = req.param('code');
    let integration = await Integrations.findOne({id: req.param('state')}).populate('channel');
    let redirectUri = 'https://'+req.hostname+'/mlauth/'+integration.user; // String |
    let params = {
      'grant_type':'authorization_code',
      'client_id':integration.user,
      'client_secret':integration.key,
      'code':code,
      'redirect_uri':redirectUri,
    };

    let response = await sails.helpers.channel.mercadolibre.request('oauth/token',integration.channel.endpoint,'auth',params,'POST')
        .intercept((err) =>{
          return res.redirect('/sellers?error='+err.message);
        });

    if(response){
      await Integrations.updateOne({id:integration.id}).set({url:response['refresh_token'],secret:response['access_token'],useridml:response['user_id']});
      return res.redirect('/sellers?success=Integración Habilitada Exitosamente');
    }
  },
  updateintegration:async (req,res) =>{
    let integration = req.body.id;
    let price = req.body.price;
    let type = req.body.type;
    try {
      type === 'priceAdjustment' ? await Integrations.updateOne({id:integration}).set({priceAdjustment: price}) :
       await Integrations.updateOne({id:integration}).set({priceDiscount: price});
      return res.send({error: '', mgs: 'Se Actualizó Correctamente la Integración.'});
    } catch (err) {
      return res.send({error: 'No se logro actualizar la Integración.', mgs: ''});
    }
  }
};

