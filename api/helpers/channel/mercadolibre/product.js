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
        sort: 'createdAt DESC',
        limit: 1
      });
      let body = null;
      let price = 0;
      let stock = 0;
      let padj = inputs.mlprice ? parseFloat(inputs.mlprice) : inputs.channelPrice;
      let integration = await Integrations.findOne({id: inputs.integration}).populate('channel');
      /** ELIMINAR LAS PROMOCIONES ASOCIADAS A UN PRODUCTO */
      /*
      let promotions = null;
      let pchannel = await ProductChannel.findOne({product:inputs.product,integration:inputs.integration});
      if(pchannel && pchannel.channelid){
        promotions = await sails.helpers.channel.mercadolibre.request('seller-promotions/items/'+pchannel.channelid,integration.channel.endpoint,integration.secret);
      }

      if(promotions){
        for(let prom of promotions){
            await sails.helpers.channel.mercadolibre.request('seller-promotions/items/'+pchannel.channelid+'?promotion_type='+prom.type+'&deal_id='+prom.id,integration.channel.endpoint,integration.secret,null,'DELETE');
        }
      }
      */
     /** FIN ELIMINAR PROMOCIONES ASOCIADAS A UN PRODUCTO */

      let productimages = await ProductImage.find({product:product.id});
      productimages.forEach(image =>{
        images.push({'source':sails.config.views.locals.imgurl+'/images/products/'+product.id+'/'+image.file});
        vimages.push(sails.config.views.locals.imgurl+'/images/products/'+product.id+'/'+image.file);
      });
      let productvariations = await ProductVariation.find({product:product.id}).populate('variation');

      productvariations.forEach(variation =>{
        pvstock = (variation.quantity-product.seller.safestock)
        //Se usa para llevar el precio con descuento debido a que el recurso promo no está disponible para colombia Líneas 163 a 182
      //Si se habilita el recurso /promo en la MCO, se debe comentar Líneas 60 a 71 y habilitar líneas 168 a 188
        if(product.discount.length>0 && integration.seller!=='5f80fa751b23a04987116036' && integration.seller!=='5fc5579c77b155db533c52e3'){
          let discPrice=0;
          switch(product.discount[0].type){
            case 'P':
              discPrice+=((variation.price*(1+padj))*(1-(product.discount[0].value/100)));
              break;
            case 'C':
              discPrice+=((variation.price*(1+padj))-product.discount[0].value);
              break;
          }
          price = discPrice;
        }else{
          price = (Math.ceil((variation.price*(1+padj))*100)/100).toFixed(0);
        }
        let v = {
          'attribute_combinations':[
            {
              'id':'SIZE',
              'value_name':variation.variation.col ? variation.variation.col : variation.variation.name,
            }
          ],
          'available_quantity': pvstock < 0 ? 0 : pvstock,
          'price':parseInt(price), //Crear función para validar precio específico de la variación
          'attributes':[{
            'id':'SELLER_SKU',
            'value_name':variation.id
          }],
          'picture_ids':vimages
        };
        stock+=parseInt(variation.quantity);
        variations.push(v);
      });

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
        'title':product.name.substring(0,59),
        'price':parseInt(price),
        'currency_id':'COP',
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
      /*body['variations']=[];
        response.variations.forEach(mlv =>{
          for(let v in variations){
            if(variations[v].attribute_combinations[0].value_name===mlv.attribute_combinations[0].value_name){
              body.variations.push({id:mlv.id,price:variations[v].price});
            }
          }
        });*/
      let category = await Category.findOne({id:product.mainCategory});
      body['category_id']= await sails.helpers.channel.mercadolibre.findCategory(category.name)
      .intercept((err)=>{
        return new Error(err.message);
      });
      let storeid = await sails.helpers.channel.mercadolibre.officialStore(integration, brand);
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
        //}
        /* BLOQUE DE DESCUENTOS
            let mlproduct = result.id;
            console.log(mlproduct);
            if(product.discount.length>0){
              mercadolibre.put('promo/item/'+mlproduct,
              {'best_buyers_discount_percentage':null,
              'buyers_discount_percentage':product.discount[0].value,
              'start_date':moment(product.discount[0].from).toISOString(true),
              'finish_date':moment(product.discount[0].to).toISOString(true),
              'discount_type':'PRICE_DISCOUNT'}, {'access_token':integration.secret},(err, response) =>{
                if(err){console.log('Poner Descuento'); console.log(err);}
                console.log(response);
                return exits.success(result);
              });
            }else{
              mercadolibre.delete('promo/item/'+mlproduct,{'access_token':integration.secret}, (err, response) =>{
                if(err){console.log('Quitar Descuento'); console.log(err);}
                console.log(response);
                return exits.success(result);
              });
            }*/
        /*mercadolibre.put('items/'+product.mlid,body,{'access_token':integration.secret},(error,result) =>{
            if(error){return exits.error(error);}
            return exits.success(result);
          });*/
      }
      return exits.success(body);
    }catch(err){
      return exits.error(err);
    }
  }
};

