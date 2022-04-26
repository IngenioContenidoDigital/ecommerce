module.exports = {
  friendlyName: 'Product sync',
  description: 'Para cambiar el estado qc de los productos de dafiti y linio',
  inputs: {
    integration: {
      type:'ref',
      required:true,
    },
    skus:{
      type:'ref',
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
    try {
      let sellerSkus = inputs.skus;
      let integration = inputs.integration;
      let listproducts = [];
      for (const sku of sellerSkus) {
        const productVariation = await ProductVariation.findOne({id: sku});
        if (productVariation) {
          if(!listproducts.includes(productVariation.product)){
            listproducts.push(productVariation.product);
          }
        }
      }
      let sign = integration.channel.name === 'dafiti' ? await sails.helpers.channel.dafiti.sign(integration.id, 'GetQcStatus', integration.seller.id, ['SkuSellerList='+JSON.stringify(sellerSkus)]) :
      await sails.helpers.channel.linio.sign(integration.id, 'GetQcStatus', integration.seller.id, ['SkuSellerList='+JSON.stringify(sellerSkus)]);
      await sails.helpers.request(integration.channel.endpoint,'/?'+sign,'GET').then(async (resData)=>{
        resData = JSON.parse(resData);
        if (resData.SuccessResponse.Body.Status) {
          const status = resData.SuccessResponse.Body.Status.State;
          let resultProducts = [];
          if(Object.prototype.toString.call(status) === '[object Array]') {
            for (const state of status) {
              const productVariation = await ProductVariation.findOne({id: state.SellerSKU}).populate('product');
              if (productVariation) {
                const product = productVariation.product.id;
                const ref = productVariation.product.reference;
                if(!resultProducts.some(e => e.product === product)){
                  resultProducts.push({product: product, status: state.Status, reference: ref, message: state.Reason || ''});
                }
              }
            }
          } else {
            const productVariation = await ProductVariation.findOne({id: status.SellerSKU}).populate('product');
            if (productVariation) {
              const product = productVariation.product.id;
              const ref = productVariation.product.reference;
              if(!resultProducts.some(e => e.product === product)){
                resultProducts.push({product: product, status: status.Status, reference: ref, message: status.Reason || ''});
              }
            }
          }
          for (const prod of resultProducts) {
            const product = await Product.findOne({id: prod.product}).populate('channels',{integration: integration.id});
            const productChannelId = product.channels.length > 0 ? product.channels[0].id : '';
            if (prod.status === 'rejected') {
              if (prod.message === 'Images Missing: Automatically rejected') {
                let imgresult = integration.channel.name === 'dafiti' ? await sails.helpers.channel.dafiti.images([product], integration.id) : await sails.helpers.channel.linio.images([product], integration.id);
                const imgxml = jsonxml(imgresult,true);
                let imgsign = integration.channel.name === 'dafiti' ? await sails.helpers.channel.dafiti.sign(integration.id, 'Image', product.seller) : await sails.helpers.channel.linio.sign(integration.id, 'Image', product.seller);
                await sails.helpers.request(integration.channel.endpoint,'/?'+imgsign,'POST',imgxml);
              }
              await ProductChannel.updateOne({id: productChannelId}).set({
                reason: prod.message,
                qc: false,
                status: false
              });
            } else if(prod.status === 'approved'){
              await ProductChannel.updateOne({id: productChannelId}).set({
                reason: '',
                qc: true,
                status: true
              });
            }
          }
          return exits.success();
        }
      });
    } catch (error) {
      console.log(error);
      return exits.error(error.message);

    }

    //     console.log(listProducts);
    //     // for (const prod of listProducts) {
    //     //   const product = await Product.findOne({id: prod.product}).populate('channels',{integration: integration.id});
    //     //   const productChannelId = product.channels.length > 0 ? product.channels[0].id : '';
    //     //   if (prod.status === 'rejected') {
    //     //     if (prod.message === 'Images Missing: Automatically rejected') {
    //     //       let imgresult = integration.channel.name === 'dafiti' ? await sails.helpers.channel.dafiti.images([product], integration.id) : await sails.helpers.channel.linio.images([product], integration.id);
    //     //       const imgxml = jsonxml(imgresult,true);
    //     //       let imgsign = integration.channel.name === 'dafiti' ? await sails.helpers.channel.dafiti.sign(integration.id, 'Image', product.seller) : await sails.helpers.channel.linio.sign(integration.id, 'Image', product.seller);
    //     //       await sails.helpers.request(integration.channel.endpoint,'/?'+imgsign,'POST',imgxml);
    //     //     }
    //     //     await ProductChannel.updateOne({id: productChannelId}).set({
    //     //       reason: prod.message,
    //     //       qc: false,
    //     //       status: false
    //     //     });
    //     //   } else if(prod.status === 'approved'){
    //     //     await ProductChannel.updateOne({id: productChannelId}).set({
    //     //       reason: '',
    //     //       qc: true,
    //     //       status: true
    //     //     });
    //     //   }
    //     // }
    //   }
    // }).catch(err =>{
    //   console.log(err);
    //   return exits.error(err.message);
    // });
  }
};
