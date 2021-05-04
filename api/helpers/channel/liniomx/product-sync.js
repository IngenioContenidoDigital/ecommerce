module.exports = {
  friendlyName: 'Product sync',
  description: 'Para recibir los productos creados en linio mexico',
  inputs: {
    integration: {
      type:'ref',
      required:true,
    },
    skus:{
      type:'ref',
      required:true
    }
  },
  exits: {
    success: {
      description: 'All done.',
    },
    error:{
      description: 'Error'
    },
  },
  fn: async function (inputs,exits) {
    const jsonxml = require('jsontoxml');
    let sellerSkus = inputs.skus;
    let integration = inputs.integration;
    let listproducts = [];
    for (const sku of sellerSkus) {
      const productVariation = await ProductVariation.findOne({id: sku});
      if (productVariation) {
        if(!listproducts.includes(productVariation.product)){
          listproducts.push(productVariation.product);
        }
      }
    }
    for (const pro of listproducts) {
      try {
        let product = await Product.findOne({id: pro}).populate('channels',{integration: integration.id});
        const productChannelId = product.channels.length > 0 ? product.channels[0].id : '';
        await ProductChannel.updateOne({id: productChannelId}).set({
          iscreated:true,
          status:true,
          qc:true,
          reason: ''
        });
        let imgresult = await sails.helpers.channel.liniomx.images([product], integration.id);
        const imgxml = jsonxml(imgresult,true);
        let imgsign = await sails.helpers.channel.liniomx.sign(integration.id, 'Image', product.seller);
        await sails.helpers.request(integration.channel.endpoint,'/?'+imgsign,'POST',imgxml);
      } catch (error) {
        return exits.error(error.message);
      }
    }
    return exits.success();
  }
};
