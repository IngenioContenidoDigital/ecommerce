module.exports = {
  friendlyName: 'Dashboard inventory',
  description: 'Estadistica del dashboard pestaña inventario',
  inputs: {
    profile: {
      type:'string',
      required: true,
    },
    seller: {
      type:'string',
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
    let data = {};

    if(inputs.profile !== 'superadmin' && inputs.profile !== 'admin'){
      const productsSeller = await Product.find({
        where: {
          seller: inputs.seller
        },
        select: ['name', 'reference', 'active']
      }).populate('images');
      totalProductsReference = await Product.count({seller: inputs.seller});
      totalProductsReferenceActive = await Product.count({seller: inputs.seller, active: true});
      totalProductsReferenceInactive = await Product.count({seller: inputs.seller, active: false});
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
      data = {
        totalProductsReference,
        totalProductsReferenceActive,
        totalProductsReferenceInactive,
        totalInventory: dataVariations.totalInventory,
        productsInventory: dataVariations.productsInventory,
        productsUnd: dataVariations.productsUnd
      };
    } else {
      const productsSeller = await Product.find({
        where: {},
        select: ['name', 'reference', 'active']
      }).populate('images');
      totalProductsReference = await Product.count({});
      totalProductsReferenceActive = await Product.count({active: true});
      totalProductsReferenceInactive = await Product.count({active: false});
      const dataVariations = await productsSeller.reduce(async (acc, product) => {
        const totalCant = await ProductVariation.sum('quantity').where({product: product.id});
        acc = await acc;
        acc.totalInventory = acc.totalInventory + totalCant;
        return acc;
      }, {
        totalInventory: 0
      });
      data = {
        totalProductsReference,
        totalProductsReferenceActive,
        totalProductsReferenceInactive,
        totalInventory: dataVariations.totalInventory
      };
    }

    return exits.success(data);
  }
};
