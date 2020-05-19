module.exports = {
  friendlyName: 'Product',
  description: 'Product dafiti.',
  inputs: {
    product:{
      type:'string',
      required:true,
    }
  },
  exits: {
    success: {
      description: 'All done.',
    },
  },
  fn: async function (inputs,exits) {
    var jsonxml = require('jsontoxml');
    let product = await Product.findOne({id:inputs.product})
    .populate('gender')
    .populate('mainColor')
    .populate('manufacturer')
    .populate('mainCategory')
    .populate('categories');

    let productvariation = await ProductVariation.find({product:inputs.product})
    .populate('variation');
    let parent = productvariation[0].id;
    let categories = [];
    for (let c of product.categories){
      if(!categories.includes(c.dafiti)){
        categories.push(c.dafiti);
      }
    }
    let body={
      Request:[]
    };
    let i = 0;
    for(let pv of productvariation){
      let data={
        Product:{
          SellerSku:pv.id,
          Status:'active',
          Name:product.name,
          PrimaryCategory:product.mainCategory.dafiti,
          Categories:categories,
          Description: jsonxml.cdata(product.descriptionShort+' '+product.description),
          Brand:product.manufacturer.name,
          Condition:'new',
          Variation:pv.variation.col.replace(/\.5/,'½').toString(),
          Price:pv.price.toFixed(2),
          /*SalePrice:,
          SaleStartDate:,
          SaleEndDate:,*/
          Quantity:pv.quantity,
          ProductData:{
            Gender:product.gender.name,
            ColorNameBrand:product.mainColor.name,
            ColorFamily:product.mainColor.name,
            Color:product.mainColor.name,
          }
        }
      };
      if(i>0){
        data.Product.ParentSku=parent;
      }
      body.Request.push(data);
      i++;
    }

    var xml = jsonxml(body,true);
    let sign = await sails.helpers.channel.dafiti.sign('ProductCreate',product.seller);
    let request = await sails.helpers.request('https://sellercenter-api.dafiti.com.co','/?'+sign,'POST',xml);
    console.log(request);

    return exits.success(request);

  }
};

