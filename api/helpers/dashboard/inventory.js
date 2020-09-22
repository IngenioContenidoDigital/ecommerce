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
    },
    dateStart: {
      type: 'number',
      required: true,
    },
    dateEnd: {
      type:'number',
      required: true,
    },
  },
  exits: {
    success: {
      description: 'All done.',
    },
  },
  fn: async function (inputs, exits) {
    let productsSeller = [];

    if(inputs.profile !== 'superadmin' && inputs.profile !== 'admin'){
      productsSeller = await Product.find({
        where: {
          createdAt: { '>': inputs.dateStart, '<': inputs.dateEnd },
          seller: inputs.seller
        },
        select: ['name', 'reference', 'active']
      }).populate('images');
    } else {
      productsSeller = await Product.find({
        where: {createdAt: { '>': inputs.dateStart, '<': inputs.dateEnd }},
        select: ['name', 'reference', 'active']
      }).populate('images');
    }
    const data = await productsSeller.reduce(async (acc, product) => {
      const totalCant = await ProductVariation.sum('quantity').where({product: product.id});
      acc = await acc;
      if(inputs.profile !== 'superadmin' && inputs.profile !== 'admin'){
        if (totalCant > 0 && totalCant < 5) {
          acc.productsUnd.push(product);
        }
        if (totalCant === 0) {
          acc.productsInventory.push(product);
        }
      }
      if (product.active) {
        acc.totalProductsReferenceActive = acc.totalProductsReferenceActive + 1;
      } else {
        acc.totalProductsReferenceInactive = acc.totalProductsReferenceInactive + 1;
      }
      acc.totalInventory = acc.totalInventory + totalCant;
      acc.totalProductsReference = acc.totalProductsReference + 1;
      return acc;
    }, {
      totalInventory: 0,
      totalProductsReference: 0,
      totalProductsReferenceInactive: 0,
      totalProductsReferenceActive: 0,
      productsInventory: [],
      productsUnd: []
    });

    return exits.success(data);
  }
};
