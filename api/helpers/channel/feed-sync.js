module.exports = {
  friendlyName: 'Feed sync',
  description: 'Para recibir el estado de un feed en dafiti y linio.',
  inputs: {
    integration: {
      type:'ref',
      required:true,
    },
    feed:{
      type:'string',
      required:true
    }
  },
  exits: {
    success: {
      description: 'All done.',
    },
    error:{
      description: 'Error'
    },
  },
  fn: async function (inputs,exits) {
    let integration = inputs.integration;
    let sign = integration.channel.name === 'dafiti' ? await sails.helpers.channel.dafiti.sign(integration.id, 'FeedStatus', integration.seller.id, ['FeedID='+inputs.feed]) : await sails.helpers.channel.linio.sign(integration.id, 'FeedStatus', integration.seller.id, ['FeedID='+inputs.feed]);
    await sails.helpers.request(integration.channel.endpoint,'/?'+sign,'GET')
    .then(async (resData)=>{
      const responseData = JSON.parse(resData);
      if (responseData.SuccessResponse && responseData.SuccessResponse.Body.FeedDetail.FeedErrors) {
        const errors = responseData.SuccessResponse.Body.FeedDetail.FeedErrors.Error;
        let resultErrors = [];
        if (typeof(errors) === 'object') {
          const productVariation = await ProductVariation.findOne({id: errors.SellerSku}).populate('product');
          const msg = errors.Message.split(' | ')[0];
          if (productVariation) {
            const product = productVariation.product.id;
            const ref = productVariation.product.reference;
            if(!resultErrors.some(e => e.product === product)){
              resultErrors.push({product: product, reference: ref, message: msg});
            } else {
              resultErrors = resultErrors.map(err => {
                if (err.product === product && !err.message.includes(msg)) {
                  err.message = err.message + ' | ' + msg;
                }
                return err;
              });
            }
          }
        } else {
          for (const error of errors) {
            const productVariation = await ProductVariation.findOne({id: error.SellerSku}).populate('product');
            const msg = error.Message.split(' | ')[0];
            if (productVariation) {
              const product = productVariation.product.id;
              const ref = productVariation.product.reference;
              if(!resultErrors.some(e => e.product === product)){
                resultErrors.push({product: product, reference: ref, message: msg});
              } else {
                resultErrors = resultErrors.map(err => {
                  if (err.product === product && !err.message.includes(msg)) {
                    err.message = err.message + ' | ' + msg;
                  }
                  return err;
                });
              }
            }
          }
        }

        let product;
        for (const error of resultErrors) {
          product = await Product.findOne({id: error.product}).populate('channels',{integration: integration.id});
          const reason = resultErrors.find(err => err.product === product.id);
          const productChannelId = product.channels.length > 0 ? product.channels[0].id : '';
          await ProductChannel.updateOne({id: productChannelId}).set({
            reason: reason.message
          });
        }
        if (product && product.channels[0].socketid) {
          sails.sockets.broadcast(product.channels[0].socketid, 'reponse_product_created', {errors: resultErrors, integration: integration.id});
        }
      }
      return exits.success();
    }).catch(err =>{
      console.log(err);
      return exits.error(err.message);
    });
  }
};
