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
    fn: async function (inputs) {
        return new Promise(async (resolve, reject)=>{
                let cols = [];
                let errors = [];
                let result = [];
                let seller = inputs.seller;
                let images = [];
                let variations = [];

                each = async (array, callback) => {
                    for (let index = 0; index < array.length; index++) {
                    await callback(array[index], index, array).catch((e) => errors.push(e));
                    }
                }
                
                try {
                        await each(inputs.products, async (product) => {
                            let pro = await sails.helpers.checkProducts({ seller: seller, ...product }).catch((e)=>errors.push(e));
                            
                            if (typeof (pro) === typeof ({})){
                              images.push({reference : pro.reference ,images : pro.images});
                              variations.push({...pro});
                              pro.images = [];
                              pro.variations = [];
                              cols.push(pro);
                            }

                        }).catch((e) => errors.push(e));
                        result = await Product.createEach(cols).fetch();
                        
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

                        await each(variations, async (v)=>{
                            await sails.helpers.checkVariations( v ).catch(e => errors.push(e)); 
                        });
                        
                        resolve({ errors, result });
                } catch (error) {
                    reject(new Error("General error while procesing bulk products"));
                }
       
        });
    }
  };
  
  