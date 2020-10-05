module.exports = {
  friendlyName: 'Find orders',
  description: '',
  inputs: {
    meli:{
      type:'ref',
      required:true,
    },
    params:{
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
    inputs.meli.get('orders/search/',inputs.params, async (err, result) => {
      if(err){throw new Error(err.message);}
      return exits.success(result);
    });
  }
};

