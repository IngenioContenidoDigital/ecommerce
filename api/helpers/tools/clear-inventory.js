module.exports = {
  friendlyName: 'Clear inventory',
  description: 'Sets zero inventory for a specific seller',
  inputs: {
    seller:{
      type:'string'
    }
  },
  exits: {
    success: {
      description: 'All done.',
    },
  },
  fn: async function (inputs,exits) {
    try{
      let products = await Product.find({seller:inputs.seller}).populate('variations');
      let vr = [];
      for(let pv in products.variations){
        if(!vr.includes(pv.id)){
          vr.push(pv.id);
        }
      }
      let updated = await ProductVariation.update({id:vr}).set({quantity:0}).fetch();
      return exits.success(updated.length);
    }catch(err){
      return exits.error(err);
    }
  }

};

