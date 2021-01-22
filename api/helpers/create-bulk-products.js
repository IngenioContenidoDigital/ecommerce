module.exports = {
  friendlyName: 'Create bulk products',
  description: 'Proceso de carga de de productos en masa',
  inputs: {
    products:{ type:'json' },
    seller : {type : 'string'},
    socketId : {type : 'string'}
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

    let seller = inputs.seller;
    let sid = inputs.socketId;

    try {
      for(let product of inputs.products){
        let errors = [];
        let result = [];

        try {
          let pro = await sails.helpers.checkProducts(product, seller);

          if(typeof(pro) === 'object'){
            let pr;
            let exists = await Product.findOne({ externalId:pro.externalId, seller:pro.seller });
            if (!exists) {
              pr = await Product.create(pro).fetch();

              /* Caso para Everlast : si el producto simple trae definido el atributo peso toca buscar
              la variacion para el peso y  crear el productVariation */
              if(product.simple && product.product_weight){
                let variation = await Variation.find({ name:product.product_weight, gender:pr.gender,category:pr.mainCategory});
                
                if(!variation || variation.length == 0){
                   variation = await Variation.create({name:product.product_weight,gender:pr.gender,category:pr.mainCategory}).fetch();
                }

                let pvs = await ProductVariation.find({ product:pr.id, supplierreference:pr.reference}).populate('variation');
                let pv = pvs.find(pv=> pv.variation.name == variation[0].name);
               
                if (!pv) {
                  productVariation = await ProductVariation.create({
                    product:pr.id,
                    variation:variation.length > 0  ? variation[0].id : variation.id,
                    reference: pr.reference,
                    supplierreference:pr.reference,
                    ean13: pr.ean13 ? pr.ean13.toString() : '',
                    upc: pr.upc ? pr.upc : 0,
                    price: pr.price,
                    quantity: product.quantity ? product.quantity : 0,
                    seller:pr.seller
                  }).fetch();
                } else {
                  productVariation = await ProductVariation.updateOne({ id: pv.id }).set({
                    price: pr.price,
                    variation: variation.length > 0  ? variation[0].id : variation.id,
                    quantity: product.quantity ? product.quantity : 0,
                  });
                }
              }else{
                let variation = await Variation.find({ name:'único', gender:pr.gender,category:pr.mainCategory});
                
                if(!variation || variation.length == 0){
                   variation = await Variation.create({name:'único',gender:pr.gender,category:pr.mainCategory}).fetch();
                }

                let pvs = await ProductVariation.find({ product:pr.id, supplierreference:pr.reference}).populate('variation');
                let pv = pvs.find(pv=> pv.variation.name == variation[0].name);
               
                if (!pv) {
                  productVariation = await ProductVariation.create({
                    product:pr.id,
                    variation:variation.length > 0  ? variation[0].id : variation.id,
                    reference: pr.reference,
                    supplierreference:pr.reference,
                    ean13: pr.ean13 ? pr.ean13.toString() : '',
                    upc: pr.upc ? pr.upc : 0,
                    price: pr.price,
                    quantity: product.quantity ? product.quantity : 0,
                    seller:pr.seller
                  }).fetch();
                } else {
                  productVariation = await ProductVariation.updateOne({ id: pv.id }).set({
                    price: pr.price,
                    variation: variation.length > 0  ? variation[0].id : variation.id,
                    quantity: product.quantity ? product.quantity : 0,
                  });
                }
              }

            } else {
              delete pro.mainCategory;
              delete pro.categories;
              pr = await Product.updateOne({ id: exists.id }).set(pro);
            }
            result.push(pr);
            sails.sockets.broadcast(sid, 'product_processed', { errors, result });
          }

        } catch (error) {
          errors.push({ name:'ERRDATA', message:error.message });
          sails.sockets.broadcast(sid, 'product_processed', { errors, result });
        }
      }

      return exits.success(true);

    } catch (error) {
      errors.push(error);
      sails.sockets.broadcast(sid, 'product_processed', { errors, result });
      return exits.error(error.message);
    }
  }
};

