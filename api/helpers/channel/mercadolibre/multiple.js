module.exports = {
  friendlyName: 'Multiple',
  description: 'Multiple mercadolibre.',
  inputs: {
    seller: {
      type: 'string',
      required: true,
    },
    action: {
      type: 'string',
      required: true,
    }
  },
  exits: {
    success: {
      description: 'All done.',
    },
  },
  fn: async function (inputs, exits) {
    let moment = require('moment');
    let mercadolibre = false;
    let products = null;
    let response = {Request:[]};
    if(inputs.action==='ProductUpdate'){mercadolibre = true;}
    if(inputs.action==='ProductCreate' || inputs.action==='ProductUpdate') {
      products = await Product.find({
        where: {seller: inputs.seller, ml: mercadolibre, active: true},
        limit: 600,
        sort: 'createdAt ASC'
      })
      .populate('gender')
      .populate('mainColor')
      .populate('manufacturer')
      .populate('mainCategory')
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
      try {
        if(products.length > 0){
          for(let product of products){
            let itemMl = [];
            let variations = [];
            let images = [];
            let vimages = [];
            let categories = [];
            let body = null;
            let price = 0;
            let productvariations = await ProductVariation.find({product: product.id}).populate('variation');

            if(product.discount.length > 0){
              switch(product.discount[0].type){
                case 'P':
                  price+=Math.round(((product.price*(1+parseFloat(product.mlprice)))*(1-(product.discount[0].value/100)))*(1+(parseFloat(product.tax.value)/100)));
                  break;
                case 'C':
                  price+=Math.round(((product.price*(1+parseFloat(product.mlprice)))-product.discount[0].value)*(1+(parseFloat(product.tax.value)/100)));
                  break;
              }
            } else {
              price = Math.round((product.price*(1+parseFloat(product.mlprice)))*(1+(parseFloat(product.tax.value)/100)));
            }

            let productimages = await ProductImage.find({product:product.id});
            productimages.forEach(image =>{
              images.push({'source':sails.config.views.locals.imgurl+'/images/products/'+product.id+'/'+image.file});
              vimages.push(sails.config.views.locals.imgurl+'/images/products/'+product.id+'/'+image.file);
            });

            productvariations.forEach(variation =>{
              let v = {
                'attribute_combinations':[
                  {
                    'id': 'SIZE',
                    'value_name': variation.variation.col,
                  }
                ],
                'available_quantity': variation.quantity,
                'price': price, //Crear función para validar precio específico de la variación
                'attributes':[{
                  'id': 'SELLER_SKU',
                  'value_name': variation.id
                }],
                'picture_ids': vimages
              };
              variations.push(v);
            });

            body = {
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

            for(let c in product.categories){
              categories.push(product.categories[c].name);
            }
            categories = categories.join(' ');
            let mercadolibre = await sails.helpers.channel.mercadolibre.sign(product.seller);
            body['category_id']= await sails.helpers.channel.mercadolibre.findCategory(mercadolibre, categories)
            .catch(e =>{ throw new Error(e.message) });
            
            let integration = await Integrations.findOne({channel: 'mercadolibre', seller: product.seller});
            let storeid = await sails.helpers.channel.mercadolibre.officialStore(integration);
            if(storeid>0){body['official_store_id']=storeid;}

            switch(inputs.action) {
              case 'ProductUpdate':
                if(product.ml && product.mlstatus){
                  body['status'] = 'active';
                  delete body['title'];
                  delete body['listing_type_id'];
                  delete body['buying_mode'];
                  delete body['price'];
                  delete body['description'];
                }
                mercadolibre.put('items/'+product.mlid, body,{'access_token': integration.secret},(error, result) =>{
                  if(error){throw new Error(error.message)}
                  itemMl = result;
                });
                break;
              case 'ProductCreate':
                mercadolibre.post('items',body,{'access_token': integration.secret},async (error, result) =>{
                  if(error){throw new Error(error.message);}
                  await Product.updateOne({id: product.id}).set({
                    ml: true,
                    mlstatus: true,
                    mlid: result.id
                  });
                  itemMl = result;
                });
                break;
              default:
                mercadolibre.get('items/'+product.mlid,{'access_token': integration.secret},(error, result) =>{
                  if(error){throw new Error(error.message);}
                  itemMl = result;
                });
                break;
            }
            response.Request.push(itemMl);
          }
        }
      } catch(err) {
        response.Errors.push({REF:product.reference,ERR:err.message});
      }
    }
    return exits.success(response);
  }
};
