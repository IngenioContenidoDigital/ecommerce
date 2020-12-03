module.exports.cron = {
  // ['seconds', 'minutes', 'hours', 'dayOfMonth', 'month', 'dayOfWeek']
  trackingCoordinadora: {
    schedule: '00 12 */3 * * *',
    onTick: async () => {
      console.log('Iniciando Rastreo de Pedidos');
      let moment = require('moment');
      let statesIds = [];
      let packed= await OrderState.find({
        where:{name:['empacado','enviado']},
        select:['id']
      });
      for(let s of packed){if(!statesIds.includes(s.id)){statesIds.push(s.id);}}
      let orders = await Order.find({
        where:{currentstatus:statesIds,channel:'direct',tracking:{'!=':''}},
        select:['id','tracking']
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
          }
        }
      }
    },
    timezone: 'America/Bogota'
  }
  // meliOrders:{
  //   schedule: '05 25 * * * *',
  //   onTick: async () =>{
  //     console.log('Iniciando Captura de Ordenes Mercadolibre');
  //     let integrations = await Integrations.find({channel:'mercadolibre'});
  //     for(let integration of integrations){
  //       try{
  //         await sails.helpers.channel.mercadolibre.orders(integration.seller);
  //       }catch(err){
  //         console.log(err);
  //       };
  //     }
  //     console.log('Captura de Ordenes Mercadolibre Finalizada');
  //   },
  //   timezone: 'America/Bogota'
  // },
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
