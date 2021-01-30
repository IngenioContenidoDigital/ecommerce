module.exports = {
    friendlyName: 'Shipping',
    description: 'Shipping coppel.',
    inputs: {
      orderupdate:{
        type:'ref',
        required:true
      }
    },
    exits: {
      success: {
        description: 'All done.',
      },
      error:{
        description: 'Error'
      },
    },
    fn: async function (inputs,exits) {
       try{
          
          let axios = require('axios'); 
          let order = await Order.findOne({id:inputs.orderupdate.order});
          // let oitems = await OrderItem.find({order:order.id});
          let carrier = await Carrier.findOne({name:inputs.orderupdate.carrier}); 
          // let oitems_base=[];
          let integration = await Integrations.findOne({id: order.integration}).populate('channel');  
          let result;
          // let shipment_lines=[];
          let body={
            "carrier_code": inputs.orderupdate.carrier,
            "carrier_name": inputs.orderupdate.carrier,
            "carrier_url": carrier.url,
            "tracking_number": inputs.orderupdate.tracking
          };

          let options = {
              method: 'put',
              url: `${integration.channel.endpoint}api/orders/${order.channelref}/tracking`,
              headers: {
                  'Authorization':`${integration.key}`,
                  accept: 'application/json'
              },
              data:body
          };

          let response = await axios(options).catch((e) => {result=e.response; console.log(result);});

          if(response){
            let options = {
              method: 'put',
              url: `${integration.channel.endpoint}api/orders/${order.channelref}/ship`,
              headers: {
                  'Authorization':`${integration.key}`,
                  accept: 'application/json'
              }
            };
            let response_confirmation = await axios(options).catch((e) => {result=e.response; console.log(result);});
            if(response_confirmation){
              await Order.updateOne({id:order.id}).set({tracking:inputs.orderupdate.tracking, carrier:carrier.id});
              return exits.success()
            };
          }else{
            return exits.error();
          }

          // for(let i=0; i<oitems.length; i++){
          //    oitems_base.push(oitems[i].productvariation);
          // }
          // oitems_base = Array.from(new Set(oitems_base));
          
          // for(let i=0; i<oitems_base.length; i++){
          //   let quantity=oitems.filter(item => item.productvariation === oitems_base[i]).length;
          //   let obj={
          //     "offer_sku": `${oitems_base[i]}`,
          //     "quantity": quantity
          //   };
          //   shipment_lines.push(obj);
          // }

          // let body={
          //       "shipments": [
          //         {
          //           "order_id": order.channelref,
          //           "tracking": {
          //             "carrier_code": inputs.orderupdate.carrier,
          //             "carrier_name": inputs.orderupdate.carrier,
          //             "tracking_number": inputs.orderupdate.tracking,
          //             "tracking_url": inputs.orderupdate.url
          //           },
          //           "shipment_lines": shipment_lines,
          //           "shipped": true
          //         }
          //       ]
          // };
          // console.log(body.shipments[0].shipment_lines);
          // console.log(body.shipments[0].tracking);

          // let options = {
          //     method: 'post',
          //     url: `${integration.url}api/shipments`,
          //     headers: {
          //         'Authorization':`${integration.key}`,
          //         accept: 'application/json'
          //     },
          //     data:body
          // };

          // let response = await axios(options).catch((e) => {result=e.response; console.log(result);});

     
      }catch(err){
        // console.log(err);
        return exits.error(err);
      }
    }
  };
  
  