module.exports = {
    friendlyName: 'Label',
    description: 'Obtener Rótulo de Despacho',
    inputs: {
      tracking:{
        type:'string',
        required:true
      }
    },
    exits: {
      success: {
        description: 'All done.',
      },
    },
    fn: async function (inputs,exits) {
        console.log(inputs);
    }
  };
  
  