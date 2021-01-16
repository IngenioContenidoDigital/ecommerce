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
          await Product.create(pro).fetch();
          await sails.helpers.marketplaceswebhooks.variations(variations, pro.reference, seller);
          await sails.helpers.marketplaceswebhooks.images(images, pro.reference, seller);
        } else {
          delete pro.mainCategory;
          delete pro.categories;
          await Product.updateOne({id: exists.id}).set(pro);
          await sails.helpers.marketplaceswebhooks.variations(variations, pro.reference, seller);
          await sails.helpers.channel.channelSync(exists);
        }
      }
    } catch (error) {
      return exits.error(error);
    }
    return exits.success(true);
  }
};

