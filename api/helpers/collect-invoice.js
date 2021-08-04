module.exports = {
  friendlyName: 'Collect Invoice',
  description: 'Hace el cobro de las facturas del mes para un seller.',
  inputs: {
    seller:{
      type: 'ref',
      required:true
    },
    month:{
      type: 'string',
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
    try {
      let invoice = null;
      let state = await sails.helpers.orderState('Aceptado');
      const card = await Token.findOne({user: inputs.seller.id, default: true});
      invoice = await Invoice.findOne({seller: inputs.seller.id, state: state, invoice: `CR-${inputs.month}`});
      if (card) {
        if (!invoice) {
          let data = await sails.helpers.reportSeller(inputs.seller.id, inputs.month);
          paymentInfo = {
            token_card: card.token,
            customer_id: card.customerId,
            doc_type: card.docType,
            doc_number: card.docNumber,
            name: card.name,
            last_name: ' ',
            email: inputs.seller.email,
            bill: `CR-${inputs.month}`,
            description: `Cobro factura ${inputs.month}`,
            value: data.totalBalance,
            tax: ((data.totalBalance/1.19)*0.19).toString(),
            tax_base: (data.totalBalance/1.19).toString(),
            currency: 'COP',
            dues: '1',
            ip:require('ip').address(),
            url_confirmation: 'https://1ecommerce.app/confirmationinvoice',
            method_confirmation: 'POST',
          };
          payment = await sails.helpers.payment.payment({mode:'CC', info:paymentInfo});
          if(payment.success){
            let state = await sails.helpers.orderState(payment.data.estado);
            const resultInvoice = await Invoice.create({
              reference: payment.data.ref_payco,
              invoice: payment.data.factura,
              state: state,
              paymentMethod: payment.data.franquicia,
              total: payment.data.valor,
              tax: payment.data.iva,
              seller: inputs.seller.id
            }).fetch();
            return exits.success({invoice: resultInvoice, error: null});
          } else {
            return exits.success({invoice: null, error: payment.data.description});
          }
        } else {
          return exits.success({invoice, error: null});
        }
      } else {
        return exits.success({invoice: null, error: 'No cuenta con Tarjeta para hacer el cobro'});
      }
    } catch (error) {
      return exits.success({invoice: null, error: error.menssage});
    }
  }
};
