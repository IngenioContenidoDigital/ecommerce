module.exports = {
  friendlyName: 'Create invoice',
  description: 'Create invoice SIIGO',
  inputs: {
    dniSeller:{
      type: 'string',
      required:true
    },
    invoice:{
      type: 'ref',
      required:true
    }
  },
  exits: {
    success: {
      description: 'All done.',
    },
    error: {
      description: 'All done.',
    },
  },
  fn: async function (inputs, exits) {
    let axios = require('axios');
    let moment = require('moment');
    let seller = await Seller.findOne({dni: inputs.dniSeller});
    let invoice = inputs.invoice;
    try {
      let accessToken = await sails.helpers.siigo.init();

      let data = {
        'document': {
          'id': 28794
        },
        'date': moment().format('YYYY-MM-DD'),
        'customer': {
          'person_type': 'Company',
          'id_type': '31',
          'identification': seller.dni,
          'branch_office': 0
        },
        'seller': 1150,
        'stamp': { 'send': true },
        'observations': invoice.observations,
        'items': [
          {
            'code': invoice.code,
            'description': invoice.description,
            'quantity': 1,
            'price': invoice.priceItem,
            'discount': 0.0,
            'taxes': [
              {
                'id': 17817
              },
              {
                'id': 17822
              }
            ]
          }
        ],
        'payments': [
          {
            'id': 8762,
            'value': parseFloat(invoice.total),
            'due_date': moment().format('YYYY-MM-DD')
          }
        ]
      };

      let options = {
        method: 'post',
        url: 'https://api.siigo.com/v1/invoices',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        data: data
      };
      let result = await axios(options);
      if (result.data && result.data.id) {
        await Invoice.updateOne({id: invoice.idInvoice}).set({idSiigo: result.data.id});
      }
      return exits.success();
    } catch (error) {
      console.log(error);
      return exits.success();
    }
  }
};
