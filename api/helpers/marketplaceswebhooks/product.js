module.exports = {
  friendlyName: 'Create product',
  description: 'Proceso para crear producto webhook',
  inputs: {
    shopifyProduct: {type:'json'},
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
    let product = inputs.shopifyProduct.product;
    let variations = inputs.shopifyProduct.productVariations;
    let images = inputs.shopifyProduct.productImages;
    try {
      let pro = await sails.helpers.checkProducts(product, seller);

      if(typeof(pro) === 'object'){
        let exists = await Product.findOne({reference: pro.reference, seller: pro.seller});
        if (!exists) {
          await Product.create(pro).fetch();
          await sails.helpers.marketplaceswebhooks.variations(variations, pro.reference, seller);
          await sails.helpers.marketplaceswebhooks.images(images, pro.reference, seller);
        } else {
          delete pro.mainCategory;
          delete pro.categories;
          await Product.updateOne({id: exists.id}).set(pro);
          await sails.helpers.marketplaceswebhooks.variations(variations, pro.reference, seller);
        }
      }
    } catch (error) {
      return exits.error(error);
    }
    return exits.success(true);
  }
};

