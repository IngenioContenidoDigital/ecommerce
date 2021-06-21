module.exports = {
  friendlyName: 'Product Walmart',
  description: 'Product Walmart.',
  inputs: {
    products:{
      type:'ref',
      required:true,
    },
    walmartprice:{
      type:'number',
      defaultsTo:0
    },
    channelPrice:{
      type:'number',
      defaultsTo:0
    },
    action:{
      type:'string',
      required:true
    },
    channel:{
      type:'string',
      required:true
    }
  },
  exits: {
    success: {
      description: 'All done.',
    },
  },
  fn: async function (inputs,exits) {
    var jsonxml = require('jsontoxml');
    let moment = require('moment');

    let images = [];
    let padj = inputs.walmartprice ? parseFloat(inputs.walmartprice) : inputs.channelPrice;
    let body = `<MPItemFeed xmlns="http://walmart.com/"><MPItemFeedHeader><version>3.2</version><locale>es_MX</locale><mart>WALMART_MEXICO</mart></MPItemFeedHeader>`;
    let variant = false;
    let price;
    let channel = await Channel.findOne({id:inputs.channel}).populate('currency');
    
    for(let p of inputs.products){
      let priceadjust = padj > 0 ? padj : inputs.channelPrice ;
      try{
        let product = await Product.findOne({id:p.id})
          .populate('gender')
          .populate('mainColor')
          .populate('manufacturer')
          .populate('mainCategory')
          .populate('tax')
          .populate('categories',{
            sort: 'level ASC'
          })
          .populate('discount',{
            where:{
              to:{'>=':moment().valueOf()},
              from:{'<=':moment().valueOf()}
            },
            sort: 'createdAt DESC',
            limit: 1
          });
        let seller = await Seller.findOne({id:product.seller}).populate('mainAddress').populate('currency');

        let productimages = await ProductImage.find({product:product.id});
        productimages.forEach(image =>{
          images.push(sails.config.views.locals.imgurl+'/images/products/'+product.id+'/'+image.file);
        });

        let productvariation = await ProductVariation.find({product:product.id}).populate('variation');
        if(productvariation.length>1){variant = true;}
        for (let index = 0; index < productvariation.length; index++) {
          const variation = productvariation[index];
          if(product.discount.length>0){
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
            price = (Math.ceil((variation.price*(1+padj))*100)/100).toFixed(2);
          }
          if(seller.currency.isocode !== channel.currency.isocode){
            let exchange_rate = await sails.helpers.currencyConverter(seller.currency.isocode, channel.currency.isocode);
            price = price*exchange_rate.result;
          }
          variation.price = price;
            
        }
          
        let categories = [];
        for (let c of product.categories){
          if(c.walmart){
            let cd = c.walmart.split(',');
            for(let dd of cd){
              if(!categories.includes(dd) && dd!=='' && dd!== null){
                categories.push(dd);
              }
            }
          }
        }
        console.log(categories);
        let i=0;

        for(let pv of productvariation){
          let primary_variant = i == 0 ? true : false;
          let data = await sails.helpers.channel.walmart.bodyGenerator(categories, variant, inputs.action, pv, images, product, primary_variant);
          i++;
          let xml = jsonxml(data);
          body = body + xml;
        }
         
        body = body +'</MPItemFeed>';
      }catch(err){
        return exits.error(err);    
      }
    }
    return exits.success(body);
  }
};