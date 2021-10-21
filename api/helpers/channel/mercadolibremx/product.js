module.exports = {
  friendlyName: 'Product',
  description: 'Product mercadolibre.',
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
      type:'string',
      required:true,
    },
    channelPrice:{
      type:'number'
    },
    mlprice:{
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
    let status = inputs.status ? inputs.status : 'active';
    try{
      if(await ProductVariation.count({product:inputs.product})>0){
        let variations = [];
        let images = [];
        let vimages=[];
        let pvstock = 0;
        let product = await Product.findOne({id:inputs.product})
      .populate('manufacturer')
      .populate('gender')
      .populate('mainColor')
      .populate('seller')
      .populate('tax')
      .populate('discount',{
        where:{
          to:{'>=':moment().valueOf()},
          from:{'<=':moment().valueOf()}
        },
        sort: 'createdAt DESC'
      });
        let body = null;
        let price = 0;
        let stock = 0;
        let padj = inputs.mlprice ? parseFloat(inputs.mlprice) : inputs.channelPrice;
        let integration = await Integrations.findOne({id: inputs.integration}).populate('channel');
        let priceDiscount = integration.priceDiscount || 0;
        let productimages = await ProductImage.find({product:product.id}).sort('position ASC');
        productimages.forEach(image =>{
          images.push({'source':sails.config.views.locals.imgurl+'/images/products/'+product.id+'/'+image.file});
          vimages.push(sails.config.views.locals.imgurl+'/images/products/'+product.id+'/'+image.file);
        });
        let productvariations = await ProductVariation.find({product:product.id}).populate('variation');

        let promotions = null;
        if (inputs.action==='ProductUpdate' || inputs.action==='Update') {
          let pchannel = await ProductChannel.findOne({product:inputs.product,integration:inputs.integration});
          if(pchannel && pchannel.channelid && pchannel.status){
            promotions = await sails.helpers.channel.mercadolibremx.request(`seller-promotions/items/${pchannel.channelid}`,integration.channel.endpoint,integration.secret);
          }
        }
        for(let variation of productvariations){
          pvstock = (variation.quantity-product.seller.safestock);
          //Se usa para llevar el precio con descuento debido a que el recurso promo no está disponible para colombia Líneas 163 a 182
          //Si se habilita el recurso /promo en la MCO, se debe comentar Líneas 60 a 71 y habilitar líneas 168 a 188
          price = (Math.ceil((variation.price*(1+padj))*100)/100).toFixed(0);
          if(product.discount.length>0 && integration.seller!=='5f80fa751b23a04987116036' && integration.seller!=='5fc5579c77b155db533c52e3'){
            let discountids = product.discount.map(d => d.id);
            let allowedDiscount = await CatalogDiscount.find({id:discountids}).populate('integrations',{id:integration.id});
            allowedDiscount = allowedDiscount.filter(ad =>{ if(ad.integrations && ad.integrations.length > 0){return ad;}});
            if(allowedDiscount.length>0){
              let discPrice=0;
              let valueDisc=0;
              switch(allowedDiscount[allowedDiscount.length-1].type){
                case 'P':
                  const productDisc = allowedDiscount[allowedDiscount.length-1].value/100;
                  valueDisc = productDisc - priceDiscount;
                  discPrice+=((variation.price*(1+padj))*(valueDisc > 0 ? (1-valueDisc) : 0));
                  break;
                case 'C':
                  valueDisc = allowedDiscount[allowedDiscount.length-1].value - (variation.price*priceDiscount);
                  discPrice+= valueDisc > 0 ? ((variation.price*(1+padj))-valueDisc) : 0;
                  break;
              }
              price = discPrice > 0 ? discPrice.toFixed(0) : (Math.ceil((variation.price*(1+padj))*100)/100).toFixed(0);
            }
          }
          let v = {
            'attribute_combinations':[
              {
                'id':'SIZE',
                'value_name':variation.variation.mx ? variation.variation.mx : variation.variation.name,
              }
            ],
            'available_quantity': pvstock < 0 ? 0 : pvstock,
            'price':parseInt(price),
            'attributes':[{
              'id':'SELLER_SKU',
              'value_name':variation.id
            }],
            'picture_ids':vimages
          };
          if (promotions && promotions.length > 0) {
            delete v.price;
          }
          stock+=parseInt(pvstock);
          variations.push(v);
        }

        let brand = null;
        switch(product.manufacturer.name){
          case 'Rosé Pistol':
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

        body ={
          'title':product.name.substring(0,59).toUpperCase(),
          'price':parseInt(price),
          'currency_id': 'MXN',
          'buying_mode':'buy_it_now',
          'condition':'new',
          'listing_type_id':'gold_special',
          'description':{
            'plain_text':(product.descriptionShort+' '+product.description).replace(/(<[^>]+>|<[^>]>|<\/[^>]>)/gi,'')
          },
          'sale_terms':[
            {
              'id':'WARRANTY_TYPE',
              'value_name':'Garantía del vendedor'
            },
            {
              'id':'WARRANTY_TIME',
              'value_name':'30 días'
            }
          ],
          'pictures':images,
          'attributes':[
            {
              'id':'BRAND',
              'value_name':brand
            },
            {
              'id':'MODEL',
              'value_name':product.reference
            },
            {
              'id':'GENDER',
              'value_name':product.gender.name
            },
            {
              'id':'COLOR',
              'value_name':product.mainColor.name
            },
          ],
          'shipping':{
            'mode':'me2',
            'local_pick_up':false,
            'free_shipping':true,
            'free_methods':[]
          },
          'variations':variations,
        };
        let productfeatures = await ProductFeature.find({product:product.id,value:{'!=':''}});
        if(productfeatures.length>0){
          for(let fc of productfeatures){
            if(fc.value){
              let channelfeatures = await FeatureChannel.find({channel:integration.channel.id,feature:fc.feature});
              for(let cf of channelfeatures){
                body.attributes.push({'id':cf.name,'value_name':fc.value.toLowerCase()});
              }
            }
          }
        }
        let category = await Category.findOne({id:product.mainCategory});
        body['category_id']= category.mercadolibremx;
        let storeid = await sails.helpers.channel.mercadolibremx.officialStore(integration, brand);
        if(storeid>0){body['official_store_id']=storeid;}
        if(inputs.action==='ProductUpdate' || inputs.action==='Update'){
          if(stock>0){body['status']=status;}
          //if(product.ml && !product.mlstatus){
          delete body['title'];
          delete body['listing_type_id'];
          delete body['buying_mode'];
          delete body['price'];
          delete body['description'];
          delete body['condition'];
          delete body['category_id'];
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

