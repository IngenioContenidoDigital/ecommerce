module.exports = {
  friendlyName: 'Product state',
  description: 'Validates product active / inactive status',
  inputs: {
    product:{
      type:'string',
      required:true
    },
    status:{
      type:'boolean',
      required:true
    }
  },
  exits: {
    success: {
      description: 'All done.',
    },
  },
  fn: async function (inputs) {
    let images = await ProductImage.count({product:inputs.product});
    let stock = await ProductVariation.sum('quantity', {product:inputs.product});
    let updated=null;
    if(inputs.status && images>0 && stock>0){
      updated = await Product.updateOne({ id: inputs.product }).set({ active: inputs.status });
    }else{
      updated = await Product.updateOne({ id: inputs.product }).set({ active: false });
    }
    await sails.helpers.channel.channelSync(updated);
  }
};

