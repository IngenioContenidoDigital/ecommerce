module.exports = {
  friendlyName: 'Orders Today',
  description: 'Helper usado para retonar cuantas ordenes se hicieron en un dia',
  inputs: {
    profile: {
      type:'string',
      required: true,
    },
    seller: {
      type:'string',
    },
    date: {
      type: 'number',
      required: true,
    },
    dateEnd: {
      type: 'number',
      required: true,
    },
  },
  exits: {
    success: {
      description: 'All done.',
    },
  },
  fn: async function (inputs, exits) {
    let totalOrders = 0;
    let totalPrice = 0;
    if(inputs.profile !== 'superadmin' && inputs.profile !== 'admin'){
      totalOrders  =  await Order.count({
        seller: inputs.seller,
        createdAt: {
          '>=': inputs.date,
          '<': inputs.dateEnd
        }
      });
      totalPrice = await Order.sum('totalOrder').where({
        seller: inputs.seller,
        createdAt: {
          '>=': inputs.date,
          '<': inputs.dateEnd
        }
      });
    } else {
      totalOrders  =  await Order.count({
        createdAt: {
          '>=': inputs.date,
          '<': inputs.dateEnd
        }
      });
      totalPrice = await Order.sum('totalOrder').where({
        createdAt: {
          '>=': inputs.date,
          '<': inputs.dateEnd
        }
      });
    }

    return exits.success({
      totalOrders,
      totalPrice: totalPrice.toFixed(2)
    });
  }
};
