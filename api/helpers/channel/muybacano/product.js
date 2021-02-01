module.exports = {
  friendlyName: 'Product',
  description: 'Product muybacano.',
  inputs: {
    product:{
      type:'string',
    },
    pv:{
      type:'string',
    },
    action:{
      type:'string',
      required:true,
    },
    mbprice:{
      type:'number',
      defaultsTo:0
    },
    updateQuery:{
      type:'ref',
    },
    status:{
      type:'boolean',
    }
  },
  exits: {
    success: {
      description: 'All done.',
    },
  },
  fn: async function (inputs,exits) {
    let moment = require('moment');
    let axios = require('axios');
    let stripHtml = require('string-strip-html');
    if(inputs.action == 'Post'){
      try{
      
        let product = await Product.findOne({ id: inputs.product })
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
        let pv = await ProductVariation.findOne({id:inputs.pv}).populate('variation');
        let seller = await Seller.findOne({ id: product.seller });
        let images_1e = await ProductImage.find({ product : product.id });
        let images_mb = [];
        let categories = []; 
        let price = 0;
        let padj = inputs.mbprice ? parseFloat(inputs.mbprice) : 0;
        let repeatedPVRef = await ProductVariation.find({supplierreference:pv.supplierreference});

        if(repeatedPVRef.length>1){
          repeatedPVRef=true;
        }else{repeatedPVRef=false}

        for (let index = 0; index < images_1e.length; index++) {
          let obj={
            imageName:images_1e[index].position.toString(),
            imageUrl:`https://s3.amazonaws.com/iridio.co/images/products/${product.id}/${images_1e[index].file}`,
          }
          images_mb.push(obj);
        };

        for(let c in product.categories){
          categories.push(product.categories[c].name);
        };

        if(product.discount.length>0){
          switch(product.discount[0].type){
            case 'P':
              price+=Math.round(((product.price*(1+parseFloat(padj)))*(1-(product.discount[0].value/100)))*(1+(parseFloat(product.tax.value)/100)));
              break;
            case 'C':
              price+=Math.round(((product.price*(1+parseFloat(padj)))-product.discount[0].value)*(1+(parseFloat(product.tax.value)/100)));
              break;
          }
        }else{
          price = Math.round((product.price*(1+parseFloat(padj)))*(1+(parseFloat(product.tax.value)/100)))
        }

        categories = categories.join('/');
        let data={
              "ProductId": product.id,
              "ProductName": product.name,
              "NameComplete": product.name,
              "ProductDescription": stripHtml(product.description).result,
              "BrandName": product.manufacturer.name,
              "SkuName": product.name+''+pv.variation.col,
              "SellerId": seller.id,
              "Height": product.height,
              "Width": product.width,
              "Length": product.length,
              "WeightKg": product.weight,
              "Updated": null,
              "RefId": repeatedPVRef? pv.supplierreference+' '+pv.variation.col : pv.supplierreference,
              "SellerStockKeepingUnitId": pv.id,
              "CategoryFullPath": categories,
              "Images": images_mb,
              "ProductSpecifications": [
                {
                  "FieldId": 1,
                  "FieldName": "Descriptionshort",
                  "FieldValueIds": [],
                  "FieldValues": [stripHtml(product.descriptionShort).result]
              },
              {
                  "FieldId": 2,
                  "FieldName": "Género",
                  "FieldValueIds": [product.gender.id],
                  "FieldValues": [product.gender.name]
              },
              {
                  "FieldId": 3,
                  "FieldName": "Color",
                  "FieldValueIds": [product.mainColor.id],
                  "FieldValues": [product.mainColor.name]
              }
              ],
              "SkuSpecifications": [
                {
                  "FieldId": 1,
                  "FieldName": "Talla",
                  "FieldValueIds": [pv.variation.id],
                  "FieldValues": [pv.variation.col]
                }
              ],
              "EAN": pv.ean13,
              "MeasurementUnit": "kg",
              "UnitMultiplier": 1,
              "AvailableQuantity": inputs.status ? pv.quantity : 0,
              "Pricing": {
                  "Currency": "COP",
                  "SalePrice": price,
                  "CurrencySymbol": "$"
              }
          
          };
        return exits.success(data);
      }catch(err){
        console.log(err);
        return exits.error(err);
      }
    }else if(inputs.action == 'Update'){
      try{
        let array_items=[];
        let item={};
        let array_info=[];
        let info={};
        for (let index = 0; index < inputs.updateQuery.items.length; index++) {
          let element = inputs.updateQuery.items[index];
          let productvariation = await ProductVariation.findOne({id:element.id}).populate('variation');
          // let seller = await Seller.findOne({ id: element.Seller });
          // let credentials = await Integrations.findOne({seller:element.Seller, channel:'muybacano'});
          if(productvariation){
            
            let product = await Product.findOne({ id: productvariation.product })
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

            let price = 0;
            let padj = product.mbprice ? parseFloat(product.mbprice) : 0;
            
            if(product.discount.length>0){
              switch(product.discount[0].type){
                case 'P':
                  price+=Math.round(((product.price*(1+parseFloat(padj)))*(1-(product.discount[0].value/100)))*(1+(parseFloat(product.tax.value)/100)));
                  break;
                case 'C':
                  price+=Math.round(((product.price*(1+parseFloat(padj)))-product.discount[0].value)*(1+(parseFloat(product.tax.value)/100)));
                  break;
              }
            }else{
              price = Math.round((product.price*(1+parseFloat(padj)))*(1+(parseFloat(product.tax.value)/100)))
            }

            item={
                  "id": productvariation.id,// obrigatório, string - identificador so SKU
                  "requestIndex": index, // obrigatório, int - representa a posição desse item no array original (request)
                  "price": price, // obrigatório, int - preço por, os dois dígitos menos significativos são os centavos
                  "listPrice": price, // obrigatório, int - preço de, os dois dígitos menos significativos são os centavos
                  "quantity": productvariation.quantity, // obrigatório, int - retornar a quantidade solicitada ou a quantidade que consegue atender
                  "seller": productvariation.seller, // obrigatório, string - retonar o que foi passado no request
                  "priceValidUntil": product.discount.length>0 ? moment(product.discount[0].to).format() : null,  // pode ser nulo, string - data de validade do preço.
                  "offerings":[]
            }
            
            array_items.push(item);
            info ={
                  "itemIndex": index, // obrigatório, int - index do array de items
                  "stockBalance": 0, // obrigatório, int - estoque que atende
                  "quantity": productvariation.quantity, // obrigatório, int - retornar a quantidade solicitada ou a quantidade que consegue atender
                  "shipsTo": [ "COL"],  // obrigatório, array de string com as siglas dos países de entrega
                  "slas": []
              }
              array_info.push(info);
          } else {
            item={};
            array_items.push(item);
            info ={};
            array_info.push(info);
          } 
        }

        let data={
            "items": array_items,
            "logisticsInfo": array_info,
            "country":"COL",   // string, nulo se não enviado
            "postalCode":"22251-030"   // string, nulo se não enviado,
        }
      return exits.success(data);
      }catch(err){
        console.log(err);
        return exits.error(err);
      }
    }  
  }
};

