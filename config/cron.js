module.exports.cron = {
  // ['seconds', 'minutes', 'hours', 'dayOfMonth', 'month', 'dayOfWeek']
  dafitiOrders: {
    schedule: '05 05 * * * *',
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
              parameters= [/*'CreatedBefore='+moment().toISOString(true),'CreatedAfter='+moment().subtract(127,'minutes').toISOString(true),*/'Status='+state,'SortDirection=ASC']
            }else{
              parameters= ['UpdatedBefore='+moment(/*'2020-07-14 23:59:59'*/).toISOString(true),'UpdatedAfter='+moment(/*'2020-07-14 00:00:00'*/).subtract(127,'minutes').toISOString(true),'Status='+state,'SortDirection=ASC']
            }
            await sails.helpers.channel.dafiti.orders(integration.seller,parameters).catch(err =>{
              throw new Error(err);
            });
          });
        }catch(err){
          console.log(err);
        }
      });
    },
    timezone: 'America/Bogota'
  },
  meliOrders:{
    schedule: '05 25 * * * *',
    onTick: async () =>{
      console.log('Iniciando Captura de Ordenes Mercadolibre');
      let integrations = await Integrations.find({channel:'mercadolibre'});
      for(let integration of integrations){
        try{
          await sails.helpers.channel.mercadolibre.orders(integration.seller);
        }catch(err){
          console.log(err);
        };
      }
      console.log('Captura de Ordenes Mercadolibre Finalizada');
    },
    timezone: 'America/Bogota'
  },
  linioOrders:{
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
