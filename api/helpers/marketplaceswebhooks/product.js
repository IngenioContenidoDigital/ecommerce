module.exports = {
  friendlyName: 'Create product',
  description: 'Proceso para crear producto webhook',
  inputs: {
    product: {type:'json'},
    seller: {type: 'string'},
    discount: {type: 'boolean',defaultsTo:true}
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
        let exists = await Product.findOne({
          or : [
            {externalId: pro.externalId, seller: pro.seller},
            {reference: pro.reference, seller: pro.seller}
          ]
        });
        if (!exists) {
          if (variations.variations.length > 0) {
            const createdProduct = await Product.create(pro).fetch();
            if (createdProduct) {
              await sails.helpers.notificationProduct(createdProduct);
              await sails.helpers.marketplaceswebhooks.variations(variations, createdProduct.id, seller, inputs.discount);
              await sails.helpers.marketplaceswebhooks.images(images, createdProduct.id, seller).tolerate(() =>{return;});
            }
          }
        } else {
          delete pro.mainCategory;
          delete pro.categories;
          const updatedProduct = await Product.updateOne({id: exists.id}).set(pro);
          if (updatedProduct) {
            await sails.helpers.marketplaceswebhooks.variations(variations, updatedProduct.id, seller, inputs.discount);
            await sails.helpers.marketplaceswebhooks.images(images, updatedProduct.id, seller).tolerate(() =>{return;});
            await sails.helpers.channel.channelSync(exists);
          }
        }
      }
    } catch (error) {
      return exits.error(error.message);
    }
    return exits.success(true);
  }
};

