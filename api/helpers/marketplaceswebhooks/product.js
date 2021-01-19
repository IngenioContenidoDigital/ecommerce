module.exports = {
  friendlyName: 'Create product',
  description: 'Proceso para crear producto webhook',
  inputs: {
    product: {type:'json'},
    seller: {type : 'string'}
  },
  exits: {
    success: {
      description: 'All done.',
    },
    serverError:{
      description: 'Error de Proceso'
    }
  },
  fn: async function (inputs,exits) {
    let seller = inputs.seller;
    let product = inputs.product.product;
    let variations = inputs.product.productVariations;
    let images = inputs.product.productImages;
    try {
      let pro = await sails.helpers.checkProducts(product, seller);

      if(typeof(pro) === 'object'){
        let exists = await Product.findOne({externalId: pro.externalId, seller: pro.seller});
        if (!exists) {
          if (variations.variations.length > 0) {
            const createdProduct = await Product.create(pro).fetch();
            if (createdProduct) {
              await sails.helpers.marketplaceswebhooks.variations(variations, createdProduct.id, seller);
              await sails.helpers.marketplaceswebhooks.images(images, createdProduct.id, seller);
            }
          }
        } else {
          delete pro.mainCategory;
          delete pro.categories;
          const updatedProduct = await Product.updateOne({id: exists.id}).set(pro);
          if (updatedProduct) {
            await sails.helpers.marketplaceswebhooks.variations(variations, updatedProduct.id, seller);
            await sails.helpers.channel.channelSync(exists);
          }
        }
      }
    } catch (error) {
      return exits.error(error);
    }
    return exits.success(true);
  }
};

