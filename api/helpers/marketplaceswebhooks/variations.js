module.exports = {
  friendlyName: 'Create variations product',
  description: 'Proceso para crear las variaciones de un producto webhook',
  inputs: {
    productVariation: {type: 'json'},
    productRef: {type : 'string'},
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
    let moment = require('moment');
    let seller = inputs.seller;
    let productRef = inputs.productRef;
    let productVariation = inputs.productVariation;
    let pro = await Product.findOne({reference: productRef.toUpperCase(), seller: seller}).populate('categories', {level:2 });
    if(pro){
      if (productVariation.discount && productVariation.discount.length > 0) {
        let disc = await CatalogDiscount.find({
          where:{
            to:{'>=':moment().valueOf()},
            from:{'<=':moment().valueOf()},
            value: productVariation.discount[0].value,
            type: productVariation.discount[0].type
          },
          sort: 'createdAt DESC',
          limit: 1
        });
        if (disc.length > 0) {
          await CatalogDiscount.updateOne({ id: disc[0].id }).set({
            from: moment(new Date(productVariation.discount[0].from) ).valueOf(),
            to: moment(new Date(productVariation.discount[0].to)).valueOf()
          });
        } else {
          let discount = await CatalogDiscount.create({
            name: productVariation.discount[0].name.trim().toLowerCase(),
            from: moment(new Date(productVariation.discount[0].from)).valueOf(),
            to: moment(new Date(productVariation.discount[0].to)).valueOf(),
            type: productVariation.discount[0].type,
            value: parseFloat(productVariation.discount[0].value),
            seller: pro.seller
          }).fetch();
          await CatalogDiscount.addToCollection(discount.id,'products').members([pro.id]);
        }
      }
      try {
        if(pro.categories[0] && productVariation.variations && productVariation.variations.length > 0){
          for(let vr of productVariation.variations){
            let variation = await Variation.find({name: vr.talla.toLowerCase().replace(',','.'), gender: pro.gender, category: pro.categories[0].id});
            let discountHandled = false;

            if(!variation || variation.length == 0){
              variation = await Variation.create({name: vr.talla.toLowerCase().replace(',','.'), gender: pro.gender, category: pro.categories[0].id}).fetch();
            }
            let pvs = await ProductVariation.find({product: pro.id, supplierreference: pro.reference}).populate('variation');
            let pv = pvs.find(pv=> pv.variation.name === variation[0].name);
            if (!pv) {
              await ProductVariation.create({
                product: pro.id,
                variation: variation[0].id,
                reference: vr.reference ? vr.reference : '',
                supplierreference: pro.reference,
                ean13: vr.ean13 ? vr.ean13.toString() : '',
                upc: vr.upc ? vr.upc : 0,
                price: vr.price,
                quantity: vr.quantity ? vr.quantity : 0,
                seller: pro.seller
              }).fetch();
            } else {
              await ProductVariation.updateOne({ id: pv.id }).set({
                price: vr.price,
                variation: variation[0].id,
                quantity: vr.quantity ? vr.quantity : 0,
              });
            }
            if(!discountHandled){
              if (vr.discount && vr.discount.length > 0) {
                let disc = await CatalogDiscount.find({
                  where:{
                    to:{'>=':moment().valueOf()},
                    from:{'<=':moment().valueOf()},
                    value: vr.discount[0].value,
                    type: vr.discount[0].type
                  },
                  sort: 'createdAt DESC',
                  limit: 1
                });
                if (disc.length > 0) {
                  await CatalogDiscount.updateOne({ id: disc[0].id }).set({
                    from: moment(new Date( vr.discount[0].from)).valueOf(),
                    to: moment(new Date(vr.discount[0].to)).valueOf()
                  });
                } else {
                  let discount = await CatalogDiscount.create({
                    name: (vr.discount && vr.discount[0].name) ? vr.discount[0].name.trim().toLowerCase() : pro.name,
                    from: moment(new Date(vr.discount[0].from)).valueOf(),
                    to: moment(new Date(vr.discount[0].to)).valueOf(),
                    type: vr.discount[0].type,
                    value: parseFloat(vr.discount[0].value),
                    seller: pro.seller
                  }).fetch();
                  await CatalogDiscount.addToCollection(discount.id,'products').members([pro.id]);
                }
              }
            }
          }
        }
      } catch (e) {
        console.log(e);
      }
    }
    return exits.success(true);
  }
};

