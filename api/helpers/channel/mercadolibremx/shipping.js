module.exports = {
  friendlyName: 'Shipping',
  description: 'Shipping mercadolibre mexico.',
  inputs: {
    order:{
      type:'ref',
      required:true,
    }
  },
  exits: {
    success: {
      description: 'All done.',
    },
  },
  fn: async function (inputs,exits) {
    let integration = await sails.helpers.channel.mercadolibremx.sign(inputs.order.integration);
    try{
      let response = await sails.helpers.channel.mercadolibremx.request('shipment_labels?shipment_ids='+inputs.order.tracking, integration.channel.endpoint,integration.secret, {responseType: 'arraybuffer'});
      if(response){
        return exits.success(response.toString('base64'));
      }
    }catch(err){
      return exits.error('Guia No Localizada');
    }
  }
};
