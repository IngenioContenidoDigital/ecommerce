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
    }
  },
  exits: {
    success: {
      description: 'All done.',
    },
  },
  fn: async function (inputs,exits) {
    console.log('hola');
    let moment = require('moment');

    let images = [];
    let padj = inputs.walmartprice ? parseFloat(inputs.walmartprice) : inputs.channelPrice;
    let body={Request:[]};
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

          let status= inputs.status ? inputs.status : 'active';

          let productimages = await ProductImage.find({product:product.id});
          productimages.forEach(image =>{
            images.push(sails.config.views.locals.imgurl+'/images/products/'+product.id+'/'+image.file);
          });

          let productvariation = await ProductVariation.find({product:product.id}).populate('variation');
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
            variation.price = price;
          });
          let parent = productvariation[0].id;
          let categories = [];
          for (let c of product.categories){
            let cd = c.walmart.split(',');
            for(let dd of cd){
              if(!categories.includes(dd) && dd!=='' && dd!== null){
                categories.push(dd);
              }
            }
          }
          
          for(let pv of productvariation){
            let data = {
              
                "MPItemFeed": {
                  "-xmlns": "http://walmart.com/",
                  "MPItemFeedHeader": {
                    "version": "3.2",
                    "locale": "es_MX",
                    "mart": "WALMART_MEXICO"
                  },
                  "MPItem": {
                    "processMode": "CREATE",
                    "sku": pv.id,
                    "productIdentifiers": {
                      "productIdentifier": {
                        "productIdType": "GTIN",
                        "productId": product.id
                      }
                    },
                    "MPProduct": {
                      "productName": product.name,
                      "msrp": pv.price,
                      "category": {
                        "Electronics": {
                          "TVsAndVideoDisplays": {
                            "keyFeatures": {
                              "keyFeaturesValue": [
                                "Verdadera resolución UHD 4KUna TV inteligente Smart TV",
                                "HDR con mejor claridad y una expresión de color precisa"
                              ]
                            },
                            "brand": product.manufacturer.name,
                            "subBrand": product.manufacturer.name,
                            "modelStyleType": product.reference,
                            "shortDescription": product.descriptionShort,
                            "mainImageUrl": images[0],
                            "productSecondaryImageURL": { "productSecondaryImageURLValue": images[1] },
                            "resolution": "1024",
                            "screenSize": {
                              "measure": "55.00",
                              "unit": "in"
                            },
                            "displayTechnology": "LED",
                            "has3dCapabilities": "No",
                            "modelName": "4K Ultra HD Smart",
                            "assembledProductWeight": {
                              "measure": "10.00",
                              "unit": "kg"
                            },
                            "assembledProductWidth": {
                              "measure": "60.00",
                              "unit": "cm"
                            },
                            "assembledProductHeight": {
                              "measure": "100.00",
                              "unit": "cm"
                            },
                            "assembledProductLength": {
                              "measure": "90.00",
                              "unit": "cm"
                            },
                            "warningText": "Uso sólo en Interiores",
                            "countryOfOriginAssembly": "Canadá",
                            "electricalCurrent": "Alterna 110/120v",
                            "compatibleSoftwareApplications": {
                              "compatibleSoftwareApplicationsValue": [
                                "Netflix",
                                "Vudu"
                              ]
                            },
                            "widthWithStand": {
                              "measure": "12.00",
                              "unit": "cm"
                            },
                            "hasHDR": "Sí",
                            "connections": {
                              "connection": [
                                "USB",
                                "HDMI"
                              ]
                            },
                            "itemsIncluded": "TV, Cable, Remote",
                            "videoPanelDesign": "Plano",
                            "isSmart": "Sí",
                            "isRemoteControlIncluded": "Sí",
                            "watts": {
                              "measure": "140.00",
                              "unit": "W"
                            },
                            "keywords": "Smart TV, UHD",
                            "refreshRate": {
                              "measure": "120.00",
                              "unit": "Hz"
                            },
                            "productVideo": { "productVideoValue": "https://www.walmart.com.mx/tv-y-video/pantallas/todas/tv-samsung-55-pulgadas-4k-ultra-hd-smart-tv-led-un55nu7090fxzx_00750940180824" }
                          }
                        }
                      }
                    },
                    "MPOffer": {
                      "price": "9999.00",
                      "StartDate": "2019-08-08",
                      "EndDate": "2021-08-09",
                      "ShippingDimensionsWidth": {
                        "measure": "65.00",
                        "unit": "cm"
                      },
                      "ShippingDimensionsHeight": {
                        "measure": "85.00",
                        "unit": "cm"
                      },
                      "ShippingWeight": {
                        "measure": "8.00",
                        "unit": "kg"
                      },
                      "ProductTaxCode": "2038346",
                      "condition": "Nuevo",
                      "ShippingDimensionsDepth": {
                        "measure": "75.00",
                        "unit": "cm"
                      },
                      "typeOfTaxInPercentage": "8",
                      "monthsWithoutInterest": "3",
                      "shippingDiscount": "Sí",
                      "sellerWarranty": "3",
                      "sellerWarrantyCondition": "New",
                      "sellerWarrantyPeriod": "3",
                      "shippingCountryOfOrigin": "Brasil",
                      "fulfillmentLagTime": "2"
                    
                  }
                }
              }
            };
     
            body.Request.push(data);
            console.log(data);
          }
          
        }catch(err){
          console.log(err);
        }
      }
    return exits.success(body);
  }
};