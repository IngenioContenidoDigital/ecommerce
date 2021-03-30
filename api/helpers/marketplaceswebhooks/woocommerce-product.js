
module.exports = {
    friendlyName: 'Create product',
    description: 'Proceso para crear producto woocommerce webhook',
    inputs: {
      product: {type:'json'},
      seller: {type : 'string'},
      integration :  {type:'json'},
      separate_product_by_color : {type:'boolean'}
    },
    exits: {
      success: {
        description: 'All done.',
      },
      serverError:{
        description: 'Error de Proceso'
      }
    },
    fn: async function (inputs,exits) {
      const _ = require("lodash");
      let seller = inputs.seller;
      let product = inputs.product;
      let variations = inputs.product.variations;
      let images  = inputs.product.images;

      try {
        let pro = await sails.helpers.checkProducts(product, seller);
        let categories = pro.categories;

        if(typeof(pro) === 'object'){
          let pr;
          let exists = await Product.findOne({ externalId:pro.externalId, seller:seller, reference : pro.reference});
          if (!exists) {
              if(product.simple && (product.color && product.color.length == 1)){
                  pr = await Product.create(pro).fetch();
                  let variations  = inputs.product.variations;
                  let images =  inputs.product.images;
                  await sails.helpers.marketplaceswebhooks.variations({variations} , pr.id, seller);
            await sails.helpers.marketplaceswebhooks.images( {images}  , pr.id, seller);
              }
          } else {
            delete pro.mainCategory;	
            delete pro.categories;
            pr = await Product.updateOne({ id: exists.id }).set(pro);
          }

          try {	
            if(inputs.separate_product_by_color && product.color && product.color.length > 1 && !product.simple){	
              
              let product_variables = await sails.helpers.marketplaceswebhooks.findProductGraphql(	
                inputs.integration.channel.name,
                inputs.integration.key,
                inputs.integration.secret,
                inputs.integration.url,
                inputs.integration.version,
                'PRODUCT_VARIATION_ID', 	
                pro.externalId	
              );	

              let parent_category;

              if(product_variables && product_variables.data){
                let db_color;
                products_colors = _.uniqBy(product_variables.data.filter((p)=>p.color && p.color[0]), p=>p.color[0]);
                for (let index = 0; index < products_colors.length; index++) {	
                    const product_variable = products_colors[index];

                    if(product_variable.color && product.color.length > 0){	
                      
                      let color = await sails.helpers.tools.findColor(`${product_variable.color[0]}`);

                      if(color && color.length > 0){
                        db_color = await Color.findOne({id : color[0]});
                      }

                      if(db_color){
                        pro.mainColor = db_color.id;	
                        pro.reference = `${product_variable.reference}-${db_color.name}`.toUpperCase();	
                      }else{
                        throw new Error(`Ref: ${pro.reference} : ${pro.name} sin color`);	
                      }
                      
                      pro.externalId = product_variable.externalId;
                      
                      if(parent_category){
                        pro.categories =  categories;
                      }

                      let exists = await Product.findOne({ externalId:product_variable.externalId, seller:seller, reference : pro.reference });	

                      if (!exists) {	
                          parent_category = pro.categories;
                          pr = await Product.create(pro).fetch();	
                          try {
                            let productColor =  await Product.findOne({externalId :pr.externalId, seller : seller});
                            if(productColor && await ProductImage.count({product:productColor.id}) == 0){
                              for (let im of product_variable.images) {
                                try {
                                  let url = (im.src.split('?'))[0];
                                  let file = (im.file.split('?'))[0];
                                  let uploaded = await sails.helpers.uploadImageUrl(url, file, productColor.id).catch((e)=>{
                                    throw new Error(`Ref: ${productColor.reference} : ${productColor.name} ocurrio un error obteniendo la imagen`);
                                  });
                                  if (uploaded) {
                                    let cover = 1;
                                    let totalimg = await ProductImage.count({ product: productColor.id});
                                    totalimg += 1;
                                    if (totalimg > 1) { cover = 0; }
      
                                    let rs = await ProductImage.create({
                                      file: file,
                                      position: totalimg,
                                      cover: cover,
                                      product: productColor.id
                                    }).fetch();
                                  }
                                } catch (err) {
                                  console.log(err);
                                }
                              }
                            }
                          } catch (error) {
                            console.log(error)
                          }
                      } else {	

                        delete pro.mainCategory;	
                        delete pro.categories;
                        delete pro.manufacturer;
                        delete pro.gender;
                        delete pro.tax;
                        delete pro.seller;

                        pr = await Product.updateOne({ id: exists.id }).set(pro);	
                      }	

                      delete db_color;
                    
                    }	
                }	

                if(inputs.product.variations && inputs.product.variations.length > 0){

                  let pvrs = require("lodash").uniqBy(inputs.product.variations.filter((p)=>p.color && p.color[0]), p=>p.color[0]);
  
                  if(pvrs.length > 0){
                      for (let index = 0; index < pvrs.length; index++) {
                        pvrs[index].variations = inputs.product.variations.filter((v)=>v.color[0] == pvrs[index].color[0]).map((v)=>{
                          return {
                            talla : v.talla,
                            stock : v.quantity
                          }
                        });
                    }

                    for (let index = 0;index < pvrs.length; index++) {
                      let vr = pvrs[index];
                      let reference;

                      let color = await sails.helpers.tools.findColor(`${vr.color[0]}`);

                      if(color && color.length > 0){
                        color = await Color.findOne({id : color[0]});
                      }

                      if(color){
                        reference = `${vr.reference}-${color.name}`;
                      }else{
                        throw new Error(`Ref : ${vr.reference} no pudimos identificar este color ${vr.color[0]}.`);
                      }

                      let prc= await Product.findOne({reference:reference.toUpperCase(), seller:seller}).populate('categories', {level:2 });
                    
                      if(!prc){
                        throw new Error(`Ref : ${vr.reference} no pudimos encontrar este producto.`);
                      }

                      if(vr.variations && vr.variations.length > 0){
                        for (let index = 0; index < vr.variations.length; index++) {
                            let pdv = vr.variations[index];
                            let vt_name;

                            if(pdv.talla){
                              vt_name = pdv.talla.toLowerCase().replace(',','.');
                            }else if(vr.size){
                              vt_name = vr.size.toLowerCase();
                            }else{
                              vt_name = 'único';
                            }

                            let variation = await Variation.find({ name:vt_name, gender:prc.gender,seller:prc.seller,category:prc.categories[0].id});	
                            let productVariation;	

                            if(!variation || variation.length == 0){	
                              variation = await Variation.create({name:vt_name,gender:prc.gender,seller:prc.seller,category:prc.categories[0].id}).fetch();	
                            }	
        
                            variation = variation.length ? variation[0] : variation;
                            let pvs = await ProductVariation.find({ product:prc.id,supplierreference:vr.reference}).populate('variation');
                            let pv = pvs.find(pv=> pv.variation.name == variation.name);
        
                            if (!pv) {
                              productVariation = await ProductVariation.create({
                                product:prc.id,
                                variation:variation.id,
                                reference: vr.reference ? vr.reference : '',
                                supplierreference:`${prc.reference}-${color.name}`,
                                ean13: vr.ean13 ? vr.ean13.toString() : '',
                                upc: vr.upc ? vr.upc : 0,
                                skuId: vr.skuId ? vr.skuId : '',
                                price: vr.price,
                                quantity: pdv.stock ? pdv.stock : 0,
                                seller:prc.seller
                              }).fetch();
                            } else {
                              productVariation = await ProductVariation.updateOne({ id: pv.id }).set({
                                price: vr.price,
                                variation: variation.id,
                                quantity: pdv.stock ? pdv.stock : 0,
                              });
                            }
                        }

                      }
                }
                  }else{
                    for (let index = 0; index < inputs.product.variations.length; index++) {
                      let pdv = inputs.product.variations[index];
                      let vt_name;
  
                      if(pdv.talla){
                        vt_name = pdv.talla.toLowerCase().replace(',','.');
                      }else if(vr.size){
                        vt_name = vr.size.toLowerCase();
                      }else{
                        vt_name = 'único';
                      }
  
                      let prc= await Product.findOne({reference:pdv.reference.toUpperCase(), seller:seller}).populate('categories', {level:2 });
  
                      if(!prc){
                        throw new Error(`Ref o externalId: ${pdv.reference ? pdv.reference : pdv.externalId} no pudimos encontrar este producto.`);
                      }
  
                      let variation = await Variation.find({ name:vt_name, gender:prc.gender,seller:prc.seller,category:prc.categories[0].id});	
                      let productVariation;	
  
                      if(!variation || variation.length == 0){	
                        variation = await Variation.create({name:vt_name,gender:prc.gender,seller:prc.seller,category:prc.categories[0].id}).fetch();	
                      }	
  
                      variation = variation.length ? variation[0] : variation;
                      let pvs = await ProductVariation.find({ product:prc.id,supplierreference:pdv.reference}).populate('variation');
                      let pv = pvs.find(pv=> pv.variation.name == variation.name);
  
                      if (!pv) {
                        productVariation = await ProductVariation.create({
                          product:prc.id,
                          variation:variation.id,
                          reference: pdv.reference ? pdv.reference : '',
                          supplierreference:`${pdv.reference}`,
                          ean13: pdv.ean13 ? pdv.ean13.toString() : '',
                          upc: pdv.upc ? pdv.upc : 0,
                          skuId: pdv.skuId ? pdv.skuId : '',
                          price: pdv.price,
                          quantity: pdv.quantity || 0,
                          seller:prc.seller
                        }).fetch();
                      } else {
                        productVariation = await ProductVariation.updateOne({ id: pv.id }).set({
                          price: pdv.price,
                          variation: variation.id,
                          quantity: pdv.quantity || 0,
                        });
                      }
                  }
                  }
                }

              }
        }	
          } catch (error) {	
console.log(error)
          }	

        }

      } catch (error) {
        return exits.error(error);
      }
      return exits.success(true);
    }
  };
  
  