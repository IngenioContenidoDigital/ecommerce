module.exports = {
  friendlyName: 'Product qc meli',
  description: 'Para cambiar el estado qc de los productos de meli',
  inputs: {
    integration: {
      type:'string',
      required:true
    },
    resource: {
      type: 'string',
      required: true
    },
  },
  exits: {
    success: {
      description: 'All done.',
    },
  },
  fn: async function (inputs, exits) {
    let integration = await sails.helpers.channel.mercadolibre.sign(inputs.integration);
    try{
      let response = await sails.helpers.channel.mercadolibre.request(inputs.resource, integration.channel.endpoint, integration.secret);
      if(response.id){
        if (response.status === 'under_review') {
          await ProductChannel.updateOne({channelid: response.id}).set({
            reason: `Producto Inactivo para revisar ${response.id}, elimine la publicacion, modifique y envie de nuevo.`,
            qc: false,
            status: false
          });
        } else if(response.status === 'paused'){
          await ProductChannel.updateOne({channelid: response.id}).set({
            reason: `El producto ${response.id} fue pausado por falta de stock y será activado automáticamente cuando sea repuesto`,
            qc: true,
            status: false
          });
        } else if(response.status === 'closed') {
          await ProductChannel.updateOne({channelid: response.id}).set({
            reason: `El producto ${response.id} fue cerrado en mercadolibre, elimine la publicacion, modifique y envie de nuevo.`,
            qc: true,
            status: false
          });
        } else {
          await ProductChannel.updateOne({channelid: response.id}).set({
            reason: response.status === 'active' ? '' : `El producto ${response.id} se inactivo en mercadolibre`,
            qc: true,
            status: response.status === 'active' ? true : false
          });
        }
        return exits.success(response);
      }
    }catch(err){
      return exits.error(err.message);
    }
  }
};
