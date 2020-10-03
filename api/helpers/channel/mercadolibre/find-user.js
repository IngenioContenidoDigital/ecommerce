module.exports = {
  friendlyName: 'Find user',
  description: 'Find Mercadolibre Logged In Usr',
  inputs: {
    meli:{
      type:'ref',
      required:true,
    },
    token:{
      type:'string',
      required:true,
    }
  },
  exits: {
    success: {
      description: 'All done.',
    },
  },
  fn: async function (inputs,exits) {
    inputs.meli.get('users/me',{access_token:inputs.token},async (err, result) =>{
      if(err){throw new Error(err.message);}
      return exits.success(result);
    });
  }
};

