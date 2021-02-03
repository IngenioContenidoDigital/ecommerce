module.exports = {
  friendlyName: 'Update idCargue',
  description: 'Se actualiza idCargue a un pedido en SIESA.',
  inputs: {
    orderRef:{
      type: 'string',
      required: true
    },
    orderState: {
      type: 'string',
      required: true
    }
  },
  exits: {
    success: {
      description: 'All done.',
    },
  },
  fn: async function (inputs, exits) {
    const sql = require('mssql');
    var config = {
      user: '1ecomm',
      password: '1Ec099p32$',
      server: '190.0.46.6',
      database: 'unoEcommerce_Produccion',
      options: {
        'encrypt': false,
        'enableArithAbort': false
      },
      port: 14998,
      requestTimeout: 300000
    };
    try {
      let connection = await sql.connect(config);
      await connection.request()
        .input('idCargue', sql.VarChar(50), inputs.orderState)
        .input('referenciaVtex', sql.VarChar(50), inputs.orderRef)
        .execute('sp_ActualizarCargue');
      return exits.success(true);
    } catch (error) {
      return exits.error(error);
    }
  }
};
