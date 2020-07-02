module.exports.cron = {
  // ['seconds', 'minutes', 'hours', 'dayOfMonth', 'month', 'dayOfWeek']
  dafitiOrders: {
    //schedule: '00 15 * * * *',
    //schedule: '15 32 * * * *',
    /*onTick: async () => {
      console.log('Iniciando Captura de Ordenes Dafiti');
      let moment = require('moment');
      let integrations = await Integrations.find({channel:'dafiti'});
      integrations.forEach(async integration =>{
        try{
          await sails.helpers.channel.dafiti.orders(
            integration.seller,
            ['CreatedBefore='+moment().toISOString(true),'CreatedAfter='+moment().subtract(2,'hours').toISOString(true),'Status=pending','SortDirection=ASC']
          );
        }catch(err){
          console.log(err);
        }
      });
    },
    timezone: 'America/Bogota'*/
  }
};
