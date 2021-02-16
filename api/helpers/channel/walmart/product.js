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
    status:{
      type:'string',
      defaultsTo:'active'
    },
    channelPrice:{
      type:'number',
      defaultsTo:0
    },
    action:{
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
    let body={Request:[]};
    let variant = false;
    let price;
      for(let p of inputs.products){
        let priceadjust = padj > 0 ? padj : inputs.channelPrice ;
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
          
          let seller = await Seller.findOne({id:product.seller}).populate('mainAddress');
          let status= inputs.status ? inputs.status : 'active';
          let exchange_rate = await sails.helpers.currencyConverter('COP', 'MXN');

          let productimages = await ProductImage.find({product:product.id});
          productimages.forEach(image =>{
            images.push(sails.config.views.locals.imgurl+'/images/products/'+product.id+'/'+image.file);
          });

          let productvariation = await ProductVariation.find({product:product.id}).populate('variation');
          if(productvariation.length>1){variant = true;}
          productvariation.forEach(variation =>{
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
            if(seller.mainAddress.country==='5eeb7a88cc42a6289844ec83'){
              price = price*exchange_rate.result;
            }
            variation.price = price;
          });
          
          let categories = [];
          for (let c of product.categories){
            let cd = c.walmart.split(',');
            for(let dd of cd){
              if(!categories.includes(dd) && dd!=='' && dd!== null){
                categories.push(dd);
              }
            }
          }
          let i=0;
          for(let pv of productvariation){
            let primary_variant = i == 0 ? true : false;
            let data = await sails.helpers.channel.walmart.bodyGenerator(categories, variant, inputs.action, pv, images, product, primary_variant);
            i++;
            // console.log(data.MPItem.MPProduct.category);
            body.Request.push(data);
          }

          let xml = jsonxml(body.Request,true);
          String.prototype.splice = function(idx, rem, str) {
            return this.slice(0, idx) + str + this.slice(idx + Math.abs(rem));
          };
          body = xml.splice(38, 0, `<MPItemFeed xmlns="http://walmart.com/"><MPItemFeedHeader><version>3.2</version><locale>es_MX</locale><mart>WALMART_MEXICO</mart></MPItemFeedHeader>`);
          console.log(body);
        }catch(err){
          console.log(err);
        }
      }
    return exits.success(body);
  }
};