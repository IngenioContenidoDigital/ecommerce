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
        try {
          let pro = await sails.helpers.checkProducts(product, seller);

          if(typeof(pro) === 'object'){
            let pr;
            let exists = await Product.findOne({ reference:pro.reference, seller:pro.seller });
            if (!exists) {
              pr = await Product.create(pro).fetch();
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
      errors.push(errors);
      sails.sockets.broadcast(sid, 'product_processed', { errors, result });
      return exits.error(error.message);
    }
  }
};

