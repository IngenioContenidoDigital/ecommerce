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
            reason: 'Producto Inactivo para revisar, elimine el producto en el marketplace, modifique y envie de nuevo.',
            qc: false,
            status: false
          });
        } else {
          await ProductChannel.updateOne({channelid: response.id}).set({
            reason: response.status === 'active' ? '' : 'El producto se inactivo en mercadolbre, verificar en el marketplace',
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
