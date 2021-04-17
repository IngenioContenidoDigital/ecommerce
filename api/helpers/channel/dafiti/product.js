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
      for(let p of inputs.products){
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
            sort: 'createdAt DESC',
            limit: 1
          })
          .populate('channels',{integration:inputs.integration.id});
          let priceadjust = 0;
          if(product.channels.length>0){
            priceadjust = (inputs.dafitiprice && inputs.dafitiprice > 0) ? parseFloat(inputs.dafitiprice) : product.channels[0].price;
          }else{
            priceadjust = (inputs.dafitiprice && inputs.dafitiprice > 0) ? parseFloat(inputs.dafitiprice) : 0;
          }
          
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
                Price:(Math.ceil((pv.price*(1+priceadjust))*100)/100).toFixed(0),
                Quantity:pvstock < 0 ? '0' : pvstock.toString(),
              }
            };
            
            if(inputs.alldata){

              data.Product.Name=product.name;
              data.Product.PrimaryCategory=product.mainCategory.dafiti.split(',')[0];
              data.Product.Categories=categories.join(',');
              data.Product.Description= jsonxml.cdata((product.description).replace(/(<[^>]+>|<[^>]>|<\/[^>]>)/gi,''));
              data.Product.Brand=brand;
              data.Product.Condition='new';
              data.Product.Variation=pv.variation.col.replace(/\.5/,'½').toString();

              data.Product.ProductData = {};

              if(product.gender && product.gender.name){
                data.Product.ProductData.Gender=product.gender.name;
              }

              if(product.mainColor && product.mainColor.name){
                data.Product.ProductData.ColorNameBrand=product.mainColor.name;
                data.Product.ProductData.ColorFamily=product.mainColor.name;
                data.Product.ProductData.Color=product.mainColor.name;
              }

              if(categories.length<2){delete data.Product.Categories;}
              if(categories.includes('2')/** Accesorios */ || categories.includes('138')/** Deportes */){delete data.Product.ProductData.ShortDescription;}
              if(i>0 && productvariation.length>1){
                data.Product.ParentSku=parent;
              }
            }
            /*if(brand==='speedo'){
              data.Product.ProductData.ShortDescription=jsonxml.cdata('<ul><li>Marca:'+product.manufacturer.name+'</li><li>Referencia:'+product.reference+'</li><li>Estado: Nuevo</li><li>Color:'+product.mainColor.name+'</li><li>Nombre:'+product.name+'</li></ul><br/>');
            }else{
              data.Product.ProductData.ShortDescription=jsonxml.cdata('<ul><li>Marca:'+product.manufacturer.name+'</li><li>Referencia:'+product.reference+'</li><li>Estado: Nuevo</li><li>Color:'+product.mainColor.name+'</li><li>Nombre:'+product.name+'</li></ul><br/>'+product.descriptionShort);
            }*/
            
            i++;
            if(product.discount.length>0){
              let discPrice=0;
              switch(product.discount[0].type){
                case 'P':
                  discPrice+=((pv.price*(1+priceadjust || 0))*(1-(product.discount[0].value/100)));
                  break;
                case 'C':
                  discPrice+=((pv.price*(1+priceadjust || 0))-product.discount[0].value);
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
          }
        }catch(err){
          console.log(err);
        }
      }
    return exits.success(body);
  }
};

