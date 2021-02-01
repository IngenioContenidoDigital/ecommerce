module.exports = {
    friendlyName: 'Create Seller Muybacano',
    description: 'Create seller at Muybacano marketplace',
    inputs: {
      integration:{
        type:'string',
        required:true,
      }
    },
    exits: {
      success: {
        description: 'All done.',
      },
    },
    fn: async function (inputs,exits) {
      let axios = require('axios');
      try{
        let integration = await Integrations.findOne({ id: inputs.integration }).populate('seller').populate('channel');
        
        options = {
            method: 'post',
            url: `${integration.channel.endpoint}/api/catalog_system/pvt/seller/${integration.seller.id}`,
            headers: {
                'X-VTEX-API-AppToken':integration.user,
                'X-VTEX-API-AppKey':integration.key,
                'content-type': 'application/json',
                accept: 'application/json'
            },
            data: {
                "SellerId":integration.seller.id,
                "Name":integration.seller.name,
                "Email":integration.seller.email,
                "Description":"",
                "ExchangeReturnPolicy":"",
                "DeliveryPolicy":"",
                "UseHybridPaymentOptions":true,
                "UserName":"",
                "Password":"",
                "SecutityPrivacyPolicy":"",
                "CNPJ":"",
                "CSCIdentification":integration.seller.name,
                "ArchiveId":null,
                "UrlLogo":`https://s3.amazonaws.com/iridio.co/images/sellers/${integration.seller.logo}`,
                "ProductCommissionPercentage":0,
                "FreightCommissionPercentage":0,
                "FulfillmentEndpoint":"https://1ecommerce.app/api/pvt/orderForms/simulation?sc=1&an=muybacano",
                "CatalogSystemEndpoint":"",
                "IsActive":true,
                "FulfillmentSellerId":"",
                "SellerType":1,
                "IsBetterScope":false
            }
        };
        await axios(options).catch((e) => console.log(e));
        return exits.success();
      }catch(err){
        console.log(err);
        return exits.error(err);
      }
    }
  };
  
  