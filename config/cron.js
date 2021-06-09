module.exports.cron = {
  // ['seconds', 'minutes', 'hours', 'dayOfMonth', 'month', 'dayOfWeek']
  /*meliOrders:{
    schedule: '00 40 * * * *',
    onTick: async () =>{
      console.log('Iniciando Captura de Ordenes Mercadolibre');
      let status = await OrderState.findOne({name:'aceptado'});
      let orders = await Order.find({channel:'mercadolibre', currentstatus: status.id});
      for(let order of orders){
        try{
          await sails.helpers.channel.mercadolibre.updateOrders(order);
        }catch(err){
          console.log(err);
        }
      }
      console.log('Captura de Ordenes Mercadolibre Finalizada');
    },
    timezone: 'America/Bogota'
  },*/
  trackingCoordinadora: {
    schedule: '02 12 */3 * * *',
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
        where:{currentstatus:statesIds,channel:['direct','mercadolibre'],tracking:{'!=':''}},
        select:['id','tracking','seller','channel', 'transport', 'shippingMeli', 'receiverId', 'modeMeli']
      }).populate('currentstatus');
      for(let order of orders){
        if (order.channel === 'direct' || (order.channel === 'mercadolibre' && order.transport === 'coordinadora')) {
          let result = await sails.helpers.carrier.coordinadora.tracking(order.tracking);
          if(result){
            let stateupdated = parseInt(moment(result.estado.fecha+' '+result.estado.hora).valueOf());
            let newstatus = await sails.helpers.orderState(result.estado.codigo);
            await sails.helpers.notification(order, newstatus);
            if(newstatus!==order.currentstatus.id){
              await Order.updateOne({id:order.id}).set({currentstatus:newstatus,updatedAt:stateupdated});
              let oitems = await OrderItem.find({order:order.id});
              for(let it of oitems){
                await OrderItem.updateOne({id: it.id}).set({currentstatus: newstatus});
              }
              await OrderHistory.create({
                order:order.id,
                state:newstatus
              });
              if (order.modeMeli === 'custom') {
                const payment = {
                  shipping: order.shippingMeli,
                  status: newstatus,
                  mode: 'custom',
                  receiverId: order.receiverId,
                  tracking: order.tracking
                };
                await sails.helpers.channel.mercadolibre.updateShipment(order.integration, payment);
              } else if (order.modeMeli === 'me1') {
                const payment = {
                  shipping: order.shippingMeli,
                  status: newstatus,
                  mode: 'me1',
                  receiverId: order.receiverId,
                  tracking: order.tracking
                };
                await sails.helpers.channel.mercadolibre.updateShipment(order.integration, payment);
              }
            }
          }
        }
      }
      console.log('Finalizada Rastreo');
    },
    timezone: 'America/Bogota'
  },
  SiesaOrdersStatusChanged: {
    schedule: '50 */20 * * * *',
    onTick: async () => {
      console.log('Iniciando Rastreo de Pedidos Siesa');
      try {
        let moment = require('moment');
        let ini = moment().subtract(15,'d').format('YYYYMMDD');
        let end = moment().format('YYYYMMDD');
        let status = 4;
        let oneCommerceStatus = 'Aceptado';

        let orders = await sails.helpers.siesaGetOrders({ini, end, status, oneCommerceStatus}).catch(e=>{
          console.log('Error recuperando las ordenens de siesas details : ',  e.message);
        });

        if(orders && orders.length > 0){
          let state = await OrderState.findOne({name: 'empacado'});

          for (let index = 0; index < orders.length; index++) {
            const incomingOrder = orders[index];
            let order = await Order.findOne({ reference :  incomingOrder.oc_referencia}).populate('currentstatus');

            if(order){
              if(order.currentstatus.id != state.id){
                let updatedOrder =  await Order.updateOne({reference: incomingOrder.oc_referencia}).set({currentstatus: state.id});
                let oitems = await OrderItem.find({order:order.id});
                for(let it of oitems){
                  await OrderItem.updateOne({id: it.id}).set({currentstatus: state.id});
                }
                await sails.helpers.notification(order, state.id);
                if(!updatedOrder.tracking){
                  await sails.helpers.carrier.shipment(order.id);
                  await OrderHistory.create({order: order.id, state: state.id});
                }

              }
            }
          }
        }
      } catch (error) {
        console.log('Error recuperando las ordenens de siesas details : ',  error.message);
      }
    },
    timezone: 'America/Bogota'
  },
  stockProductsSpeedo:{
    schedule: '00 00 03 * * *',
    onTick: async () =>{
      console.log('Iniciando Sincronizacion de Stock Speedo');
      try {
        const seller = await Seller.findOne({name: 'creaciones nadar sa'});
        const products = await Product.find({seller: seller.id});
        const channel = await Channel.findOne({name: 'vtex'});
        const integration = await Integrations.findOne({channel: channel.id, seller: seller.id}).populate('channel');
        await ProductVariation.update({seller:seller.id}).set({quantity:0});
        for(const prod of products){
          let product = await sails.helpers.marketplaceswebhooks.findProductGraphql(
            integration.channel.name,
            integration.key,
            integration.secret,
            integration.url,
            integration.version,
            'PRODUCTID',
            prod.externalId
          ).catch((e) => console.log(e));
          if (product) {
            let variations = product.productVariations;
            await sails.helpers.marketplaceswebhooks.variations(variations, prod.id, seller.id, true);
          }
        }
        let integrations = await Integrations.find({seller: seller.id}).populate('channel');
        integrations = integrations.filter(data => data.channel.type === 'marketplace');
        for (const inte of integrations) {
          await sails.helpers.syncProductsMarketplaces(inte, inte.channel);
        }
      } catch (err) {
        console.log(`Se produjo un error. ${err.message}`);
      }
      console.log('Sincronizacion de Stock Speedo Finalizada');
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
    wooCommerceOrders:{
    schedule: '05 45 * * * *',
    onTick: async () =>{
      console.log('Iniciando Captura de Ordenes Woocommerce');
      let moment = require('moment');
      let axios = require('axios');

      let channel = await Channel.findOne({name: 'woocommerce'});
      let integrations = await Integrations.find({channel: channel.id}).populate('channel');

      integrations.forEach(async integration =>{
        if(integration.order_webhook_status){
          try{

            let statuses = ['pending','proccesing','completed','on-hold','canceled','refunded','failed'];

            statuses.forEach(async state =>{
                let parameters = "";

                if(state == "pending"){
                     parameters= `before=${moment().toISOString(true)}&after=${moment().subtract(2, 'hours').toISOString(true)}&status=${state}`;
                }else{
                     parameters= `[updated_at_min]==${moment().toISOString(true)}&[updated_at_max]=${moment().subtract(2, 'hours').toISOString(true)}&status=${state}`;
                }

                let orders  = await axios.get(`${integration.url}wp-json/${integration.version}/orders?consumer_key=${integration.key}&consumer_secret=${integration.secret}&${parameters}`).catch((e)=>{
                  console.log(`No se pudieron recuperar las ordenes del seller ${integration.url}`, e);
                });

                if(orders && (orders.status == 200)  && orders.data.length > 0){
                    for (let index = 0; index < orders.data.length; index++) {
                      const order = orders.data[index];

                      let o = await sails.helpers.marketplaceswebhooks.findProductGraphql(
                        integration.channel.name,
                        integration.key,
                        integration.secret,
                        integration.url,
                        integration.version,
                        'ORDERID',
                        order.id
                      ).catch((e) => console.log(e));

                      if (o) {
                          await sails.helpers.marketplaceswebhooks.order(o, integration).catch((e)=>console.log(e));
                      }
                  }
                }
            });

          }catch(err){
            console.log(`No se pudieron recuperar las ordenes del seller ${integration.url}`, err);
          }
        }
      });
    },
    timezone: 'America/Bogota'
  }
};
