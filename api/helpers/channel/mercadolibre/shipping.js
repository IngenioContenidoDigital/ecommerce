module.exports = {
  friendlyName: 'Shipping',
  description: 'Shipping mercadolibre.',
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
    let mercadolibre = await sails.helpers.channel.mercadolibre.sign(inputs.order.seller);
    let integrations = await Integrations.findOne({channel:'mercadolibre',seller:inputs.order.seller});
    mercadolibre.get('shipment_labels',{shipment_ids:inputs.order.tracking,access_token:integrations.secret},(err,response)=>{
      if(err){console.log(err); return exits.error(err);}
      return exits.success(response.toString('base64'));
    })
  }


};

