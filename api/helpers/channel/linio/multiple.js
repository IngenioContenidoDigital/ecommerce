module.exports = {
  friendlyName: 'Multiple',
  description: 'Multiple linio.',
  inputs: {
    seller:{
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
  fn: async function (inputs, exits) {
    var jsonxml = require('jsontoxml');
    let moment = require('moment');
    let status = 'active';
    let linio = false;
    let body = {Request:[]};
    let products = null;
    let paffected = [];
    let result = [];
    let productvariation = null;
    if(inputs.action==='ProductUpdate'){linio = true;}
    if(inputs.action==='ProductCreate' || inputs.action==='ProductUpdate'){
      products = await Product.find({
        where:{seller: inputs.seller, linio: linio, active: true},
        limit:600,
        sort: 'createdAt ASC'
      })
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
      if(products.length > 0){
        for(let product of products){
          productvariation = await ProductVariation.find({product: product.id})
          .populate('variation');

          if(productvariation.length > 0 && product.mainCategory.linio !== ''){
            let parent = productvariation[0].id;
            let categories = product.mainCategory.linio.split(',');
            categories.shift();
            let linioprice = product.linioprice || 0;
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
                  Price: (pv.price*(1+linioprice)).toFixed(2),
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
                    discPrice+=((pv.price*(1+linioprice))*(1-(product.discount[0].value/100)));
                    break;
                  case 'C':
                    discPrice+=((pv.price*(1+linioprice))-product.discount[0].value);
                    break;
                }
                data.Product.SalePrice = discPrice.toFixed(2);
                data.Product.SaleStartDate = moment(product.discount[0].from).format();
                data.Product.SaleEndDate = moment(product.discount[0].to).format();
              }
              i++;
              body.Request.push(data);
            }
          }
          if(!paffected.includes(product.id)){
            paffected.push(product.id);
          }
        }
      }
    }
    if(inputs.action === 'Image'){
      products = await Product.find({seller:inputs.seller,linio:true,liniostatus:false,active:true});
      if(products.length > 0){
        for(let product of products){
          //Imagenes
          let ilist = {Images:[]};
          let images = await ProductImage.find({product: product.id}).sort('position ASC');
          if(images.length > 0){
            for(let i of images){
              ilist.Images.push({Image: await sails.config.views.locals.imgurl+'/images/products/'+product.id+'/'+i.file});
            }
            let productvariation = await ProductVariation.find({product: product.id});
            if(productvariation.length > 0){
              for(let pv of productvariation){
                let img = {
                  ProductImage:{
                    SellerSku: pv.id,
                    Images: ilist.Images
                  }
                };
                body.Request.push(img);
              }
            }
          }
          if(!paffected.includes(product.id)){
            paffected.push(product.id);
          }
        }
      }
    }
    if(body.Request.length>0){
      try{
        var xml = jsonxml(body, true);
        let sign = await sails.helpers.channel.linio.sign(inputs.action, inputs.seller);
        let response = await sails.helpers.request('https://sellercenter-api.linio.com.co','/?'+ sign, 'POST', xml);
        result.Request = response;
        if(inputs.action === 'ProductCreate'){await Product.update({id: paffected}).set({linio: true, liniostatus: false});}
        if(inputs.action==='Image'){await Product.update({id:paffected}).set({linio:true,liniostatus:true});}
      }catch(err){
        result.Errors.push({REF:'ERR',ERR:err.message});
      }
    }else{
      result.Errors.push({REF:'NODATA',ERR:'No hay registros para procesar'});
    }
    return exits.success(result);
  }
};
