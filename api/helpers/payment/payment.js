module.exports = {
  friendlyName: 'Payment',
  description: 'Payment payment.',
  inputs: {
    data:{
      type:'ref',
      required:true,
    }
  },
  exits: {
    success: {
      description: 'All done.',
    },
  },
  fn: async function (inputs, exits) {

    const epayco = await sails.helpers.payment.init();
    switch(inputs.data.mode){
      case 'CC':
        epayco.charge.create(inputs.data.info)
                .then(charge => {return exits.success(charge);})
                .catch(err => {return exits.error(err);});
        break;
      case 'PSE':
        epayco.bank.create(inputs.data.info)
                .then(bank => {return exits.success(bank);})
                .catch(err => {return exits.error(err);});
        break;
      case 'CS':
        epayco.cash.create(inputs.data.method.toLowerCase().trim(), inputs.data.info)
        .then(cash => {console.log(cash); return exits.success(cash);})
        .catch(err => {console.log(err); return exits.error(err);});
        break;
    }
  }

};

