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
          'price':Math.round(parseFloat(variation.price)*(1+parseFloat(inputs.mlprice))),
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
        'price':Math.round((parseFloat(product.price)*(1+(parseFloat(product.tax.value)/100)))*(1+parseFloat(inputs.mlprice))),
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
          if(product.ml && !product.mlstatus){body = {'status':'active'};}
          mercadolibre.put('items/'+product.mlid,body,{'access_token':integration.secret},(error,result) =>{
            if(error){console.log(error); return exits.error(error);}
            return exits.success(result);
          });
          break;
        case 'Post':
          mercadolibre.post('items',body,{'access_token':integration.secret},(error,result) =>{
            if(error){console.log(error); return exits.error(error);}
            console.log(result);
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

