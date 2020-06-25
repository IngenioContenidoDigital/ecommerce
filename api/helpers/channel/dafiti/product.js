module.exports = {
  friendlyName: 'Product',
  description: 'Product dafiti.',
  inputs: {
    product:{
      type:'string',
      required:true,
    },
    action:{
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


    let status='active';
    if(!product.dafitistatus){status='inactive';}

    let imagebody={
      Request:[]
    };
    let images = await ProductImage.find({product:product.id});
    let ilist = {
      Images:[]
    };

    for(let i of images){
      ilist.Images.push({Image:await sails.config.views.locals.imgurl+'/images/products/'+product.id+'/'+i.file});
    }

    let productvariation = await ProductVariation.find({product:inputs.product})
    .populate('variation');
    let parent = productvariation[0].id;
    let categories = [];
    for (let c of product.categories){
      let cd = c.dafiti.split(',');
      for(let dd of cd){
        if(!categories.includes(dd)){
          categories.push(dd);
        }
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
          Status:status,
          Name:product.name,
          PrimaryCategory:product.mainCategory.dafiti.split(',')[0],
          Categories:categories,
          Description: jsonxml.cdata(product.descriptionShort+' '+product.description),
          Brand:product.manufacturer.name,
          Condition:'new',
          Variation:pv.variation.col.replace(/\.5/,'½').toString(),
          Price:(pv.price*(1+product.dafitiprice)).toFixed(2),
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

      let img = {
        ProductImage:{
          SellerSku:pv.id,
          Images:ilist.Images
        }
      };

      imagebody.Request.push(img);
    }

    var xml = jsonxml(body,true);
    let sign = await sails.helpers.channel.dafiti.sign(inputs.action,product.seller);
    await sails.helpers.request('https://sellercenter-api.dafiti.com.co','/?'+sign,'POST',xml)
    .then(async (response)=>{
      setTimeout(() => {console.log(response);}, 2500);
      let xmlimages = jsonxml(imagebody,true);
      let signimg = await sails.helpers.channel.dafiti.sign('Image',product.seller);
      await sails.helpers.request('https://sellercenter-api.dafiti.com.co','/?'+signimg,'POST',xmlimages);
    });

    return exits.success();

  }
};

