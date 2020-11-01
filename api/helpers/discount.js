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
    let product = await Product.findOne({id:id})
    .populate('tax')
    .populate('discount',
    {
      where:{
        to:{'>=':moment().valueOf()},
        from:{'<=':moment().valueOf()}
      },
      sort: 'createdAt DESC'});

    let discPrice=0;
    let discAmount=0;
    if(product.discount.length>0){
      switch(product.discount[0].type){
        case 'P':
          discPrice+=((product.price)-(product.price*(product.discount[0].value/100)))*(1+(product.tax.value/100));
          discAmount+=(product.price*(product.discount[0].value/100));
          break;
        case 'C':
          discPrice+=(product.price*(1+(product.tax.value/100)))-product.discount[0].value;
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

