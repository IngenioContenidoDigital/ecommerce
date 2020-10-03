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
                    let pro = await sails.helpers.checkProducts(product, seller).catch((e)=> errors.push({ name:'ERRDATA', message:e.message }));
                    
                    if(typeof(pro) === 'object'){
                        let pr = await Product.findOrCreate({reference:pro.reference, seller:pro.seller}, pro);
                        result.push(pr);
                        sails.sockets.broadcast(sid, 'product_processed', { errors, result });
                    }

                  }

                  return exits.success(true);
                } catch (error) {
                  sails.sockets.broadcast(sid, 'product_processed', { errors, result });
                  errors.push(errors);
                  return exits.error(error.message);
                }
    }
  };
  
  