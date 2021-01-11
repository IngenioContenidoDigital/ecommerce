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
    let images = [];
    let sid = inputs.socketId;

    try {
      for(let product of inputs.products){
        let errors = [];
        let result = [];

        if(product.reference == 'EVKB2S10'){
            console.log(product);
        }

        try {
          let pro = await sails.helpers.checkProducts(product, seller);

          if(typeof(pro) === 'object'){
            let pr;
            let exists = await Product.findOne({ reference:pro.reference, seller:pro.seller });
            if (!exists) {
              pr = await Product.create(pro).fetch();

              /* Caso para Everlast : si el producto simple trae definido el atributo peso toca buscar
              la variacion para el peso y  crear el productVariation */
              /*if(product.simple && product.product_weight){
                let variation = await Variation.find({ name:product.product_weight, gender:pro.gender,category:pro.categories[0].id});
                
                if(!variation || variation.length == 0){
                   variation = await Variation.create({name:product.product_weight,gender:pro.gender,category:pro.categories[0].id}).fetch();
                }
                productVariation = await ProductVariation.create({
                  product:pr.id,
                  variation:variation[0].id,
                  reference: pro.reference ? pro.reference : '',
                  supplierreference:pro.reference,
                  ean13: '',
                  upc: 0,
                  price: pro.price,
                  quantity: 0,
                  seller:pro.seller
                }).fetch();

              }*/

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

