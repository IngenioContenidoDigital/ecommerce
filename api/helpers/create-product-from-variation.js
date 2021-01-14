module.exports = {
    friendlyName: 'Create product from variation attribute',
    description: 'Herlper para creación de producto apartir de un atributo',
    inputs: {
      variation:{ type:'json' },
      product:{ type:'json' }
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
        let vr = inputs.variation;
        let pr = inputs.product;
        
        try {
           
        let variacionAsProduct = pr;
        delete variacionAsProduct.id;
        delete variacionAsProduct.categories;
        
        let textPredictor = pr.textLink ? pr.textLink : pr.name+' '+vr.reference;
        
        let color = await sails.helpers.tools.findColor(`${vr.color ? (textPredictor + ' ' + vr.color) : textPredictor}`);
        
        if(vr.reference == 'P00002023'){
          console.log(vr);
        }

        let colorModel = await Color.findOne({ id : color[0]});
        variacionAsProduct.reference = (`${vr.reference}-${colorModel.name}`);
        variacionAsProduct.price = vr.price;
        let cats = await sails.helpers.tools.findCategory(textPredictor);
  
        if(cats.length>0){
            variacionAsProduct.categories = cats;
            let main = await Category.find({id:cats}).sort('level DESC');
            variacionAsProduct.mainCategory = main[0].id;
        }

        if(color && color.length > 0){
          variacionAsProduct.mainColor = color[0];
        }else{
            throw new Error(`Ref: ${vr.reference} : ${pr.name} sin color`);
        }

        let gender = await sails.helpers.tools.findGender(textPredictor);

        if (gender && gender.length>0) {
          variacionAsProduct.gender = gender[0];
        } else {
          variacionAsProduct.gender = (await Gender.findOne({ name: 'unisex' })).id;
        }

        let categories = variacionAsProduct.categories;
        let vp = await Product.create(variacionAsProduct).fetch();
        
        if(vp){
          let variation = vr.weight || vr.talla;
          variation = await Variation.find({ name:variation.toLowerCase().replace(',','.'), gender:variacionAsProduct.gender,category:categories[0].id});
        
          if(!variation || variation.length == 0){
              variation = await Variation.create({name:variation.toLowerCase().replace(',','.'),gender:variacionAsProduct.gender,category:categories[0].id}).fetch();
          }

          let pvariation = await ProductVariation.create({
            product:vp.id,
            variation:(variation.length > 0) ?  variation[0].id : variation.id,
            reference: variacionAsProduct.reference,
            supplierreference:vr.reference,
            ean13: vr.ean13 ? vr.ean13.toString() : '',
            upc: vr.upc ? vr.upc : 0,
            price: variacionAsProduct.price,
            quantity: vr.quantity ? vr.quantity : 0,
            seller:variacionAsProduct.seller
          }).fetch();

          exits.success(pvariation);

        } 
        } catch (error) {
            exits.serverError(error);
        }
    }
  };
  
  