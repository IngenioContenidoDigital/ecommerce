module.exports = {
  friendlyName: 'Discount',
  description: 'Localiza los descuentos activos de un producto',
  inputs: {
    productid:{
      type:'string',
      required:true,
    },
    productvariation:{
      type:'string'
    }
  },
  exits: {
    success: {
      description: 'All done.',
    },
  },
  fn: async function (inputs, exits) {
    let moment = require('moment');
    let filter = {};
    if(inputs.productvariation){filter.id = inputs.productvariation;}
    let product = await Product.findOne({id:inputs.productid})
    .populate('tax')
    .populate('variations',filter)
    .populate('discount',{
      where:{
        to:{'>=':moment().valueOf()},
        from:{'<=':moment().valueOf()}
      },
      select:['type','value','from','to'],
      sort: 'createdAt DESC'
    });
    if(product.discount.length>0){
      for(let discount of product.discount){
        let discPrice=0;
        let discAmount=0;
        let cd = await CatalogDiscount.findOne({id:discount.id}).populate('integrations');
        discount.integrations= cd.integrations;
        switch(discount.type){
          case 'P':
            discPrice+=((product.variations[0].price)-(product.variations[0].price*(discount.value/100)));
            discAmount+=(product.variations[0].price*(discount.value/100));
            break;
          case 'C':
            discPrice+=(product.variations[0].price)-discount.value;
            discAmount+=discount.value;
            break;
        }
        discount.price=discPrice;
        discount.amount=discAmount;
      }
      return exits.success(product.discount);
    }else{
      return exits.success();
    }
  }
};

