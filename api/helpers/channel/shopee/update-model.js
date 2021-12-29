module.exports = {
  friendlyName: 'Shopee Model',
  description: 'update model shopee.',
  inputs: {
    integration: {
      type:'ref',
      required:true
    },
    itemId: {
      type: 'number',
      require:true
    },
    variations: {
      type: 'ref',
      require:true
    },
  },
  exits: {
    success: {
      description: 'All done.',
    },
    error: {
      description: 'Error.',
    },
  },
  fn: async function (inputs,exits) {
    try{
      let response = await sails.helpers.channel.shopee.request('/api/v2/product/get_model_list',inputs.integration.channel.endpoint,[`shop_id=${parseInt(inputs.integration.shopid)}`,`language=es-mx`,`access_token=${inputs.integration.secret}`,`item_id=${inputs.itemId}`]);
      if (response && !response.error) {
        let bodyVariationsPrice = [];
        let bodyVariationsStock = [];
        let models = response.response.model;
        for (const model of models) {
          let resultModel = inputs.variations.model.find(variation => variation.model_sku === model.model_sku);
          if (resultModel) {
            bodyVariationsPrice.push(
              {
                model_id: model.model_id,
                original_price: resultModel.original_price
              }
            );
            bodyVariationsStock.push(
              {
                model_id: model.model_id,
                normal_stock: resultModel.normal_stock
              }
            );
          }
        }
        let bodyPrice = {
          item_id: inputs.itemId,
          price_list: bodyVariationsPrice
        };
        let bodyStock = {
          item_id: inputs.itemId,
          stock_list: bodyVariationsStock
        };
        let responseUpdatePrice = await sails.helpers.channel.shopee.request('/api/v2/product/update_price',inputs.integration.channel.endpoint,[`shop_id=${parseInt(inputs.integration.shopid)}`,`language=es-mx`,`access_token=${inputs.integration.secret}`],bodyPrice,'POST');
        if (responseUpdatePrice && !responseUpdatePrice.error) {
          let responseUpdateStock = await sails.helpers.channel.shopee.request('/api/v2/product/update_stock',inputs.integration.channel.endpoint,[`shop_id=${parseInt(inputs.integration.shopid)}`,`language=es-mx`,`access_token=${inputs.integration.secret}`],bodyStock,'POST');
          if (responseUpdateStock && responseUpdateStock.error) {
            return exits.error(responseUpdateStock.message);
          }
        } else {
          return exits.error(responseUpdatePrice.message);
        }
      }
      return exits.success();
    }catch(err){
      console.log(err);
      return exits.error(err.message);
    }
  }
};

