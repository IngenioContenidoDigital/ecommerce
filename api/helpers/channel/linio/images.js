module.exports = {
  friendlyName: 'Linio Images',
  description: 'Images linio.',
  inputs: {
    products:{
      type:'ref',
      required:true,
    },
  },
  exits: {
    success: {
      description: 'All done.',
    },
  },
  fn: async function (inputs,exits) {
    let imagebody={Request:[]};
    //Imagenes
    let ilist = {Images:[]};
    for(let p of inputs.products){
      try{
        let images = await ProductImage.find({product:p.id}).sort('position ASC');
        if(images.length>0){
          for(let i of images){
            ilist.Images.push({Image:await sails.config.views.locals.imgurl+'/images/products/'+p.id+'/'+i.file});
          }
          let productvariation = await ProductVariation.find({product:p.id});
          if(productvariation.length>0){
            for(let pv of productvariation){
              let img = {
                ProductImage:{
                  SellerSku:pv.id,
                  Images:ilist.Images
                }
              };
              imagebody.Request.push(img);
            };
          }else{
            throw new Error('Producto sin Variaciones');
          }
        }else{
          await Product.updateOne({id:pp.id}).set({linio:true,liniostatus:false});
          throw new Error('Producto sin Imágenes');
        }
      }catch(err){
        console.log(err);
        //result.errors.push('Ref:'+p.reference+' - '+err.message);
      }
    }
    return exits.success(imagebody);
  }
};

