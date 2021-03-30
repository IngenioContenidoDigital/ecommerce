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
      for(let p of inputs.products){
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
          })
          .populate('channels',{integration:inputs.integration.id});
          let priceadjust = 0;
          if(product.channels.length>0){
            priceadjust = (inputs.linioprice && inputs.linioprice > 0) ? parseFloat(inputs.linioprice) : product.channels[0].price;
          }else{
            priceadjust = (inputs.linioprice && inputs.linioprice > 0) ? parseFloat(inputs.linioprice) : 0;
          }
          let status= inputs.status ? inputs.status : 'active';

          let productvariation = await ProductVariation.find({product:product.id})
          .populate('variation');
          let parent = productvariation[0].id;
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
            let data = {
              Product: {
                SellerSku: pv.id,
                ProductId: pv.ean13,
                Status: status,
                Price: (Math.ceil((pv.price*(1+priceadjust))*100)/100).toFixed(0),
                Quantity: pv.quantity < 0 ? '0' : pv.quantity.toString(),
              }
            };

            if(inputs.alldata){
              data.Product.Name= product.name;
              data.Product.Variation= (pv.variation.col.toString() === 'Único' || pv.variation.col.toString() === 'único' || pv.variation.col.toString() === 'Única' || pv.variation.col.toString() === 'única') ? 'Talla Única' : pv.variation.col.toString();
              data.Product.PrimaryCategory= product.mainCategory.linio.split(',')[0];
              data.Product.Categories= categories.join(',');
              data.Product.Description= jsonxml.cdata((product.description).replace(/(<[^>]+>|<[^>]>|<\/[^>]>)/gi,''));
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
              //if(product.register!=='' && product.register!==null){data.Product.SanitaryRegistration = product.register;}
              if(categories.length<2){delete data.Product.Categories;}
              if(categories.includes('13984')/** Belleza y Cuidado*/ || categories.includes('10253')/** Salud y Bienestar*/){ 
                delete data.Product.ProductData.Gender; 
                data.Product.ProductData.SanitaryRegistration= product.register ? product.register : '';
                data.Product.ProductData.UnitMeasure= pv.variation.measure ? pv.variation.measure : 'unidad';
                data.Product.ProductData.Volume= pv.variation.unit ? pv.variation.unit : 1;
                if(categories.includes('14444')/** Perfumes */){
                  data.Product.ProductData.ProductContent= pv.variation.name;
                  //let intencity = ['Perfume Extract','Eau de Parfum','Eau de Toilette','Eau de Cologne'];
                  data.Product.ProductData.Intencity = 'Eau de Toilette';
                }
              }
              if(categories.includes('15215')/** Hogar*/ || categories.includes('11496') /** Libros y Peliculas */ || categories.includes('12792')/** Deportes*/ || categories.includes('10232')/** Papeleria y Oficina*/ || categories.includes('11799')/** Electrodomeśticos*/){ delete data.Product.ProductData.Gender; }
              if(categories.includes('11672') || categories.includes('15033') || categories.includes('11426')  /** Salud y Bienestar*/ || categories.includes('10170') /** Automotriz */){ delete data.Product.ProductData.Gender;}

              if(i>0 && productvariation.length>1){
                data.Product.ParentSku=parent;
              }
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
            }else{
              data.Product.SalePrice=null;
              data.Product.SaleStartDate=null;
              data.Product.SaleEndDate=null;
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