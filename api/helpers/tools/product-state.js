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
    },
    sellerstatus:{
      type:'boolean',
      required:true
    },
    sync:{
      type:'boolean',
      defaultsTo:false
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
    if(!inputs.sellerstatus){inputs.status = false;}
    if(inputs.status && images>0 && stock>0){
      updated = await Product.updateOne({ id: inputs.product }).set({ active: inputs.status });
    }else{
      updated = await Product.updateOne({ id: inputs.product }).set({ active: false });
    }
    if(inputs.sync){
      await sails.helpers.channel.channelSync(updated);
    }
  }
};

