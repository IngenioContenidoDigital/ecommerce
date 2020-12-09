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
    const meli = require('mercadolibre-nodejs-sdk');
    let integrations = await sails.helpers.channel.mercadolibre.sign(inputs.order.seller);
    
    let mercadolibre = new meli.RestClientApi();
    mercadolibre.resourceGet('shipment_labels', {shipment_ids:inputs.order.tracking,access_token:integrations.secret}, (error, data, response) => {
      if (error) {
        return exits.error(err);
      } else {
        return exits.success(response.toString('base64'));
      }
    });
  }


};

