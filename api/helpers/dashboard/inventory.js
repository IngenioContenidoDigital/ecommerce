module.exports = {
  friendlyName: 'Dashboard inventory',
  description: 'Estadistica del dashboard pestaña inventario',
  inputs: {
    seller: {
      type:'string',
    },
    sid: {
      type:'string'
    }
  },
  exits: {
    success: {
      description: 'All done.',
    },
  },
  fn: async function (inputs, exits) {
    let totalProductsReference = 0;
    let totalProductsReferenceInactive = 0;
    let totalProductsReferenceActive = 0;

    totalProductsReference = await Product.count({seller: inputs.seller});
    let pages = Math.ceil(totalProductsReference / 200);
    totalProductsReferenceActive = await Product.count({seller: inputs.seller, active: true});
    totalProductsReferenceInactive = await Product.count({seller: inputs.seller, active: false});

    for (let i = 1; i <= pages; i++) {
      const stop = i === pages ? true : false;
      const productsSeller = await Product.find({
        where: {
          seller: inputs.seller
        },
        skip: ((i - 1) * 200),
        limit: 200,
        select: ['name', 'reference', 'active']
      }).populate('images');
      const dataVariations = await productsSeller.reduce(async (acc, product) => {
        const totalCant = await ProductVariation.sum('quantity').where({product: product.id});
        acc = await acc;
        if (totalCant > 0 && totalCant < 5) {
          acc.productsUnd.push(product);
        }
        if (totalCant === 0) {
          acc.productsInventory.push(product);
        }
        acc.totalInventory = acc.totalInventory + totalCant;
        return acc;
      }, {
        totalInventory: 0,
        productsInventory: [],
        productsUnd: []
      });

      sails.sockets.broadcast(inputs.sid, 'datadashboardinventory', {
        totalInventory: dataVariations.totalInventory,
        totalProductsReference: totalProductsReference,
        totalProductsReferenceInactive: totalProductsReferenceInactive,
        totalProductsReferenceActive: totalProductsReferenceActive,
        productsInventory: dataVariations.productsInventory,
        productsUnd: dataVariations.productsUnd,
        stop
      });
    }
    return exits.success();
  }
};
