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
    let integration = await sails.helpers.channel.mercadolibremx.sign(inputs.integration);
    try{
      let response = await sails.helpers.channel.mercadolibremx.request(inputs.resource, integration.channel.endpoint, integration.secret);
      if(response.id){
        if (response.status === 'under_review') {
          await ProductChannel.updateOne({channelid: response.id}).set({
            reason: 'Se debe corregir la infracción reportada en Mercadolibre',
            qc: false,
            status: false
          });
        } else {
          await ProductChannel.updateOne({channelid: response.id}).set({
            reason: '',
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
