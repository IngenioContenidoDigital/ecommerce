const axios = require('axios');

module.exports = {
    friendlyName: 'Currency converter',
    description: 'Parseador de divisas',
    inputs: {
      from:{
        type:'string',
        required:true
      },
      to:{
        type:'string',
        required:true
      }
    },
    exits: {
      success: {
        description: 'All done.',
      },
      error: {
        description: 'Ocurrio un error al procesar la solicitud.',
      },
    },
    fn: async function (inputs, exits) {
        let response = await axios.get(`https://api.exchangerate.host/convert?from=${inputs.from}&to=${inputs.to}`).catch((e)=>{
            return exits.error(e)
        });

        if(response.data){
            return exits.success(response.data);
        }
    }
  };
  
  