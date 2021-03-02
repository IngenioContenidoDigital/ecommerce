module.exports = {
  friendlyName: 'Product sync',
  description: 'Para recibir los productos creados en dafiti y linio',
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
          reason: ''
        });
        let imgresult = integration.channel.name === 'dafiti' ? await sails.helpers.channel.dafiti.images([product], integration.id) : await sails.helpers.channel.linio.images([product], integration.id);
        const imgxml = jsonxml(imgresult,true);
        let imgsign = integration.channel.name === 'dafiti' ? await sails.helpers.channel.dafiti.sign(integration.id, 'Image', product.seller) : await sails.helpers.channel.linio.sign(integration.id, 'Image', product.seller);
        await sails.helpers.request(integration.channel.endpoint,'/?'+imgsign,'POST',imgxml);
      } catch (error) {
        return exits.error(error.message);
      }
    }
    return exits.success();
  }
};
