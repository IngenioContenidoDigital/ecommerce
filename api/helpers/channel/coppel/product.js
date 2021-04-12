module.exports = {
    friendlyName: 'Product',
    description: 'Product coppel.',
    inputs: {
      product:{
        type:'string',
        required:true,
      },
      action:{
        type:'string',
        required:true,
      },
      cpprice:{
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
      const Excel = require('exceljs');
      
      let status = inputs.status ? inputs.status : 'active';
      try{
        ordersItem = [];
        let variations = [];
        let images = [];
        let vimages=[];  
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
        let pvstock = 0;
        let price = 0;
        let padj = inputs.cpprice ? parseFloat(inputs.cpprice) : 0;
        let seller = await Seller.findOne({id:product.seller}).populate('mainAddress');
        let city = await City.findOne({id:seller.mainAddress.city});
        
        let productimages = await ProductImage.find({product:product.id});
        productimages.forEach(image =>{
          images.push({'source':sails.config.views.locals.imgurl+'/images/products/'+product.id+'/'+image.file});
          vimages.push(sails.config.views.locals.imgurl+'/images/products/'+product.id+'/'+image.file);
        });
  
        let productvariations = await ProductVariation.find({product:product.id}).populate('variation');
        let categories=product.categories[0].name;
        // for(let i=0; i<product.categories.length; i++){
        //     categories=categories+product.categories[i].name;
        //     if(i<(product.categories.length-1)){
        //         categories=categories+'/'
        //     }
        // }
        if(productvariations){
          pvstock = (productvariations[0].quantity-seller.safestock);
        }
        if(productvariations.length===1){
          productvariations.forEach(variation =>{   
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
              price = (Math.ceil((variation.price*(1+padj))*100)/100).toFixed(2)
            }
            });    
            
            if(seller.mainAddress.country==='5eeb7a88cc42a6289844ec83'){
              exchange_rate = await sails.helpers.currencyConverter('COP', 'MXN');
              price = price*exchange_rate.result;
            }

            if(inputs.action=='Post'){
    
              let workbook = new Excel.Workbook();
              let worksheet = workbook.addWorksheet('Productos');
              worksheet.columns = [
                { header: 'Categoría', key: 'category', width: 26 },
                { header: 'SKU', key: 'sku', width: 35 },
                { header: 'Nombre del Producto', key: 'name', width: 35 },
                { header: 'UPC/ISBN/EAN', key: 'ean', width: 20 },
                { header: 'Marca', key: 'brand', width: 12 },
                { header: 'Modelo', key: 'reference', width: 22 },
                { header: 'Color', key: 'color', width: 56 },
                { header: 'Descripción Corta', key: 'shortdescription', width: 22 },
                { header: 'Descripción Larga', key: 'longdescription', width: 15 },
                { header: 'Ciudad de Origen', key: 'city', width: 15 },      
                { header: 'Material', key: 'material', width: 12 },
                { header: 'Medidas de Producto', key: 'dimensions', width: 26 },
                { header: 'Peso de Producto', key: 'weight', width: 20 },
                { header: 'Imagen 1', key: 'image1', width: 12 },
                { header: 'Imagen 2', key: 'image2', width: 22 },
                { header: 'Imagen 3', key: 'image3', width: 15 },
                { header: 'Variacion', key: 'variation', width: 15 },
                { header: 'Talla', key: 'size', width: 15 },
                ];
                    
                for(let i=0; i<productvariations.length; i++){
                  let item={
                    category : categories,
                    sku : product.id,
                    name : product.name,
                    ean : product.id,
                    brand : product.manufacturer.name,
                    reference : product.reference,
                    color : product.mainColor.name,
                    shortdescription : product.descriptionShort,
                    longdescription : product.description,
                    city : city.name,
                    material : 'material',
                    dimensions : `${product.height}x${product.length}x${product.width}`,
                    weight : product.weight,
                    image1 : vimages[0],
                    image2 : vimages[1],
                    image3 : vimages[2],
                    size : productvariations[i].variation.col
                  }
                  ordersItem.push(item);
                }
                worksheet.addRows(ordersItem);
                await workbook.xlsx.writeFile('./.tmp/uploads/product.xlsx');
            }else if(inputs.action=='Offer'){
              let workbook = new Excel.Workbook();
              let worksheet = workbook.addWorksheet('Productos');
              worksheet.columns = [
                { header: 'sku', key: 'sku', width: 35 },
                { header: 'product-id', key: 'product_id', width: 35 },
                { header: 'product-id-type', key: 'product_id_type', width: 20 },
                { header: 'description', key: 'description', width: 12 },
                { header: 'internal-description', key: 'internal_description', width: 22 },
                { header: 'price', key: 'price', width: 56 },
                // { header: 'price-additional-info', key: 'price_additional_info', width: 22 },
                { header: 'quantity', key: 'quantity', width: 15 },     
                { header: 'state', key: 'state', width: 12 },
                // { header: 'available-start-date', key: 'available_start_date', width: 26 },
                // { header: 'available-end-date', key: 'available_end_date', width: 20 },
                // { header: 'discount-price', key: 'discount_price', width: 12 },
                // { header: 'discount-start-date', key: 'discount_start_date', width: 22 },
                // { header: 'discount-start-date', key: 'discount_end_date', width: 12 },
                // { header: 'leadtime-to-ship', key: 'leadtime_to_ship', width: 12 },
                { header: 'update-delete', key: 'update_delete', width: 12 },
                // { header: 'cfwarrantypolicy', key: 'cfwarrantypolicy', width: 12 },
                { header: 'cfwarrantyperiod', key: 'cfwarrantyperiod', width: 12 },
                { header: 'cfshippingpackageweight', key: 'cfshippingpackageweight', width: 12 },
                { header: 'cfshippingpackageheight', key: 'cfshippingpackageheight', width: 12 },
                { header: 'cfshippingpackagelength', key: 'cfshippingpackagelength', width: 12 },
                { header: 'cfshippingpackagewidth', key: 'cfshippingpackagewidth', width: 12 },
                { header: 'cfproducttaxid', key: 'cfproducttaxid', width: 12 },
                ];
                
                let item={
                  sku : productvariations[0].id,
                  product_id : product.id,
                  product_id_type : 'EAN',
                  description : product.description,
                  internal_description : product.descriptionShort,
                  price : price,
                  // price_additional_info : price,
                  quantity : pvstock < 0 ? 0 : pvstock,
                  state : 'Nuevo',
                  // available_start_date : 'material',
                  // available_end_date : product.height,
                  // discount_price : product.weight,
                  // discount_start_date : vimages[0],
                  // discount_end_date : vimages[1],
                  // leadtime_to_ship : vimages[2],
                  update_delete : 'UPDATE',
                  // cfwarrantypolicy : vimages[2],
                  cfwarrantyperiod : '3-months',
                  cfshippingpackageweight : product.weight,
                  cfshippingpackageheight : product.height,
                  cfshippingpackagelength : product.length,
                  cfshippingpackagewidth : product.width,
                  cfproducttaxid : product.id
                }
                ordersItem.push(item);
                worksheet.addRows(ordersItem);
                await workbook.xlsx.writeFile('./.tmp/uploads/product.xlsx');
            }else if(inputs.action == 'Update'){
              let body={
                "offers": [
                  {
                    "available_ended": moment().add(1,'Y').toISOString(),
                    "available_started": moment().toISOString(),
                    "cfwarrantyperiod" : "3-months", 
                    "description": product.description,
                    "internal_description": product.description,
                    "price": price,
                    "product_id": product.id,
                    "product_id_type": "EAN",
                    "quantity": inputs.status!=='active' ? 0 : pvstock < 0 ? 0 : pvstock,
                    "shop_sku": productvariations[0].id,
                    "state_code": "11",
                    "update_delete": "update"
                  }
                ]
              }
              return exits.success(body);
            }
            return exits.success();
        }

      }catch(err){
          console.log(err);
        return exits.error(err);
      }
    }
  };
  
  