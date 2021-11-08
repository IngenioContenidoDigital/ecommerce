module.exports = {
  friendlyName: 'Create variations product',
  description: 'Proceso para crear las variaciones de un producto webhook',
  inputs: {
    productImages: {type: 'json'},
    productId: {type : 'string'},
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
  fn: async function (inputs, exits) {
    let seller = inputs.seller;
    let productId = inputs.productId;
    let productImages = inputs.productImages;
    let product = await Product.findOne({id: productId, seller:seller}).populate('images');
    if(product && product.images.length === 0){
      for (let im of productImages.images) {
        try {
          let url = (im.src.split('?'))[0];
          let file = (im.file.split('?'))[0];
          let existImage = await ProductImage.find({product: product.id, file: file});
          if (existImage.length === 0) {
            let uploaded = await sails.helpers.uploadImageUrl(url, file, product.id).catch((e)=>{
              throw new Error(`Ref: ${product.reference} : ${product.name} ocurrio un error obteniendo la imagen`);
            });
            if (uploaded) {
              let cover = 1;
              let totalimg = await ProductImage.count({ product: product.id});
              totalimg += 1;
              if (totalimg > 1) { cover = 0; }
              await ProductImage.create({
                file: file,
                position: totalimg,
                cover: cover,
                product: product.id
              }).fetch();
            }
          }
        } catch (err) {
          console.log(err);
          throw new Error (err.message);
        }
      }
    }
    return exits.success(true);
  }
};
