module.exports = {
  friendlyName: 'Dashboard logistics',
  description: 'Estadistica del dashboard pestaña logistica',
  inputs: {
    profile: {
      type:'string',
      required: true,
    },
    seller: {
      type:'string',
    },
    dateStart: {
      type: 'number',
      required: true,
    },
    dateEnd: {
      type:'number',
      required: true,
    },
  },
  exits: {
    success: {
      description: 'All done.',
    },
  },
  fn: async function (inputs, exits) {
    let moment = require('moment');
    let totalOrdersCancel = 0;
    let totalOrdersReturned = 0;
    let totalShippingCost = 0;
    let averageHoursLogist = 0;
    let averageHoursCellar = 0;
    let averageHoursClient = 0;
    let orders = [];
    let hoursLogist = [];
    let hoursClient = [];
    let hoursCellar = [];

    if(inputs.profile !== 'superadmin' && inputs.profile !== 'admin'){
      orders = await Order.find({
        seller: inputs.seller,
        createdAt: { '>': inputs.dateStart, '<': inputs.dateEnd }
      }).populate('addressDelivery').populate('currentstatus');
    } else {
      orders = await Order.find({
        createdAt: { '>': inputs.dateStart, '<': inputs.dateEnd }
      }).populate('addressDelivery').populate('currentstatus');
    }

    for(let order of orders){
      if(order.currentstatus.name === 'retornado') {
        totalOrdersReturned += 1;
      }
      if(order.currentstatus.name === 'cancelado') {
        totalOrdersCancel += 1;
      }
      if (order.currentstatus.name !== 'cancelado' && order.currentstatus.name !== 'fallido' && order.currentstatus.name !== 'rechazado') {
        totalShippingCost += parseFloat(order.fleteTotal);
      }
      if (order.currentstatus.name === 'entregado') {
        let states = [];
        let orderHistory = await OrderHistory.find({order: order.id}).populate('state');
        orderHistory.forEach(hist => {
          if (hist.state) {
            states.push({name: hist.state.name, date: hist.createdAt});
          }
        });
        if (states.some(e => e.name === 'aceptado') && states.some(e => e.name === 'empacado')) {
          const history1 = states.find(item => item.name === 'aceptado');
          const history2 = states.find(item => item.name === 'empacado');
          hoursLogist.push(moment(history2.date).diff(moment(history1.date), 'hours'));
        }
        if (states.some(e => e.name === 'enviado') && states.some(e => e.name === 'entregado')) {
          const history1 = states.find(item => item.name === 'enviado');
          const history2 = states.find(item => item.name === 'entregado');
          hoursClient.push(moment(history2.date).diff(moment(history1.date), 'hours'));
        }
        if (states.some(e => e.name === 'aceptado') && states.some(e => e.name === 'enviado')) {
          const history1 = states.find(item => item.name === 'aceptado');
          const history2 = states.find(item => item.name === 'enviado');
          hoursCellar.push(moment(history2.date).diff(moment(history1.date), 'hours'));
        }
      }
    }
    averageHoursLogist = hoursLogist.length > 0 ? (hoursLogist.reduce((a, b) => a + b, 0) / hoursLogist.length).toFixed(2) : 0;
    averageHoursClient = hoursClient.length > 0 ? (hoursClient.reduce((a, b) => a + b, 0) / hoursClient.length).toFixed(2) : 0;
    averageHoursCellar = hoursCellar.length > 0 ? (hoursCellar.reduce((a, b) => a + b, 0) / hoursCellar.length).toFixed(2) : 0;

    return exits.success({
      totalOrdersCancel,
      totalOrdersReturned,
      totalShippingCost,
      averageHoursLogist,
      averageHoursClient,
      averageHoursCellar
    });
  }
};
