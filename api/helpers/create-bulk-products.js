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
    const _ = require('lodash');
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
            let exists = await Product.findOne({ externalId:pro.externalId, seller:seller, reference : pro.reference});
            if (!exists) {
              if(inputs.provider != sails.config.custom.WOOCOMMERCE_CHANNEL){
                pr = await Product.create(pro).fetch();
                if (inputs.provider === sails.config.custom.MERCADOLIBRE_CHANNEL) {
                  const channel = await Channel.findOne({name: 'mercadolibre'});
                  const integration = await Integrations.findOne({seller: pro.seller, channel: channel.id});
                  await ProductChannel.create({
                    product: pr.id,
                    channel: integration.channel,
                    integration: integration.id,
                    channelid: pro.externalId,
                    status: true,
                    qc: true,
                    iscreated: true,
                    price: 0,
                    reason: ''
                  });
                }
              }else if(product.simple && (product.color && product.color.length == 1)){
                pr = await Product.create(pro).fetch();
              }else if(!product.simple && (product.color && product.color.length == 1)){
                pr = await Product.create(pro).fetch();
              }
            } else {
              delete pro.mainCategory;
              delete pro.categories;
              delete pro.gender;
              delete pro.mainColor;
              delete pro.manufacturer;
              delete pro.tax;
              delete pro.seller;
              pr = await Product.updateOne({ id: exists.id }).set(pro);
            }
            try {
              if(inputs.provider == sails.config.custom.WOOCOMMERCE_CHANNEL && inputs.asColor && product.color && product.color.length > 1 && !product.simple){
                let product_variables = await sails.helpers.marketplaceswebhooks.findProductGraphql(
                  inputs.credentials.channel,
                  inputs.credentials.pk,
                  inputs.credentials.sk,
                  inputs.credentials.url,
                  inputs.credentials.version,
                  'PRODUCT_VARIATION_ID',
                  product.externalId
                );

                let parent_category;

                if(product_variables && product_variables.data){
                  let db_color;
                  products_colors = _.uniqBy(product_variables.data.filter((p)=>p.color && p.color[0]), p=>p.color[0]);
                  if(products_colors.length > 0){
                    for (let index = 0; index < products_colors.length; index++) {
                      const product_variable = products_colors[index];

                      if(product_variable.color && product.color.length > 0){

                        let color = await sails.helpers.tools.findColor(`${product_variable.color[0]}`);

                        if(color && color.length > 0){
                          db_color = await Color.findOne({id : color[0]});
                        }

                        if(db_color){
                          pro.mainColor = db_color.id;
                          pro.reference = `${product_variable.reference}-${db_color.name}`.toUpperCase();
                        }else{
                          throw new Error(`Ref: ${pro.reference} : ${pro.name} sin color`);
                        }

                        pro.externalId = product_variable.externalId;

                        if(parent_category){
                          pro.categories =  parent_category;
                        }

                        let exists = await Product.findOne({ externalId:product_variable.externalId, seller:seller, reference : pro.reference });

                        if (!exists) {
                          parent_category = pro.categories;
                          pr = await Product.create(pro).fetch();
                        } else {

                          delete pro.mainCategory;
                          delete pro.categories;
                          delete pro.gender;
                          delete pro.mainColor;
                          delete pro.manufacturer;
                          delete pro.tax;
                          delete pro.seller;

                          pr = await Product.updateOne({ id: exists.id }).set(pro);
                        }

                        delete db_color;

                      }
                    }

                    if(typeof(pr) === 'object'){
                      result.push(pr);
                      sails.sockets.broadcast(sid, 'product_processed', { errors, result });
                    }
                  }
                }
              }
            } catch (error) {
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

