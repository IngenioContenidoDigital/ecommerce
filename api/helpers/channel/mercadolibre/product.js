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
    mlprice:{
      type:'number',
      defaultsTo:0
    }
  },
  exits: {
    success: {
      description: 'All done.',
    },
  },
  fn: async function (inputs,exits) {
    let moment = require('moment');
    try{
      let variations = [];
      let images = [];
      let vimages=[];
      let categories = [];      
      let product = await Product.findOne({id:inputs.product})
      .populate('manufacturer')
      .populate('gender')
      .populate('mainColor')
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
      let body = null;
      let price = 0;
      //Se usa para llevar el precio con descuento debido a que el recurso promo no está disponible para colombia Líneas 163 a 182
      //Si se habilita el recurso /promo en la MCO, se debe comentar Líneas 75 a 86 y habilitar líneas 163 a 182      
      if(product.discount.length>0){
        switch(product.discount[0].type){
          case 'P':
            price+=Math.round(((product.price*(1+inputs.mlprice))*(1-(product.discount[0].value/100)))*(1+(parseFloat(product.tax.value)/100)));
            break;
          case 'C':
            price+=Math.round(((product.price*(1+inputs.mlprice))-product.discount[0].value)*(1+(parseFloat(product.tax.value)/100)));
            break;
        }
      }else{
        price = Math.round((product.price*(1+inputs.mlprice))*(1+(parseFloat(product.tax.value)/100)))
      }

      let productimages = await ProductImage.find({product:product.id});
      productimages.forEach(image =>{
        images.push({'source':sails.config.views.locals.imgurl+'/images/products/'+product.id+'/'+image.file});
        vimages.push(sails.config.views.locals.imgurl+'/images/products/'+product.id+'/'+image.file);
      });

      let productvariations = await ProductVariation.find({product:product.id}).populate('variation');

      productvariations.forEach(variation =>{
        let v = {
          'attribute_combinations':[
            {
              'id':'SIZE',
              'value_name':variation.variation.col,
            }
          ],
          'available_quantity':variation.quantity,
          'price':price, //Crear función para validar precio específico de la variación
          'attributes':[{
            'id':'SELLER_SKU',
            'value_name':variation.id
          }],
          'picture_ids':vimages
        };
        variations.push(v);
      });
      

      body ={
        //'official_store_id':'123',
        'title':product.name.substring(0,59),
        'price':price,
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
            'value_name':product.manufacturer.name
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

      for(let c in product.categories){
        categories.push(product.categories[c].name);
      }
      categories = categories.join(' ');
      let mercadolibre = await sails.helpers.channel.mercadolibre.sign(product.seller);
      body['category_id']= await sails.helpers.channel.mercadolibre.findCategory(mercadolibre,categories);
      let integration = await Integrations.findOne({channel:'mercadolibre',seller:product.seller});
      switch(inputs.action){
        case 'Update':
          if(product.ml && product.mlstatus){body = {'status':'paused'};}
          if(product.ml && !product.mlstatus){
            body['status']='active';
            delete body['title'];
            delete body['listing_type_id'];
            delete body['buying_mode'];
            delete body['price'];
            delete body['description'];
          }
          mercadolibre.put('items/'+product.mlid,body,{'access_token':integration.secret},(error,result) =>{
            if(error){console.log(error); return exits.error(error);}
            return exits.success(result);
          });
          break;
        case 'Post':
          mercadolibre.post('items',body,{'access_token':integration.secret},(error,result) =>{
            if(error){console.log(error); return exits.error(error);}
            /*let mlproduct = result.id;
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
            return exits.success(result);
          });
          break;
        default:
          mercadolibre.get('items/'+inputs.mlid,{'access_token':integration.secret},(error,result) =>{
            if(error){console.log(error); return exits.error(error);}
            console.log(result);
            return exits.success(result);
          });
          break;
      }
    }catch(err){
      console.log(err);
      return exits.error(err);
    }
  }
};

