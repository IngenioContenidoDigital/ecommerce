module.exports = {
  friendlyName: 'Product',
  description: 'Product dafiti.',
  inputs: {
    products:{
      type:'ref',
      required:true,
    },
    integration:{
      type:'ref',
      required:true
    },
    dafitiprice:{
      type:'number',
      defaultsTo:0
    },
    status:{
      type:'string',
      defaultsTo:'active'
    },
    alldata:{
      type:'boolean',
      defaultsTo:true
    }
  },
  exits: {
    success: {
      description: 'All done.',
    },
  },
  fn: async function (inputs,exits) {
    let moment = require('moment');
    var jsonxml = require('jsontoxml');
    let body={Request:[]};
    let pvstock = 0;
    let textClean = async (text) =>{
      text = text.replace(/\n/g, ' ');
      //text = text.replace(/[^\x00-\x7F]/g, '');
      text=text.replace(/&(nbsp|amp|quot|lt|gt|bull|middot);/g,' '); //Caracteres HTML
      text=text.replace(/([^\u0009\u000a\u000d\u0020-\uD7FF\uE000-\uFFFD]|\u2022)/ig,'');
      text=text.replace( /(<([^>]+)>)/ig, ''); // Etiquetas HTML
      text=text.replace(/&/g,'y'); //Caracteres Especiales
      text=text.replace(/[\/\\#,+()$~%.'":*?<>{} ]/g,''); //Caracteres Especiales
      text=text.trim(); //Espacios Extra
      let result = JSON.stringify(text);
      return result.replace(/['"]+/g, '');
    };

    for(let p of inputs.products){
      if(await ProductVariation.count({product:p.id})>0){
        try{
          let product = await Product.findOne({id:p.id})
              .populate('gender')
              .populate('mainColor')
              .populate('manufacturer')
              .populate('mainCategory')
              .populate('tax')
              .populate('seller')
              .populate('categories',{level:{'>=':4}})
              .populate('discount',{
                where:{
                  to:{'>=':moment().valueOf()},
                  from:{'<=':moment().valueOf()}
                },
                sort: 'createdAt DESC'
              })
              .populate('channels',{integration:inputs.integration.id});
          let priceadjust = (inputs.dafitiprice && inputs.dafitiprice > 0) ? parseFloat(inputs.dafitiprice) : 0;
          let priceDiscount = inputs.integration.priceDiscount || 0;
          let status= inputs.status ? inputs.status : 'active';
          let productvariation = await ProductVariation.find({product:product.id})
              .populate('variation');
          let parent = productvariation.length > 0 ? productvariation[0].id : '';
          let categories = [];
          let brand = null;
          if(inputs.alldata){
            if((product.description.length + product.descriptionShort.length)<=30){throw new Error('Producto sin Descripcion');}
            for (let c of product.categories){
              let cd = c.dafiti.split(',');
              for(let dd of cd){
                if(!categories.includes(dd) && dd!== '' && dd!==null){
                  categories.push(dd);
                }
              }
            }

            switch(product.manufacturer.name){
              case 'adidas':
                brand = 'Adidas Performance';
                break;
              case 'rosé pistol':
                brand = 'rose pistol';
                break;
              case '7 de color siete':
                brand = 'color siete';
                break;
              case 'color siete care':
                brand = 'color siete';
                break;
              case 'ondademar colombia':
                brand = 'ondademar';
                break;
              case 'l\'occitane colombia':
                brand = 'L\'Occitane';
                break;
              case 'l\'occitane':
                brand = 'L\'Occitane';
                break;
              default:
                brand = product.manufacturer.name;
                break;
            }
          }
          let i = 0;
          for(let pv of productvariation){

            pvstock = (pv.quantity-product.seller.safestock);

            let data={
              Product:{
                SellerSku:pv.id,
                Status:status,
                Quantity:pvstock < 0 ? '0' : pvstock.toString(),
              }
            };

            let pvprice = (Math.ceil((pv.price*(1+priceadjust))*100)/100).toFixed(0);
            if(pvprice>0){
              data.Product.Price = pvprice;
            }else{
              throw new Error('Variacion sin precio');
            }

            if(inputs.alldata){

              data.Product.Name= await textClean(product.name.toUpperCase());
              if(product.mainCategory.dafiti.split(',')[0]){data.Product.PrimaryCategory = product.mainCategory.dafiti.split(',')[0];}else{throw new Error('Categoria no homologada en Dafiti');}
              data.Product.Description= jsonxml.cdata(await textClean(product.description));
              data.Product.Brand=brand;
              data.Product.Condition='new';
              data.Product.Variation = pv.variation.col ? (pv.variation.col.replace(/\.5/,'½').toString() === 'U' || pv.variation.col.replace(/\.5/,'½').toString() === 'Único' || pv.variation.col.replace(/\.5/,'½').toString() === 'único' || pv.variation.col.replace(/\.5/,'½').toString() === 'Única' || pv.variation.col.replace(/\.5/,'½').toString() === 'única') ? 'Talla Única' : pv.variation.col.replace(/\.5/,'½').toString() : (pv.variation.name.toString() === 'Único' || pv.variation.name.toString() === 'único' || pv.variation.name.toString() === 'Única' || pv.variation.name.toString() === 'única' || pv.variation.col.replace(/\.5/,'½').toString() === 'U') ? 'Talla Única' : pv.variation.name;
              data.Product.ProductData = {};

              if(product.gender && product.gender.name){
                switch(product.gender.name){
                  case 'niños':
                    data.Product.ProductData.Gender='Niños (8 - 16 Años)';
                    break;
                  case 'niñas':
                    data.Product.ProductData.Gender='Niñas (8 - 16 Años)';
                    break;
                  case 'bebés niña':
                    data.Product.ProductData.Gender='Bebés Niña (2 - 7 Años)';
                    break;
                  case 'bebés niño':
                    data.Product.ProductData.Gender='Bebés Niño (2 - 7 Años)';
                    break;
                  case 'recién nacido':
                    data.Product.ProductData.Gender='Recién Nacido (0 - 24 meses)';
                    break;
                  case 'recién nacida':
                    data.Product.ProductData.Gender='Recién Nacida (0 - 24 meses)';
                    break;
                  default:
                    data.Product.ProductData.Gender=product.gender.name;
                    break;
                }
              }

              if(product.mainColor && product.mainColor.name){
                data.Product.ProductData.ColorNameBrand=product.mainColor.name;
                data.Product.ProductData.ColorFamily=product.mainColor.name;
                data.Product.ProductData.Color=product.mainColor.name;
              }

              if (product.activity) {
                data.Product.ProductData.Activity=product.activity;
              }

              //if(categories.length<2){delete data.Product.Categories;}
              if(categories.includes('2')/** Accesorios */ || categories.includes('138')/** Deportes */){delete data.Product.ProductData.ShortDescription;}
              if(i>0 && productvariation.length>1){
                data.Product.ParentSku=parent;
              }

              let productfeatures = await ProductFeature.find({product:p.id,value:{'!=':''}});
              if(productfeatures.length>0){
                for(let fc of productfeatures){
                  if(fc.value){
                    let channelfeatures = await FeatureChannel.find({channel:inputs.integration.channel.id,feature:fc.feature});
                    for(let cf of channelfeatures){
                      data.Product.ProductData[cf.name] = fc.value.toLowerCase();
                    }
                  }
                }
              }
            }

            i++;
            data.Product.SalePrice=null;
            data.Product.SaleStartDate=null;
            data.Product.SaleEndDate=null;
            if(product.discount.length>0){
              let discountids = product.discount.map(d => d.id);
              let allowedDiscount = await CatalogDiscount.find({id:discountids}).populate('integrations',{id:inputs.integration.id});
              allowedDiscount = allowedDiscount.filter(ad =>{ if(ad.integrations && ad.integrations.length > 0){return ad;}});
              if(allowedDiscount.length>0){
                let discPrice=0;
                let valueDisc=0;
                switch(allowedDiscount[allowedDiscount.length-1].type){
                  case 'P':
                    const productDisc = allowedDiscount[allowedDiscount.length-1].value/100;
                    valueDisc = productDisc - priceDiscount;
                    discPrice+=((pv.price*(1+priceadjust || 0))*(valueDisc > 0 ? (1-valueDisc) : 0));
                    break;
                  case 'C':
                    valueDisc = allowedDiscount[allowedDiscount.length-1].value - (pv.price*priceDiscount);
                    discPrice+= valueDisc > 0 ? ((pv.price*(1+priceadjust || 0)) - valueDisc) : 0;
                    break;
                }
                data.Product.SalePrice= discPrice.toFixed(2) > 0 ? discPrice.toFixed(2) : null;
                data.Product.SaleStartDate= discPrice.toFixed(2) > 0 ? moment(allowedDiscount[allowedDiscount.length-1].from).format() : null;
                data.Product.SaleEndDate= discPrice.toFixed(2) > 0 ? moment(allowedDiscount[allowedDiscount.length-1].to).format() : null;
              }
            }
            body.Request.push(data);
          }
        }catch(err){
          console.log(err.message);
        }
      }
    }
    return exits.success(body);
  }
};

