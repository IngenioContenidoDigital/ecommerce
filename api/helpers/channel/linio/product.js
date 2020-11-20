module.exports = {
  friendlyName: 'Product Linio',
  description: 'Product linio.',
  inputs: {
    products:{
      type:'ref',
      required:true,
    },
    linioprice:{
      type:'number',
      defaultsTo:0
    },
    status:{
      type:'string',
      defaultsTo:'active'
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
    let padj = inputs.linioprice ? parseFloat(inputs.linioprice) : 0;
    let body={Request:[]};
      for(let p of inputs.products){
        let priceadjust = padj > 0 ? padj : p.linioprice;
        try{
          let product = await Product.findOne({id:p.id})
          .populate('gender')
          .populate('mainColor')
          .populate('manufacturer')
          .populate('mainCategory')
          .populate('tax')
          .populate('categories')
          .populate('discount',{
            where:{
              to:{'>=':moment().valueOf()},
              from:{'<=':moment().valueOf()}
            },
            sort: 'createdAt DESC',
            limit: 1
          });
          let status= inputs.status ? inputs.status : 'active';

          let productvariation = await ProductVariation.find({product:product.id})
          .populate('variation');
          let parent = productvariation[0].id;
          let categories = [];
          for (let c of product.categories){
            let cd = c.linio.split(',');
            for(let dd of cd){
              if(!categories.includes(dd) && dd!=='' && dd!== null){
                categories.push(dd);
              }
            }
          }

          let brand = null;
          switch(product.manufacturer.name){
            case 'Rosé Pistol':
              brand = 'Rose Pistol';
              break;
            case '7 de color siete' || 'color siete care':
              brand = 'color siete';
              break;
            default:
              brand = product.manufacturer.name;
              break;
          }

          brand = await sails.helpers.channel.linio.checkBrand(brand,product.seller);

          let i = 0;
          for(let pv of productvariation){
            let data = {
              Product: {
                SellerSku: pv.id,
                ProductId: pv.ean13,
                Status: status,
                Name: product.name,
                Variation: (pv.variation.col.toString() === 'Único' || pv.variation.col.toString() === 'único') ? 'Talla Única' : pv.variation.col.toString(),
                PrimaryCategory: product.mainCategory.linio.split(',')[0],
                Categories: categories.join(','),
                Description: jsonxml.cdata((product.description).replace(/(<[^>]+>|<[^>]>|<\/[^>]>)/gi,'')),
                Brand: brand,
                Price: (Math.ceil((pv.price*(1+priceadjust))*100)/100).toFixed(2),
                Quantity: pv.quantity < 0 ? '0' : pv.quantity.toString(),
                TaxClass: product.tax.value === 19 ? 'IVA 19%' : 'IVA excluido 0%',
                ProductData: {
                  ShortDescription: jsonxml.cdata('<ul><li>Marca:'+product.manufacturer.name+'</li><li>Referencia:'+product.reference+'</li><li>Estado: Nuevo</li><li>Color:'+product.mainColor.name+'</li><li>Nombre:'+product.name+'</li></ul><br/>'+product.descriptionShort)/*.replace(/(<[^>]+>|<[^>]>|<\/[^>]>)/gi,''))*/,
                  PackageHeight: product.height,
                  PackageLength: product.length,
                  PackageWidth: product.width,
                  PackageWeight: product.weight,
                  Gender: product.gender.name === 'masculino' ? 'hombre' : product.gender.name === 'femenino' ? 'mujer' : product.gender.name === 'niños' ? 'niño' : product.gender.name === 'niñas' ? 'niña' : product.gender.name,
                  Color:product.mainColor.name,
                  /*FilterColor: product.mainColor.name,*/
                  ConditionType: 'Nuevo',
                }
              }
            };
            //if(product.register!=='' && product.register!==null){data.Product.SanitaryRegistration = product.register;}
            if(categories.length<2){delete data.Product.Categories;}
            
            if(categories.includes('13984')/** Belleza y Cuidado*/){ 
              delete data.Product.ProductData.Gender; 
              data.Product.ProductData.SanitaryRegistration= product.register ? product.register : '';
              data.Product.ProductData.UnitMeasure= pv.variation.measure ? pv.variation.measure : 'unidad';
              data.Product.ProductData.Volume= pv.variation.unit ? pv.variation.unit : 1;
            }
            if(categories.includes('15215')/** Hogar*/){ delete data.Product.ProductData.Gender; }
            if(categories.includes('12792')/** Deportes*/){ delete data.Product.ProductData.Gender;}
            if(categories.includes('10253')/** Salud y Bienestar*/){ delete data.Product.ProductData.Gender;}
            if(categories.includes('11672') || categories.includes('15033') || categories.includes('11426')  /** Salud y Bienestar*/){ delete data.Product.ProductData.Gender;}

            if(i>0 && productvariation.length>1){
              data.Product.ParentSku=parent;
            }

            if(product.discount.length>0){
              let discPrice=0;
              switch(product.discount[0].type){
                case 'P':
                  discPrice+=((pv.price*(1+priceadjust))*(1-(product.discount[0].value/100)));
                  break;
                case 'C':
                  discPrice+=((pv.price*(1+priceadjust))-product.discount[0].value);
                  break;
              }
              data.Product.SalePrice=discPrice.toFixed(2);
              data.Product.SaleStartDate=moment(product.discount[0].from).format();
              data.Product.SaleEndDate=moment(product.discount[0].to).format();
            }
            body.Request.push(data);
            i++;
          }
        }catch(err){
          console.log(err);
        }
      }
    return exits.success(body);
  }
};