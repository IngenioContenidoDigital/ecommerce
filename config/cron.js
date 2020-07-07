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
          statuses.forEach(async state =>{
            await sails.helpers.channel.dafiti.orders(
              integration.seller,
              ['CreatedBefore='+moment().toISOString(true),'CreatedAfter='+moment().subtract(2,'hours').toISOString(true),'Status='+state,'SortDirection=ASC']
            );
          });
        }catch(err){
          console.log(err);
        }
      });
    },
    timezone: 'America/Bogota'
  }
};
