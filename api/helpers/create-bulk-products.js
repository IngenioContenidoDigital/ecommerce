module.exports = {
  friendlyName: 'Create bulk products',
  description: 'Proceso de carga de de productos en masa',
  inputs: {
    products:{ type:'json' },
    seller : {type : 'string'},
    socketId : {type : 'string'},
    credentials : {type : 'ref'},
    provider : {type : 'string'}
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
            const query1 = {externalId: pro.externalId, seller:seller};
            const query2 = {reference: pro.reference, seller:seller};
            let exists = await Product.findOne({or: [query1, query2]});
            let validateProduct = await sails.helpers.validatePlanProducts(seller);
            if (!validateProduct) {
              errors.push({ name:'ERRDATA', message: 'Superaste el máximo de productos, sube de nivel tu plan.' });
              sails.sockets.broadcast(sid, 'product_processed', { errors, result });
              return exits.success('finish');
            }
            if (!exists) {
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
      errors.push({name:'ERRDATA', message:error.message});
      sails.sockets.broadcast(sid, 'product_processed', { errors, result });
      return exits.error(error.message);
    }
  }
};

