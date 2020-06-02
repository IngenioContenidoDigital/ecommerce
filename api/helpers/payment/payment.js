module.exports = {
  /*
     Aceptada
        Franquicia: Visa
        Numero: 4575623182290326
        Fecha Expiración: 12/25
        Cvv: 123
        Estado: Aceptada
        Respuesta: Aceptada

      Fondos insuficientes
        Franquicia: Visa
        Numero: 4151611527583283
        Fecha Expiración: 12/25
        Cvv: 123
        Estado: Rechazada
        Respuesta: Fondos Insuficientes

      Fallida
        Franquicia: Mastercard
        Numero: 5170394490379427
        Fecha Expiración: 12/25
        Cvv: 123
        Estado: Fallida
        Respuesta: Error de comunicación con el centro de autorizaciones

      Pendiente
        Franquicia: American Express
        Numero: 373118856457642
        Fecha Expiración: 12/25
        Cvv: 123
        Estado: Pendiente
        Respuesta: Transacción pendiente por validación
    */
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
    let epayco = null;
    switch(inputs.data.mode){
      case 'CC':
        epayco = await sails.helpers.payment.init('CC');
        epayco.charge.create(inputs.data.info)
                .then(charge => {return exits.success(charge);})
                .catch(err => {return exits.error(err);});
        break;
      case 'PSE':
        epayco = await sails.helpers.payment.init('PSE');
        epayco.bank.create(inputs.data.info)
                .then(bank => {return exits.success(bank);})
                .catch(err => {return exits.error(err);});
        break;
      case 'CS':
        epayco = await sails.helpers.payment.init('CS');
        epayco.cash.create(inputs.data.method.toLowerCase().trim(), inputs.data.info)
        .then(cash => {return exits.success(cash);})
        .catch(err => {return exits.error(err);});
        break;
    }
    /* Respuesta de Pago CASH
    {
      success: true,
      title_response: 'SUCCESS',
      text_response: 'Transacción y pin generados exitosamente',
      last_action: 'Crear pin efecty',
      data: {
        ref_payco: 20104100,
        factura: 'CR-17',
        descripcion: 'pay test',
        valor: 115000.01,
        iva: 18361.35,
        baseiva: 96638.66,
        moneda: 'COP',
        banco: 'Efecty',
        estado: 'Pendiente',
        respuesta: 'Esperando pago del cliente en punto de servicio Efecty',
        autorizacion: '000000',
        recibo: 48771609056634,
        fecha: '2020-05-08 10:42:13',
        franquicia: 'EF',
        cod_respuesta: 3,
        ip: '172.13.12.94',
        tipo_doc: 'CC',
        documento: '80826369',
        nombres: 'Usuario 100',
        apellidos: '.',
        email: 'usuario100@usuarios.com',
        enpruebas: 1,
        ciudad: '',
        direccion: 'N/A',
        ind_pais: null,
        pin: 20104100,
        codigoproyecto: 110571,
        fechapago: '2020-05-08 10:42:13',
        fechaexpiracion: '2020-05-11 23:59:59',
        factor_conversion: 3924.54,
        valor_pesos: '115000.01'
      }
    }
    Respuesta Pago TC
    {
  status: true,
  success: true,
  type: 'Create payment',
  data: {
    ref_payco: 20116424,
    factura: 'CR-29',
    descripcion: 'Test Payment',
    valor: '115000.01',
    iva: '18361.346134453783',
    baseiva: 96638.66,
    moneda: 'COP',
    banco: 'Banco de Pruebas',
    estado: 'Aceptada',
    respuesta: 'Aprobada',
    autorizacion: '000000',
    recibo: 20116424,
    fecha: '2020-05-08 12:28:55',
    franquicia: 'VS',
    cod_respuesta: 1,
    ip: '192.168.0.112',
    tipo_doc: 'CC',
    documento: '74856987',
    nombres: 'PRUEBA PAGOS',
    apellidos: '',
    email: 'usuario100@usuarios.com',
    enpruebas: 1,
    ciudad: 'duitama',
    direccion: 'CRA 17 18 -55 CRA 17 18 -55',
    ind_pais: ''
  },
  object: 'payment'
}
    */
  }

};

