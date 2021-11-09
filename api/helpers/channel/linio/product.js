module.exports = {
  friendlyName: 'Product Linio',
  description: 'Product linio.',
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
    let textClean = async (text) =>{
      text = text.replace(/\n/g, ' ');
      //text = text.replace(/[^\x00-\x7F]/g, '');
      text=text.replace(/&(nbsp|amp|quot|lt|gt|bull|middot);/g,' '); //Caracteres HTML
      text=text.replace(/([^\u0009\u000a\u000d\u0020-\uD7FF\uE000-\uFFFD]|\u2022)/ig,'');
      text=text.replace( /(<([^>]+)>)/ig, ''); // Etiquetas HTML
      text=text.replace(/&/g,'y'); //Caracteres Especiales
      text=text.replace(/[\/\\#,+()$~%.'":*?<>{} ]/g,''); //Caracteres Especiales
      text=text.trim(); //Espacios Extra
      return JSON.stringify(text);
    };
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
          let integration = await Integrations.findOne({id:inputs.integration.id});
          let parent = productvariation.length > 0 ? productvariation[0].id : '';
          let categories = [];
          if(inputs.alldata){
            for (let c of product.categories){
              let cd = c.linio.split(',');
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
              data.Product.Name= await textClean(product.name.toUpperCase());
              data.Product.Variation= pv.variation.col ? (pv.variation.col.toString() === 'Único' || pv.variation.col.toString() === 'único' || pv.variation.col.toString() === 'Única' || pv.variation.col.toString() === 'única') ? 'Talla Única' : pv.variation.col.toString() : (pv.variation.name.toString() === 'Único' || pv.variation.name.toString() === 'único' || pv.variation.name.toString() === 'Única' || pv.variation.name.toString() === 'única') ? 'Talla Única' : pv.variation.name;
              data.Product.PrimaryCategory= product.mainCategory.linio.split(',')[0];
              //data.Product.Categories= categories.join(',');
              data.Product.Description= jsonxml.cdata(await textClean(product.description));
              data.Product.Brand= product.manufacturer.linioname ? product.manufacturer.linioname : product.manufacturer.name;
              data.Product.TaxClass= product.tax.value === 19 ? 'IVA 19%' : 'IVA excluido 0%';
              data.Product.ProductData= {
                ShortDescription: jsonxml.cdata('<ul><li>Marca:'+product.manufacturer.name+'</li><li>Referencia:'+product.reference+'</li><li>Estado: Nuevo</li><li>Color:'+product.mainColor.name+'</li><li>Nombre:'+product.name+'</li></ul><br/>'+product.descriptionShort)/*.replace(/(<[^>]+>|<[^>]>|<\/[^>]>)/gi,''))*/,
                PackageHeight: product.height,
                PackageLength: product.length,
                PackageWidth: product.width,
                PackageWeight: product.weight,
                Gender: product.gender.name === 'masculino' ? 'hombre' : product.gender.name === 'femenino' ? 'mujer' : product.gender.name === 'niños' ? 'niño' : product.gender.name === 'niñas' ? 'niña' : product.gender.name,
                Color:product.mainColor.name,
                /*FilterColor: product.mainColor.name,*/
                ConditionType: 'Nuevo',
              };

              //if(categories.length<2){delete data.Product.Categories;}
              if(categories.includes('13984')/** Belleza y Cuidado*/ || categories.includes('10253')/** Salud y Bienestar*/){ 
                delete data.Product.ProductData.Gender; 
                data.Product.ProductData.UnitMeasure= pv.variation.measure ? pv.variation.measure : 'unidad';
                data.Product.ProductData.Volume= pv.variation.unit ? pv.variation.unit : 1;
                if(categories.includes('14444')/** Perfumes */){
                  data.Product.ProductData.ProductContent= pv.variation.name;
                  //let intencity = ['Perfume Extract','Eau de Parfum','Eau de Toilette','Eau de Cologne'];
                  data.Product.ProductData.Intencity = 'Eau de Toilette';
                }
              }
              if(categories.includes('15215')/** Hogar*/ || categories.includes('11496') /** Libros y Peliculas */ || categories.includes('12792')/** Deportes*/ || categories.includes('10232')/** Papeleria y Oficina*/ || categories.includes('11799')/** Electrodomeśticos*/){ delete data.Product.ProductData.Gender; }
              if(categories.includes('11672') || categories.includes('15033') || categories.includes('11426')  /** Salud y Bienestar*/ || categories.includes('10170') /** Automotriz */ || categories.includes('14831' /* Mascotas */ )){ delete data.Product.ProductData.Gender;}

              if(i>0 && productvariation.length>1){
                data.Product.ParentSku=parent;
              }
              let productfeatures = await ProductFeature.find({product:p.id,value:{'!=':''}});
              if(productfeatures.length>0){
                for(let fc of productfeatures){
                  if(fc.value && integration){
                    let channelfeatures = await FeatureChannel.find({channel:integration.channel,feature:fc.feature});
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