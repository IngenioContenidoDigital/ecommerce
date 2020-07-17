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
          let statuses = [/*'pending'*/,'shipped','delivered','returned','canceled','failed'];
          let parameters=[];
          statuses.forEach(async state =>{
            if(state==='pending'){
              parameters= ['CreatedBefore='+moment().toISOString(true),'CreatedAfter='+moment().subtract(2,'hours').toISOString(true),'Status='+state,'SortDirection=ASC']
            }else{
              parameters= ['UpdatedBefore='+moment('2020-07-14 23:59:59').toISOString(true),'UpdatedAfter='+moment('2020-07-14 00:00:00').subtract(2,'hours').toISOString(true),'Status='+state,'SortDirection=ASC']
            }
            await sails.helpers.channel.dafiti.orders(integration.seller,parameters);
          });
        }catch(err){
          console.log(err);
        }
      });
    },
    timezone: 'America/Bogota'
  }
};
