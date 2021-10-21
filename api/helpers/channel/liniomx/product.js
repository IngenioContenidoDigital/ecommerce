module.exports = {
  friendlyName: 'Product Linio',
  description: 'Product linio mexico.',
  inputs: {
    products:{
      type:'ref',
      required:true,
    },
    integration:{
      type:'ref',
      required:true
    },
    linioprice:{
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
    for(let p of inputs.products){
      try{
        if(await ProductVariation.count({product:p.id})>0){
          let product = await Product.findOne({id:p.id})
          .populate('gender')
          .populate('mainColor')
          .populate('manufacturer')
          .populate('mainCategory')
          .populate('seller')
          .populate('tax')
          .populate('categories')
          .populate('discount',{
            where:{
              to:{'>=':moment().valueOf()},
              from:{'<=':moment().valueOf()}
            },
            sort: 'createdAt DESC'
          })
          .populate('channels',{integration:inputs.integration.id});
          let priceadjust = (inputs.linioprice && inputs.linioprice > 0) ? parseFloat(inputs.linioprice) : 0;
          let status= inputs.status ? inputs.status : 'active';
          let priceDiscount = inputs.integration.priceDiscount || 0;
          let productvariation = await ProductVariation.find({product:product.id})
          .populate('variation');
          let parent = productvariation.length > 0 ? productvariation[0].id : '';
          let categories = [];
          if(inputs.alldata){
            for (let c of product.categories){
              let cd = c.liniomx.split(',');
              for(let dd of cd){
                if(!categories.includes(dd) && dd!=='' && dd!== null){
                  categories.push(dd);
                }
              }
            }
          }

          let i = 0;
          for(let pv of productvariation){

            pvstock = (pv.quantity-product.seller.safestock);

            let data = {
              Product: {
                SellerSku: pv.id,
                ProductId: pv.ean13,
                Status: status,
                Price: (Math.ceil((pv.price*(1+priceadjust))*100)/100).toFixed(0),
                Quantity: pvstock < 0 ? '0' : pvstock.toString(),
              }
            };

            if(inputs.alldata){
              data.Product.Name= product.name.toUpperCase();
              data.Product.Variation= (pv.variation.mx.toString() === 'Único' || pv.variation.mx.toString() === 'único' || pv.variation.mx.toString() === 'Única' || pv.variation.mx.toString() === 'única') ? 'Talla Única' : pv.variation.mx.toString();
              data.Product.PrimaryCategory= product.mainCategory.liniomx.split(',')[0];
              //data.Product.Categories= categories.join(',');
              data.Product.Description= jsonxml.cdata((product.description).replace(/(<[^>]+>|<[^>]>|<\/[^>]>)/gi,''));
              data.Product.Brand= product.manufacturer.linioname ? product.manufacturer.linioname : product.manufacturer.name;
              data.Product.TaxClass= product.tax && product.tax.value === 16 ? 'IVA 16%' : 'IVA 0%';
              data.Product.ProductData= {
                ShortDescription: jsonxml.cdata('<ul><li>Marca:'+product.manufacturer.name+'</li><li>Referencia:'+product.reference+'</li><li>Estado: Nuevo</li><li>Color:'+product.mainColor.name+'</li><li>Nombre:'+product.name+'</li></ul><br/>'+product.descriptionShort)/*.replace(/(<[^>]+>|<[^>]>|<\/[^>]>)/gi,''))*/,
                PackageHeight: product.height,
                PackageLength: product.length,
                PackageWidth: product.width,
                PackageWeight: product.weight,
                Gender: product.gender.name === 'masculino' ? 'hombre' : product.gender.name === 'femenino' ? 'mujer' : product.gender.name === 'niños' ? 'niño' : product.gender.name === 'niñas' ? 'niña' : product.gender.name,
                Color:product.mainColor.name,
                ConditionType: 'Nuevo',
              };
              //if(product.register!=='' && product.register!==null){data.Product.SanitaryRegistration = product.register;}
              //if(categories.length<2){delete data.Product.Categories;}
              if(categories.includes('17937')/** Belleza y Cuidado*/ || categories.includes('14206')/** Salud y Bienestar*/){
                delete data.Product.ProductData.Gender;
                data.Product.ProductData.UnitMeasure= pv.variation.measure ? pv.variation.measure : 'unidad';
                data.Product.ProductData.Volume= pv.variation.unit ? pv.variation.unit : 1;
                if(categories.includes('17937')/** Belleza y Cuidado*/){
                  delete data.Product.ProductData.UnitMeasure;
                  delete data.Product.ProductData.Volume;
                }
                if(categories.includes('18397')/** Perfumes */){
                  data.Product.ProductData.ProductContent= pv.variation.name;
                  //let intencity = ['Perfume Extract','Eau de Parfum','Eau de Toilette','Eau de Cologne'];
                  data.Product.ProductData.Intencity = 'Eau de Toilette';
                }
              }
              if(categories.includes('14123') /** Automotriz */ || categories.includes('19171')/** Hogar*/ || categories.includes('15449') /** Libros y Peliculas */ || categories.includes('16745')/** Deportes*/ || categories.includes('14185')/** Papeleria y Oficina*/ || categories.includes('15752')/** Electrodomeśticos*/ || categories.includes('19247')/** Ferreteria*/){ delete data.Product.ProductData.Gender; }

              if(i>0 && productvariation.length>1){
                data.Product.ParentSku=parent;
              }
              let productfeatures = await ProductFeature.find({product:p.id,value:{'!=':''}});
              if(productfeatures.length>0){
                for(let fc of productfeatures){
                  if(fc.value){
                    let channelfeatures = await FeatureChannel.find({channel:(product.channels)[0].channel,feature:fc.feature});
                    for(let cf of channelfeatures){
                      data.Product.ProductData[cf.name] = fc.value.toLowerCase();
                    }
                  }
                }
              }
            }
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
            i++;
          }
        }else{
          throw new Error ('Producto sin variaciones');
        }
      }catch(err){
        console.log(err);
      }
    }
    return exits.success(body);
  }
};
