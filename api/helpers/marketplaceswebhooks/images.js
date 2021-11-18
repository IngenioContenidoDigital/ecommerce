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
    if(product ){
      for (let im of productImages.images) {
        try {
          if (im.file && im.src) {
            let url = (im.src.split('?'))[0];
            let file = (im.file.split('?'))[0];
            let uploaded = await sails.helpers.uploadImageUrl(url, file, product.id).catch((e)=>{
              throw new Error(`Ref: ${product.reference} : ${product.name} ocurrio un error obteniendo la imagen`);
            });
            if (uploaded) {
              let cover = 1;
              let totalimg = await ProductImage.count({ product: product.id});
              totalimg += 1;
              if (totalimg > 1) { cover = 0; }

              await ProductImage.findOrCreate({product: product.id, file: file},{
                file: file,
                position: totalimg,
                cover: cover,
                product: product.id
              }).exec(async (err, record, created)=>{
                if(err){return new Error(err.message);}
                if(!created){
                  await ProductImage.updateOne({id: record.id}).set({
                    file: file,
                    position: totalimg,
                    cover: cover
                  });
                }
                if(typeof(record) === 'object'){
                  result.push(record);
                }
              });                    
              sails.sockets.broadcast(sid, 'product_images_processed', {errors, result});
            }
          }
        } catch (err) {
          console.log(err.message);
          throw new Error (err.message);
        }
      }
    }
    return exits.success(true);
  }
};
