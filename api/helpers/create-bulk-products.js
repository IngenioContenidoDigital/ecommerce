module.exports = {
  friendlyName: 'Create bulk products',
  description: 'Proceso de carga de de productos en masa',
  inputs: {
    products:{ type:'json' },
    seller : {type : 'string'},
    socketId : {type : 'string'},
    credentials : {type : 'ref'},	   
    provider : {type : 'string'},	
    asColor : {type : 'boolean', required:false}
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
          let pro = await sails.helpers.checkProducts(product, seller, inputs.asColor || false);

          if(typeof(pro) === 'object'){
            let pr;
            let exists = await Product.findOne({ externalId:pro.externalId, seller:pro.seller, reference : pro.reference});
            if (!exists) {
              pr = await Product.create(pro).fetch();
            } else {
              delete pro.mainCategory;	
              delete pro.categories;
              pr = await Product.updateOne({ id: exists.id }).set(pro);
            }

            try {	
              if(inputs.provider == sails.config.custom.WOOCOMMERCE_CHANNEL && inputs.asColor && product.color && product.color.length > 0 && !product.simple){	
                let product_variables = await sails.helpers.marketplaceswebhooks.findProductGraphql(	
                  inputs.credentials.channel, 	
                  inputs.credentials.pk,	
                  inputs.credentials.sk,	
                  inputs.credentials.url,	
                  inputs.credentials.version,	
                  'PRODUCT_VARIATION_ID', 	
                  product.externalId	
                );	

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
                    } else {	

                      delete pro.mainCategory;	
                      delete pro.categories;

                      pr = await Product.updateOne({ id: exists.id }).set(pro);	
                    }	
                  }	

                }	

                result.push(pr);	
                sails.sockets.broadcast(sid, 'product_processed', { errors, result });	
          }	
            } catch (error) {	
              console.log(error);
              errors.push({ name:'ERRDATA', message:error.message });	
              sails.sockets.broadcast(sid, 'product_processed', { errors, result });	
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

