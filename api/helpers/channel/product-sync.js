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
          status:false,
          qc:false,
          reason: ''
        });
        await sails.helpers.channel.syncImages(integration, product);
      } catch (error) {
        return exits.error(error.message);
      }
    }
    return exits.success();
  }
};
