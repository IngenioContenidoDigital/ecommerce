module.exports = {
  friendlyName: 'Collect Invoice',
  description: 'Hace el cobro de las facturas del mes para un seller.',
  inputs: {
    seller:{
      type: 'ref',
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
  fn: async function (inputs, exits) {
    const moment = require('moment');
    try {
      let currentDay =  moment().format('DD');
      if (currentDay == 5) {
        let month = moment().subtract(1, 'months').locale('es').format('MMMM YYYY');
        let state = await sails.helpers.orderState('Aceptado');
        const card = await Token.findOne({user: inputs.seller.id, default: true});
        const invoice = await Invoice.findOne({seller: inputs.seller.id, state: state, invoice: `CR-${month}`});
        if (card && !invoice) {
          let data = await sails.helpers.reportSeller(inputs.seller.id, month);
          paymentInfo = {
            token_card: card.token,
            customer_id: card.customerId,
            doc_type: card.docType,
            doc_number: card.docNumber,
            name: card.name,
            last_name: ' ',
            email: inputs.seller.email,
            bill: `CR-${month}`,
            description: `Cobro factura ${month}`,
            value: data.totalBalance,
            tax: ((data.totalBalance/1.19)*0.19).toString(),
            tax_base: (data.totalBalance/1.19).toString(),
            currency: 'COP',
            dues: '1',
            ip:require('ip').address(),
            url_confirmation: 'http://localhost:1337/confirmationinvoice',
            method_confirmation: 'POST',
          };
          payment = await sails.helpers.payment.payment({mode:'CC', info:paymentInfo});
          if(payment.success){
            let state = await sails.helpers.orderState(payment.data.estado);
            await Invoice.create({
              reference: payment.data.ref_payco,
              invoice: payment.data.factura,
              state: state,
              paymentMethod: payment.data.franquicia,
              total: payment.data.valor,
              tax: payment.data.iva,
              seller: inputs.seller.id
            }).fetch();
          }
        }
        return exits.success(true);
      }
    } catch (error) {
      return exits.error(error.menssage);
    }
  }
};
