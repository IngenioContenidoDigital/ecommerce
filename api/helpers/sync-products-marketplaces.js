module.exports = {
  friendlyName: 'Sync products marketplaces',
  description: 'Para sincronizar el stock a los marketplace.',
  inputs: {
    integration: {
      type:'ref',
      required:true,
    },
    channel:{
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
    const integration = inputs.integration;
    const channel = inputs.channel;
    try {
      let products = await Product.find({seller: integration.seller}).populate('channels');
      products = products.filter(pro => pro.channels.length > 0 && pro.channels[0].iscreated);
      if (products.length > 0) {
        if (channel.name === 'dafiti') {
          let result = await sails.helpers.channel.dafiti.product(products, integration, 0, 'active', false);
          const xml = jsonxml(result, true);
          let sign = await sails.helpers.channel.dafiti.sign(intgrationId, action, seller);
          await sails.helpers.request(integration.channel.endpoint,'/?'+sign,'POST', xml)
          .then(async (resData)=>{
            resData = JSON.parse(resData);
            if(resData.SuccessResponse){
              for (const pro of products) {
                const priceAjust = pro.channels.length > 0 ? pro.channels[0].price : 0;
                await ProductChannel.updateOne({ product: pro.id, integration:integration.id }).set({ status: true, price:priceAjust});
              }
            }else{
              return exits.error(resData.ErrorResponse.Head.ErrorMessage || 'Error en el proceso, Intenta de nuevo más tarde.');
            }
          })
          .catch(err =>{
            return exits.error(err || 'Error en el proceso, Intenta de nuevo más tarde.');
          });
        }
        if (channel.name === 'linio') {
          let result = await sails.helpers.channel.linio.product(products, integration, 0, 'active', false);
          const xml = jsonxml(result, true);
          let sign = await sails.helpers.channel.linio.sign(intgrationId, action, seller);
          await sails.helpers.request(integration.channel.endpoint,'/?'+sign,'POST', xml)
          .then(async (resData)=>{
            resData = JSON.parse(resData);
            if(resData.SuccessResponse){
              for (const pro of products) {
                const priceAjust = pro.channels.length > 0 ? pro.channels[0].price : 0;
                await ProductChannel.updateOne({ product: pro.id, integration:integration.id }).set({ status: true, price:priceAjust});
              }
            }else{
              return exits.error(resData.ErrorResponse.Head.ErrorMessage || 'Error en el proceso, Intenta de nuevo más tarde.');
            }
          })
          .catch(err =>{
            return exits.error(err || 'Error en el proceso, Intenta de nuevo más tarde.');
          });
        }
      } else {
        return exits.error('Sin Productos para Procesar');
      }
    } catch (err) {
      return exits.error(err.message);
    }
    return exits.success();
  }
};
