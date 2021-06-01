module.exports = {
  friendlyName: 'Update shipment',
  description: 'Update shipment',
  inputs: {
    integration: {
      type:'string',
      required:true
    },
    payment: {type: 'ref', required: true}
  },
  exits: {
    success: {
      description: 'All done.',
    },
  },
  fn: async function (inputs, exits) {
    const moment = require('moment');
    let integration = await sails.helpers.channel.mercadolibre.sign(inputs.integration);
    let status = await OrderState.findOne({id: inputs.payment.status});
    try{
      let response = null;
      if (inputs.payment.mode === 'custom') {
        let body = status.name === 'empacado' ?
        {
          'tracking_number': inputs.payment.tracking,
          'receiver_id': inputs.payment.receiverId
        } : status.name === 'enviado' ?
        {
          'speed': 120,
          'status':'shipped',
          'tracking_number': inputs.payment.tracking,
          'receiver_id': inputs.payment.receiverId
        } : status.name === 'entregado' ?
        {
          'status':'delivered',
          'receiver_id': inputs.payment.receiverId
        } : {};
        response = await sails.helpers.channel.mercadolibre.request(`/shipments/${inputs.payment.shipping}`, integration.channel.endpoint, integration.secret,body,'PUT');
      } else {
        let url = status.name === 'empacado' ? `/shipments/${inputs.payment.shipping}` : `https://api.mercadolibre.com/shipments/${inputs.payment.shipping}/seller_notifications`;
        let body = status.name === 'empacado' ?
        {
          'service_id': inputs.payment.receiverId,
          'tracking_number': inputs.payment.tracking
        } : status.name === 'enviado' ?
        {
          'payload': {
            'comment': 'despachado',
            'date': moment().toISOString(true)
          },
          'status': 'shipped',
          'substatus': 'null'
        } : status.name === 'entregado' ?
        {
          'payload': {
            'comment': 'Pedido entreguado',
            'date': moment().toISOString(true)
          },
          'status': 'delivered',
          'substatus': 'null'
        } : {};
        response = await sails.helpers.channel.mercadolibre.request(url, integration.channel.endpoint, integration.secret,body,'PUT');
      }
      return exits.success(response);
    }catch(err){
      console.log(err);
      return exits.error(err.message);
    }
  }
};
