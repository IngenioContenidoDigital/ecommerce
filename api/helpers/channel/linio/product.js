module.exports = {
  friendlyName: 'Product',
  description: 'Product linio.',
  inputs: {
    product: {
      type: 'string',
      required: true,
    },
    action: {
      type: 'string',
      required: true,
    },
    pricelinio: {
      type: 'number',
      defaultsTo: 0
    }
  },
  exits: {
    success: {
      description: 'All done.',
    },
  },
  fn: async function (inputs, exits) {
    var jsonxml = require('jsontoxml');
    let moment = require('moment');
    let product = await Product.findOne({id: inputs.product})
    .populate('gender')
    .populate('mainColor')
    .populate('manufacturer')
    .populate('mainCategory')
    .populate('categories')
    .populate('tax')
    .populate('discount',{
      where:{
        to:{'>=':moment().valueOf()},
        from:{'<=':moment().valueOf()}
      },
      sort: 'createdAt DESC',
      limit: 1
    });
    let status = 'active';
    if(product.liniostatus){status='inactive';}

    let imagebody={
      Request:[]
    };
    let images = await ProductImage.find({product: product.id}).sort('position ASC');
    let ilist = {
      Images:[]
    };

    for(let i of images){
      ilist.Images.push({Image: await sails.config.views.locals.imgurl+'/images/products/'+product.id+'/'+i.file});
    }

    let productvariation = await ProductVariation.find({product: inputs.product})
    .populate('variation');

    let parent = productvariation[0].id;
    let categories = product.mainCategory.linio.split(',');
    categories.shift();

    let body={
      Request:[]
    };
    let i = 0;
    for(let pv of productvariation){
      let data = {
        Product: {
          SellerSku: pv.id,
          ProductId: pv.ean13,
          Status: status,
          Name: product.name,
          Variation: pv.variation.col.replace(/\.5/,'').toString(),
          PrimaryCategory: product.mainCategory.linio.split(',')[0],
          Categories: categories.join(','),
          Description: jsonxml.cdata(product.descriptionShort + ' ' + product.description),
          Brand: product.manufacturer.name,
          Price: (pv.price*(1+inputs.pricelinio)).toFixed(2),
          Quantity: pv.quantity,
          TaxClass: product.tax.value === 19 ? 'IVA 19%' : 'IVA excluido 0%',
          ProductData: {
            Gender: product.gender.name === 'masculino' ? 'hombre' : product.gender.name === 'femenino' ? 'mujer' : product.gender.name,
            ShortDescription: jsonxml.cdata(product.descriptionShort),
            PackageHeight: product.height,
            PackageLength: product.length,
            PackageWidth: product.width,
            PackageWeight: product.weight,
            ConditionType: 'Nuevo'
          }
        }
      };

      if(i > 0 && productvariation.length > 1){
        data.Product.ParentSku = parent;
      }

      if(product.discount.length > 0){
        let discPrice = 0;
        switch(product.discount[0].type){
          case 'P':
            discPrice+=((pv.price*(1+inputs.pricelinio))*(1-(product.discount[0].value/100)));
            break;
          case 'C':
            discPrice+=((pv.price*(1+inputs.pricelinio))-product.discount[0].value);
            break;
        }
        data.Product.SalePrice = discPrice.toFixed(2);
        data.Product.SaleStartDate = moment(product.discount[0].from).format();
        data.Product.SaleEndDate = moment(product.discount[0].to).format();
      }

      body.Request.push(data);
      i++;
      let img = {
        ProductImage:{
          SellerSku: pv.id,
          Images: ilist.Images
        }
      };

      imagebody.Request.push(img);
    }
    var xml = jsonxml(body, true);
    let sign = await sails.helpers.channel.linio.sign(inputs.action, product.seller);
    await sails.helpers.request('https://sellercenter-api.linio.com.co', '/?' + sign, 'POST' , xml)
    .then(async (response)=>{
      let result = JSON.parse(response);
      console.log(response);
      if(result.SuccessResponse.Head.RequestId !== undefined && result.SuccessResponse.Head.RequestId !== null && result.SuccessResponse.Head.RequestId !== ''){
        let xmlimages = jsonxml(imagebody, true);
        setTimeout(async () => {
          let signimg = await sails.helpers.channel.linio.sign('Image', product.seller);
          await sails.helpers.request('https://sellercenter-api.linio.com.co', '/?' + signimg, 'POST', xmlimages);
        }, 4000);
        return exits.success(response);
      }else{
        return exits.error(response);
      }
    });
  }
};

