module.exports = {
  friendlyName: 'Inactive Account',
  description: 'Para inactivar cuentas y productos',
  inputs: {
    seller:{
      type:'ref',
      required: true
    }
  },
  exits: {
    success: {
      description: 'All done.',
    },
  },
  fn: async function (inputs, exits) {
    const user = await User.findOne({seller: inputs.seller.id, emailAddress: inputs.seller.email});
    await User.updateOne({id: user.id}).set({active: false});
    await Seller.updateOne({id: inputs.seller.id}).set({active: false});
    await Product.update({seller: inputs.seller.id}).set({active: false});
    return exits.success();
  }
};
