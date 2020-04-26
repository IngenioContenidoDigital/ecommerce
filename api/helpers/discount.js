module.exports = {
  friendlyName: 'Discount',
  description: 'Localiza los descuentos activos de un producto',
  inputs: {
    id:{
      type:'number',
      required:true,
    }
  },
  exits: {
    success: {
      description: 'All done.',
    },
  },
  fn: async function (inputs, exits) {
    let id = inputs.id;
    let moment = require('moment');
    let discount = await Product.findOne({id:id}).populate('discount',
    {
      where:{
        to:{'>=':moment.utc().valueOf()}
      },
      limit:1,
      sort: 'createdAt ASC'});
    return exits.success(discount.discount[0]);
  }


};

