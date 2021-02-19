module.exports = {
  friendlyName: 'Price Walmart',
  description: 'Price Walmart.',
  inputs: {
    channel:{
      type:'ref',
      required:true,
    },
    sku:{
      type:'string',
      required:true
    }
  },
  exits: {
    success: {
      description: 'All done.',
    },
  },
  fn: async function (inputs,exits) {
    
    let moment = require('moment');

    let padj = inputs.channel.price;
    let price;
    try{
      let product = await Product.findOne({id: inputs.channel.product})
      .populate('discount',{
        where:{
          to:{'>=':moment().valueOf()},
          from:{'<=':moment().valueOf()}
        },
        sort: 'createdAt DESC',
        limit: 1
      });
      
      let seller = await Seller.findOne({id:product.seller}).populate('mainAddress');
      let exchange_rate = await sails.helpers.currencyConverter('COP', 'MXN');

      let productvariation = await ProductVariation.findOne({id:inputs.sku});

      if(product.discount.length>0){
        let discPrice=0;
        switch(product.discount[0].type){
          case 'P':
            discPrice+=((productvariation.price*(1+padj))*(1-(product.discount[0].value/100)));
            break;
          case 'C':
            discPrice+=((productvariation.price*(1+padj))-product.discount[0].value);
            break;
        }
        price = discPrice;
      }else{
        price = (Math.ceil((productvariation.price*(1+padj))*100)/100).toFixed(2);
      }
      if(seller.mainAddress.country==='5eeb7a88cc42a6289844ec83'){
        price = price*exchange_rate.result;
      }
      productvariation.price = price;

      return exits.success(productvariation);

    }catch(err){
      console.log(err);
    }
  }
};