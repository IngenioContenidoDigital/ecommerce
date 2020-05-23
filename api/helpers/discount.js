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
    /*let discount = await Product.findOne({id:id}).populate('discount',
    {
      where:{
        to:{'>=':moment().valueOf()},
        from:{'<=':moment().valueOf()}
      },
      limit:1,
      sort: 'createdAt ASC'});*/

    let discount = await CatalogDiscount.findOne({
      where:{
        to:{'>=':moment().valueOf()},
        from:{'<=':moment().valueOf()},
      },
    }).populate('products',{id:id});
    let discPrice=0;
    let discAmount=0;
    let product = await Product.findOne({id:id}).populate('tax');
    if(discount!==undefined && discount.products.length>=1){
      switch(discount.type){
        case 'P':
          discPrice+=((product.price)-(product.price*(discount.value/100)))*(1+(product.tax.value/100));
          discAmount+=(product.price*(discount.value/100));
          break;
        case 'C':
          discPrice+=(product.price-discount.value)*(1+(product.tax.value/100));
          discAmount+=discount.value;
          break;
      }
      discount.price=discPrice;
      discount.amount=discAmount;
      return exits.success(discount);
    }else{
      return exits.success();
    }
  }


};

