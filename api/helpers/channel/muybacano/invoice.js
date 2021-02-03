module.exports = {
    friendlyName: 'Invoice Order Muybacano',
    description: 'Order invoice, sending tracking to invoice endopoint & sending cancellation to invoice endopoint (when its been already invoiced)',
    inputs: {
      order:{
        type:'ref',
        required:true,
      },
      action:{
        type:'string',
        required:true,
      }
    },
    exits: {
      success: {
        description: 'All done.',
      },
    },
    fn: async function (inputs,exits) {
      const moment = require('moment');
      try{
        let oitems = await OrderItem.find({order:inputs.order.id}).populate('product');

        if(inputs.action==='invoice'){
            let invoiceValue = 0;
            let body={
                "type": "Output",
                "invoiceNumber": inputs.order.reference.toString(),
                "courier": "", // transportadora
                "trackingNumber": '', // identificador de rastreamentor
                "trackingUrl": '', // url de rastreamento
                "items": [],
                "issuanceDate": moment().format('YYYY-MM-DD[T]HH:mm:ss'),
                "invoiceValue": 0
            };
    
            for(let p in oitems){
                invoiceValue+=oitems[p].price;
                let obj={
                  "id": oitems[p].productvariation,
                  "quantity": 1,
                  "price": oitems[p].price
                }
                body.items.push(obj);
            }
            body.invoiceValue = invoiceValue;
            return exits.success(body);
        }else if(inputs.action==='tracking'){
            let body={
                trackingNumber: '',
                trackingUrl: '',
                dispatchedDate: null,
                courier: 'coordinadora'
            };
            return exits.success(body);
        }else if(inputs.action==='cancel'){
            let invoiceValue = 0;
            let body={
                "type": "Input",
                "invoiceNumber": inputs.order.reference.toString(),
                "courier": "Coordinadora", // transportadora
                "trackingNumber": inputs.order.tracking, // identificador de rastreamentor
                "trackingUrl": '', // url de rastreamento
                "items": [],
                "issuanceDate": moment().format('YYYY-MM-DD[T]HH:mm:ss'),
                "invoiceValue": 0
            };

            for(let p in oitems){
                invoiceValue+=oitems[p].price;
                let obj={
                  "id": oitems[p].productvariation,
                  "quantity": 1,
                  "price": oitems[p].price
                }
                body.items.push(obj);
            }
            body.invoiceValue = invoiceValue;
            return exits.success(body);
        }
      }catch(err){
        console.log(err);
        return exits.error(err);
      }
    }
  };
  
  