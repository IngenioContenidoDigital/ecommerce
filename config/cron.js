module.exports.cron = {
  // ['seconds', 'minutes', 'hours', 'dayOfMonth', 'month', 'dayOfWeek']
  meliOrders:{
    schedule: '00 40 */3 * * *',
    onTick: async () =>{
      console.log('Iniciando Captura de Ordenes Mercadolibre');
      let status = await OrderState.findOne({name:'aceptado'});
      let orders = await Order.find({channel:'mercadolibre', currentstatus: status.id});
      for(let order of orders){
        try{
          await sails.helpers.channel.mercadolibre.updateOrders(order);
        }catch(err){
          console.log(err);
        };
      }
      console.log('Captura de Ordenes Mercadolibre Finalizada');
    },
    timezone: 'America/Bogota'
  },
  trackingCoordinadora: {
    schedule: '00 12 */3 * * *',
    onTick: async () => {
      console.log('Iniciando Rastreo de Pedidos');
      let moment = require('moment');
      let statesIds = [];
      let packed= await OrderState.find({
        where:{name:['empacado','enviado','pendiente']},
        select:['id']
      });
      for(let s of packed){if(!statesIds.includes(s.id)){statesIds.push(s.id);}}
      let orders = await Order.find({
        where:{currentstatus:statesIds,channel:'direct',tracking:{'!=':''}},
        select:['id','tracking','seller']
      });
      for(let order of orders){
        let result = await sails.helpers.carrier.coordinadora.tracking(order.tracking);
        if(result){
          let stateupdated = parseInt(moment(result.estado.fecha+' '+result.estado.hora).valueOf());
          let newstatus = await sails.helpers.orderState(result.estado.codigo);
          if(newstatus!==order.currentstatus){
            await Order.updateOne({id:order.id}).set({currentstatus:newstatus,updatedAt:stateupdated});
            await OrderHistory.create({
              order:order.id,
              state:newstatus
            });
            await sails.helpers.notification(order);
          }
        }
      }
    },
    timezone: 'America/Bogota'
  },
  SiesaOrdersStatusChanged: {
    schedule: '50 */20 * * * *',
    onTick: async () => {
      console.log('Iniciando Rastreo de Pedidos Siesa');
      let moment = require('moment');
      let ini = moment().subtract(15,'d').format('YYYYMMDD');
      let end = moment().format('YYYYMMDD');
      let status = 4;
      let oneCommerceStatus = 'Aceptado';

      let orders = await sails.helpers.siesaGetOrders({ini, end, status, oneCommerceStatus});
      if(orders.length > 0){
        let state = await OrderState.findOne({name: 'empacado'});

        for (let index = 0; index < orders.length; index++) {
              const incomingOrder = orders[index];
              let order = await Order.findOne({ reference :  incomingOrder.oc_referencia}).populate('currentstatus');
              
              if(order){
                if(order.currentstatus.id != state.id){
                  let updatedOrder =  await Order.updateOne({reference: incomingOrder.oc_referencia}).set({currentstatus: state.id});
                  await sails.helpers.notification(order);
                  if(!updatedOrder.tracking){
                    await sails.helpers.carrier.shipment(order.id);
                    await OrderHistory.create({order: order.id, state: state.id});
                  }
    
                }
              }
        }
      }
    },
    timezone: 'America/Bogota'
  },  
  /*coppelOrders:{
    schedule: '30 50 * * * *',
    onTick: async () =>{
      await sails.helpers.channel.coppel.qualitycheck();
      let channel = await Channel.findOne({name: 'coppel'});
      let integrations = await Integrations.find({channel: channel.id});
      for(let i=0; i<integrations.length; i++){
        await sails.helpers.channel.coppel.orders(integrations[i].id);
      }
    },
    timezone: 'America/Bogota'
  },*/
  /*linioOrders:{
    schedule: '05 45 * * * *',
    onTick: async () =>{
      console.log('Iniciando Captura de Ordenes Linio');
      let moment = require('moment');
      let integrations = await Integrations.find({channel: 'linio'});
      integrations.forEach(async integration =>{
        try{
          let statuses = ['pending','shipped','delivered','returned','canceled','failed'];
          let parameters=[];
          statuses.forEach(async state =>{
            if(state==='pending'){
              parameters= ['CreatedBefore='+moment().toISOString(true),'CreatedAfter='+moment().subtract(2,'hours').toISOString(true),'Status='+state,'SortDirection=ASC'];
            }else{
              parameters= ['UpdatedBefore='+moment().toISOString(true),'UpdatedAfter='+moment().subtract(2,'hours').toISOString(true),'Status='+state,'SortDirection=ASC'];
            }
            await sails.helpers.channel.linio.orders(integration.seller, parameters);
          });
        }catch(err){
          console.log(err);
        }
      });
    },
    timezone: 'America/Bogota'
  }*/
};
