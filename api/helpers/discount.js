module.exports = {
  friendlyName: 'Discount',
  description: 'Localiza los descuentos activos de un producto',
  inputs: {
    id:{
      type:'string',
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
        to:{'>=':moment().valueOf()},
        from:{'<=':moment().valueOf()}
      },
      limit:1,
      sort: 'createdAt ASC'});
    let discPrice=0;
    let discAmount=0;
    let product = await Product.findOne({id:id}).populate('tax');
    if(discount.discount.length>=1){
      switch(discount.discount[0].type){
        case 'P':
          discPrice+=((product.price)-(product.price*(discount.discount[0].value/100)))*(1+(product.tax.value/100));
          discAmount+=(product.price*(discount.discount[0].value/100));
          break;
        case 'C':
          discPrice+=(product.price-discount.discount[0].value)*(1+(product.tax.value/100));
          discAmount+=discount.discount[0].value;
          break;
      }
      discount.discount[0].price=discPrice;
      discount.discount[0].amount=discAmount;
      return exits.success(discount.discount[0]);
    }else{
      return exits.success();
    }
  }


};

