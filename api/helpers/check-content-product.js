module.exports = {
  friendlyName: 'Product checker content',
  description: 'Check and validate a product content',
  inputs: {
    product: { type: 'ref' }
  },
  exits: {
    success: {
      description: 'All done.',
    },
  },
  fn: async (inputs, exits) => {
    const probe = require('probe-image-size');
    let product = inputs.product;
    let details = '';
    let sizeImages = false;
    let stock = 0;
    let images = await ProductImage.find({product:product.id}).sort('position ASC');
    let variations = await ProductVariation.find({product:product.id});
    let textClean = async (text) =>{
      text = text.replace(/\n/g, ' ');
      text=text.replace(/&(nbsp|amp|quot|lt|gt|bull|middot);/g,' ');
      text=text.replace(/([^\u0009\u000a\u000d\u0020-\uD7FF\uE000-\uFFFD]|\u2022)/ig,'');
      text=text.replace( /(<([^>]+)>)/ig, '');
      text=text.replace(/&/g,'y');
      text=text.replace(/[\/\\#,+()$~%.'":*?<>{} ]/g,'');
      text=text.trim();
      return JSON.stringify(text);
    };
    let description = await textClean(product.description) + await textClean(product.descriptionShort);

    if (description<=30) {
      details += 'Producto sin descripcion | ';
    }
    if (images.length === 0) {
      details += 'Producto sin imagenes | ';
    } else {
      for (const image of images) {
        let result = await probe(sails.config.views.locals.imgurl+'/images/products/'+product.id+'/'+image.file);
        if (result.width < 1000 || result.height < 1000) {
          sizeImages = true;
        }
      }
      if (sizeImages) {
        details += 'Algunas imagenes del producto no cumplen con el tamaño establecido 1000*1000 | ';
      }
    }

    if (variations.length === 0) {
      details += 'Producto sin variaciones | ';
    } else {
      for(let variation of variations){
        const pvstock = variation.quantity;
        const resultStock = pvstock < 0 ? 0 : pvstock;
        stock+=parseInt(resultStock);
      }
      if (stock === 0) {
        details += 'Producto sin stock | ';
      }
    }

    await Product.updateOne({id: product.id}).set({
      details: details,
      active: details ? false : true
    });

    return exits.success(details ? false : true);
  }
};
