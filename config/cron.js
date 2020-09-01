module.exports.cron = {
  // ['seconds', 'minutes', 'hours', 'dayOfMonth', 'month', 'dayOfWeek']
  dafitiOrders: {
    schedule: '00 15 * * * *',
    onTick: async () => {
      console.log('Iniciando Captura de Ordenes Dafiti');
      let moment = require('moment');
      let integrations = await Integrations.find({channel:'dafiti'});
      integrations.forEach(async integration =>{
        try{
          let statuses = ['pending','shipped','delivered','returned','canceled','failed'];
          let parameters=[];
          statuses.forEach(async state =>{
            if(state==='pending'){
              parameters= ['CreatedBefore='+moment().toISOString(true),'CreatedAfter='+moment().subtract(2,'hours').toISOString(true),'Status='+state,'SortDirection=ASC']
            }else{
              parameters= ['UpdatedBefore='+moment(/*'2020-07-14 23:59:59'*/).toISOString(true),'UpdatedAfter='+moment(/*'2020-07-14 00:00:00'*/).subtract(2,'hours').toISOString(true),'Status='+state,'SortDirection=ASC']
            }
            await sails.helpers.channel.dafiti.orders(integration.seller,parameters);
          });
        }catch(err){
          console.log(err);
        }
      });
    },
    timezone: 'America/Bogota'
  },
  meliOrders:{
    schedule: '00 50 * * * *',
    onTick: async () =>{
      console.log('Iniciando Captura de Ordenes Mercadolibre');
      let moment = require('moment');
      let integrations = await Integrations.find({channel:'mercadolibre'});
      integrations.forEach(async integration =>{
        try{
          let statuses = ['paid'/*,'ready_to_ship'*/,'shipped','delivered','cancelled'];
          statuses.forEach(async state =>{
            let parameters={};
            parameters['order.status']=state;
            if(state==='paid'){
              parameters['order.date_created.from']=moment(/*'2020-08-01 00:00:00'*/).subtract(6,'hours').toISOString(true);
              parameters['order.date_created.to']=moment(/*'2020-08-10 23:59:59'*/).toISOString(true);
            }else{
              parameters['order.date_last_updated.from']=moment().subtract(2,'hours').toISOString(true);
              parameters['order.date_last_updated.to']=moment().toISOString(true);
            }
            await sails.helpers.channel.mercadolibre.orders(integration.seller,parameters);
          });
        }catch(err){
          console.log(err);
        }
      });
    },
    timezone: 'America/Bogota'
  },
  linioOrders:{
    schedule: '00 35 * * * *',
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
              parameters= ['UpdatedBefore='+moment(/*'2020-07-14 23:59:59'*/).toISOString(true),'UpdatedAfter='+moment(/*'2020-07-14 00:00:00'*/).subtract(2,'hours').toISOString(true),'Status='+state,'SortDirection=ASC'];
            }
            await sails.helpers.channel.linio.orders(integration.seller, parameters);
          });
        }catch(err){
          console.log(err);
        }
      });
    },
    timezone: 'America/Bogota'
  }
};
