module.exports = {


  friendlyName: 'Product variation checker service',


  description: 'Check and validate a product variation',


  inputs: {
    product: { type: 'ref' },
  },

  exits: {
    success: {
      description: 'All done.',
    },
  },

  fn: function (inputs) {
    return new Promise(async (resolve, reject) => {
      let variationToStore = [];

      let each = async (array, callback) => {
        for (let index = 0; index < array.length; index++) {
          await callback(array[index], index, array);
        }
      }

      result = inputs.product;

      await each(result.variations, async (pv) => {
        let variation = {};
        variation.seller = result.seller;
        variation.supplierreference = result.reference;

        if (pv.ean13)
          variation.ean13 = pv.ean13;
        if (variation.upc)
          variation.upc = pv.upc;

        variation.quantity = pv.quantity || 0;
        let product = await Product.find({ reference: variation.supplierreference, seller: variation.seller }).populate('tax').populate('categories');
        let categories = [];

        if (product[0].categories) {
          product[0].categories.forEach(category => {
            if (!categories.includes(category.id)) {
              categories.push(category.id);
            }
          });
        }

        variation.product = product[0].id;
        variation.price = parseInt(product[0].price * (1 + product[0].tax.value / 100));

        if (!pv.gender && pv.talla) {
          let gender = await Gender.find({ name : 'unisex'});

          let uniqueSize = await Variation.find({
            where: { name: pv.talla.trim().toLowerCase(), gender : gender.id },
            limit: 1
          }).catch((e) => console.log(e));

          if(!uniqueSize && uniqueSize.length == 0){
             console.log(uniqueSize);
          }

          try {
            (variation.variation = uniqueSize[0].id);
            
          } catch (error) {
            console.log(error)
          }


        } else if (pv.gender && !pv.talla) {

          let gender = await Gender.findOne({ name: pv.gender.toLowerCase() });
          let uniqueGender = await Variation.find({
            where: { gender: gender.id, name: "único" }
          })

          if (uniqueGender) {
            (variation.variation = uniqueGender[0].id);
          }

        } else if (!pv.talla && !pv.gender) {

          let unique = await Variation.find({
            where: { name: "único"},
            limit: 1
          });

          (variation.variation = unique[0].id);

        } else {
          let v = await Variation.find({
            where: { name: pv.talla.trim().replace(/ /g,'').toLowerCase(), gender: product[0].gender, category: { 'in': categories } },
            limit: 1
          });
        
          (variation.variation = v[0].id);
        }
      
        variationToStore.push(variation);
      
      });

      await ProductVariation.createEach(variationToStore);

      resolve();

    });
  }

};
















