module.exports = {

  friendlyName: 'Order state',
  description: 'Obtener el OrderState correspondiente a partir de la respuesta de la pasarela de pago.',
  inputs: {
    state:{
      type:'string'
    }
  },
  exits: {
    success: {
      description: 'All done.',
    },
  },
  fn: async function (inputs,exits) {
    let name=null;
    switch(inputs.state){
      case 'Aceptada':
        name='aceptado';
        break;
      case 'Aceptado':
        name='aceptado';
        break;
      case 'Rechazada':
        name='rechazado';
        break;
      case 'Pendiente':
        name='pendiente';
        break;
      case 'Fallida':
        name='fallido';
        break;
      case 'ready_to_ship':
        name='empacado';
        break;
      case 'shipped':
        name='enviado';
        break;
      case 'delivered':
        name='entregado';
        break;
      case 'returned':
        name='retornado';
        break;
      case 'canceled':
        name='cancelado';
        break;
      case 'failed':
        name='fallido';
        break;
      case 'paid':
        name='aceptado';
        break;
      case 'cancelled':
        name='cancelado';
        break;
      case 'invalid':
        name='fallido';
        break;
      default:
        name='pendiente';
        break;
    }
    let orderstate = await OrderState.findOne({name:name});
    return exits.success(orderstate.id);
  }

};

