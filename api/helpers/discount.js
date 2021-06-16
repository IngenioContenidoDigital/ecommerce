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
    .populate('discount',
    {
      where:{
        to:{'>=':moment().valueOf()},
        from:{'<=':moment().valueOf()}
      },
      select:['type','value','from','to'],
      sort: 'createdAt DESC',
      limit: 1
    });

    let discPrice=0;
    let discAmount=0;
    if(product.discount.length>0){
      switch(product.discount[0].type){
        case 'P':
          discPrice+=((product.variations[0].price)-(product.variations[0].price*(product.discount[0].value/100)));
          discAmount+=(product.variations[0].price*(product.discount[0].value/100));
          break;
        case 'C':
          discPrice+=(product.variations[0].price)-product.discount[0].value;
          discAmount+=product.discount[0].value;
          break;
      }
      product.discount[0].price=discPrice;
      product.discount[0].amount=discAmount;
      return exits.success(product.discount[0]);
    }else{
      return exits.success();
    }
  }


};

