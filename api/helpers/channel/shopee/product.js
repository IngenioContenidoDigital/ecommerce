module.exports = {
  friendlyName: 'Product',
  description: 'Product shopee.',
  inputs: {
    product:{
      type:'string',
      required:true,
    },
    action:{
      type:'string',
      required:true,
    },
    integration:{
      type:'ref',
      required:true
    },
    shopeeprice:{
      type:'number',
      defaultsTo:0
    },
    status:{
      type:'string',
      defaultsTo:'NORMAL'
    }
  },
  exits: {
    success: {
      description: 'All done.',
    },
  },
  fn: async function (inputs,exits) {
    let moment = require('moment');
    let textClean = async (text) =>{
      text = text.replace(/\n/g, ' ');
      text=text.replace(/&(nbsp|amp|quot|lt|gt|bull|middot);/g,' ');
      text=text.replace(/([^\u0009\u000a\u000d\u0020-\uD7FF\uE000-\uFFFD]|\u2022)/ig,'');
      text=text.replace( /(<([^>]+)>)/ig, '');
      text=text.replace(/&/g,'y');
      text=text.replace(/[\/\\#,+()$~%.'":*?<>{} ]/g,'');
      text=text.trim();
      return text;
    };
    try{
      if(await ProductVariation.count({product:inputs.product})>0){
        let images = [];
        let pvstock = 0;
        let product = await Product.findOne({id:inputs.product})
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
        let body = null;
        let price = 0;
        let stock = 0;
        let priceadjust = (inputs.shopeeprice && inputs.shopeeprice > 0) ? parseFloat(inputs.shopeeprice) : 0;
        if (inputs.action === 'Post') {
          let productimages = await ProductImage.find({product:product.id}).sort('position ASC');
          for (const image of productimages) {
            let imageId = await sails.helpers.channel.shopee.uploadImage(sails.config.views.locals.imgurl+'/images/products/'+product.id+'/'+image.file, inputs.integration.channel.endpoint);
            if (imageId) {
              images.push(imageId);
            }
          }
        }
        let productvariations = await ProductVariation.find({product:product.id}).populate('variation');
        let optionList = [];
        let models = [];
        let cont = 0;
        for(let variation of productvariations){
          pvstock = (variation.quantity-product.seller.safestock);
          const resultStock = pvstock < 0 ? 0 : pvstock;
          price = (Math.ceil((variation.price*(1+priceadjust))*100)/100).toFixed(0);
          optionList.push({
            option: variation.variation.col ? variation.variation.col : variation.variation.name
          });
          models.push({
            tier_index: [cont],
            normal_stock: resultStock,
            original_price: parseInt(price),
            model_sku: variation.id
          });
          stock+=parseInt(resultStock);
          cont ++;
        }

        let bodyVariations = {
          tier_variation: [{
            option_list: optionList,
            name: 'size'
          }],
          model: models
        };

        body = {
          item_name: await textClean(product.name.toUpperCase()),
          description: await textClean(product.description.slice(0, 500)),
          original_price: parseInt(price),
          weight: product.weight,
          item_status: inputs.status,
          dimension: {
            package_height: product.height,
            package_length: product.length,
            package_width: product.width
          },
          normal_stock: stock,
          logistic_info: [
            {
              enabled: true,
              logistic_id: 90003, //tengo que obtener la logistica
              is_free: false
            }
          ],
          image: {
            image_id_list: images
          },
          item_sku: product.reference,
          condition: 'NEW',
          brand: {
            brand_id: 0,
            original_brand_name: product.manufacturer.name
          },
          variations: bodyVariations
        };

        if(product.mainCategory.shopee.split(',').slice(-1)[0]){body.category_id = parseInt(product.mainCategory.shopee.split(',').slice(-1)[0]);}else{throw new Error('Categoria no homologada en Shopee');}

        if(inputs.action==='Update'){
          if(stock === 0){body.item_status = 'UNLIST';}
          delete body.category_id;
          delete body.dimension;
          delete body.brand;
          delete body.condition;
          delete body.image;
          delete body.logistic_info;
          delete body.original_price;
          delete body.normal_stock;
        }
        return exits.success(body);
      }else{
        throw new Error ('Producto sin variaciones');
      }
    }catch(err){
      return exits.error(err);
    }
  }
};
