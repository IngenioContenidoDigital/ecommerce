module.exports = {
    friendlyName: 'Create bulk products',
    description: 'Proceso de carga de de productos en masa',
    inputs: {
      products:{ type:'json' },
      seller : {type : 'string'}
    },
    exits: {
      success: {
        description: 'All done.',
      },
      badRequest:{
        description: 'Error'
      },
      serverError:{
        description: 'Error de Proceso'
      }
    },
    fn: async function (inputs,exits) {
                let errors = [];
                let result = [];
                let seller = inputs.seller;
                let images = [];
                
                try {
                  for(let product of inputs.products){
                    let pro = await sails.helpers.checkProducts(product,seller)
                            .catch((e)=> errors.push({name:'ERRDATA',message:e.message}));
                    if (typeof pro === 'object'){
                      images.push({reference : pro.reference,images : pro.images});
                      let ct = await Category.find({id:pro.categories}).sort('level ASC');
                      let tx = await Tax.findOne({id:pro.tax});
                      let tmp = pro;
                      tmpVariations = pro.variations;
                      delete tmp.variations;
                      delete tmp.images;
                      let pr = await Product.findOrCreate({reference:tmp.reference, seller:tmp.seller},tmp);
                      if(tmpVariations===undefined || tmpVariations.length<1){
                        let vr = await Variation.findOrCreate({gender:pro.gender,category:ct[0].id,name:'único', col:'único'},{gender:pro.gender,category:ct[0].id,name:'único', col:'único'});
                        await ProductVariation.findOrCreate({product:pr.id,supplierreference:pr.reference,variation:vr.id},{
                            product:pr.id,
                            variation:vr.id,
                            reference: '',
                            supplierreference:pro.reference,
                            ean13: 0,
                            upc: 0,
                            price: pro.price * (1+(tx.value/100)),
                            quantity: 0
                          });
                      }else{
                        for(let vr of tmpVariations){
                          let v = await Variation.findOrCreate({gender:pro.gender,category:ct[0].id,name:vr.talla.trim().toLowerCase()},{gender:pro.gender,category:ct[0].id,name:vr.talla.trim().toLowerCase()}).catch((e)=>console.log(e));
                          await ProductVariation.findOrCreate({product:pr.id,supplierreference:pr.reference,variation:v.id},{
                            product:pr.id,
                            variation:v.id,
                            reference: vr.reference ? vr.reference : '',
                            supplierreference:pr.reference,
                            ean13: vr.ean13 ? vr.ean13 : 0,
                            upc: vr.upc ? vr.upc : 0,
                            price: pr.price * (1+(tx.value/100)),
                            quantity: vr.quantity ? vr.quantity : 0
                          }).catch((e)=>console.log(e));
                        }
                      }
                      delete pro.images;
                      delete pro.variations;
                      result.push(pr);
                    }
                  }
                  
                  await ImageUploadStatus.createEach(images.map((i)=>{
                      return {
                      images : i.images.map(i=>{
                      return { src : i.src , file : i.file}
                      }),
                      cover : i.cover,
                      position : i.position,
                      product :result.filter((p)=>p.reference === i.reference)[0].id
                      }
                  })).catch((e)=>errors.push(e));
                  
                  return exits.success({ errors, result });
                } catch (error) {
                    return exits.error(error.message);
                }
    }
  };
  
  