
module.exports = {
    friendlyName: 'Create product',
    description: 'Proceso para crear producto woocommerce webhook',
    inputs: {
      product: {type:'json'},
      seller: {type : 'string'},
      integration :  {type:'json'}
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
      let seller = inputs.seller;
      let product = inputs.product;
      let variations = inputs.product.variations;
      let images  = inputs.product.images;

      try {
        let pro = await sails.helpers.checkProducts(product, seller);
        let categories = pro.categories;
  
        if(typeof(pro) === 'object'){
          let exists = await Product.findOne({reference: pro.reference, seller: pro.seller});
          if (!exists) {
            let pr  =  await Product.create(pro).fetch();
            try {	
              if(inputs.integration.channel.name == sails.config.custom.WOOCOMMERCE_CHANNEL && product.color && product.color.length > 0 && !product.simple){	
                let product_variables = await sails.helpers.marketplaceswebhooks.findProductGraphql(	
                  inputs.integration.channel.name, 	
                  inputs.integration.key,	
                  inputs.integration.secret,	
                  inputs.integration.url,	
                  inputs.integration.version,	
                  'PRODUCT_VARIATION_ID', 	
                  product.externalId	
                );
                
                if(product_variables &&  product_variables.data && product_variables.data.length  > 0){
                  for (let index = 0; index < product_variables.data.length; index++) {	
                    const product_variable = product_variables.data[index];	
                    if(product_variable.color && product.color.length > 0){	
                      pro.reference = product_variable.reference;	
                      let color = await sails.helpers.tools.findColor(`${product_variable.color[0]}`);	
  
                      if(color && color.length > 0){	
                        pro.mainColor = color[0];	
                      }else{	
                        throw new Error(`Ref: ${pro.reference} : ${pro.name} sin color`);	
                      }	
  
                      let exists = await Product.findOne({ externalId:pro.externalId, seller:pro.seller, reference : pro.reference });	
  
                      if (!exists) {	
                          pr = await Product.create(pro).fetch();	
                        for (let im of product_variable.images) {
                          try {
                            let url = (im.src.split('?'))[0];
                            let file = (im.file.split('?'))[0];
                            let uploaded = await sails.helpers.uploadImageUrl(url, file, pr.id).catch((e)=>{
                              throw new Error(`Ref: ${pr.reference} : ${pr.name} ocurrio un error obteniendo la imagen`);
                            });

                            if (uploaded) {
                              let cover = 1;
                              let totalimg = await ProductImage.count({ product: pr.id});
                              totalimg += 1;
                              if (totalimg > 1) { cover = 0; }

                              await ProductImage.create({
                                file: file,
                                position: totalimg,
                                cover: cover,
                                product: pr.id
                              }).fetch();
                            }
                          } catch (err) {
                            console.log(err)
                          }
                        }
                      } else {	
  
                        delete pro.mainCategory;	
                        delete pro.categories;
  
                        pr = await Product.updateOne({ id: exists.id }).set(pro);	
                      }	

                      if(product_variable.color && product_variable.color.length > 0){
                        let prc= await Product.findOne({reference:product_variable.reference, seller:pro.seller});
                        let vt = product_variable.size ? product_variable.size.toLowerCase() : ( product_variable.talla ? product_variable.talla.toLowerCase().replace(',','.') : "única");
                        let variation = await Variation.find({ name:vt, gender:pr.gender,seller:pr.seller,category:categories[0].id});	
                        let productVariation;	
                        
                        if(!variation || variation.length == 0){	
                          variation = await Variation.create({name:vt,gender:pro.gender,seller:pro.seller,category:categories[0].id}).fetch();	
                        }	
  
                        variation = variation.length ? variation[0] : variation;
                        let pvs = await ProductVariation.find({ product:prc.id,supplierreference:product_variable.reference}).populate('variation');
                        let pv = pvs.find(pv=> pv.variation.name == variation.name);
  
                        if (!pv) {
                          productVariation = await ProductVariation.create({
                            product:prc.id,
                            variation:variation.id,
                            reference: product_variable.reference ? product_variable.reference : '',
                            supplierreference:prc.reference,
                            ean13: product_variable.ean13 ? vr.ean13.toString() : '',
                            upc: product_variable.upc ? vr.upc : 0,
                            skuId: product_variable.skuId ? product_variable.skuId : '',
                            price: product_variable.price,
                            quantity: product_variable.quantity ? product_variable.quantity : 0,
                            seller:pr.seller
                          }).fetch();
                        } else {
                          productVariation = await ProductVariation.updateOne({ id: pv.id }).set({
                            price: product_variable.price,
                            variation: variation.id,
                            quantity: product_variable.quantity ? product_variable.quantity : 0,
                          });
                        }
                    }	
                      
                    }	
  
                  }	
                }
          }else{
            await sails.helpers.marketplaceswebhooks.variations({variations} , pr.id, seller);
            await sails.helpers.marketplaceswebhooks.images( {images}  , pr.id, seller);
          }

          } catch (error) {	
            console.log(error);
          }	

          } else {
            delete pro.mainCategory;
            delete pro.categories;
            await Product.updateOne({id: exists.id}).set(pro);
            await sails.helpers.marketplaceswebhooks.variations({variations}, exists.id, seller);
            await sails.helpers.channel.channelSync(exists);
          }
        }
      } catch (error) {
        return exits.error(error);
      }
      return exits.success(true);
    }
  };
  
  