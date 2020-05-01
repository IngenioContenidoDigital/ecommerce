module.exports = {
  friendlyName: 'Shipping Costs',
  description: 'Get shipping costs from traking number',
  inputs: {
    tracking:{
      type:'string'
    }
  },
  exits: {
    success: {
      description: 'All done.',
    },
  },


  fn: async function (inputs, exits) {
    let soap = require('strong-soap').soap;
    let url = 'https://ws.coordinadora.com/ags/1.5/server.php?wsdl';

    let order = await Order.findOne({tracking:inputs.tracking}).populate('addressDelivery');
    //let seller = await Seller.findOne({id:2});
    let city = await City.findOne({id:order.addressDelivery.id});
    let oitems = await OrderItem.find({order:order.id});
    let items = oitems.length;

    let requestArgs={
      'p':{
        'nit':null,
        'div':null,
        'cuenta':'2',
        'product':'0',
        'origen':'11001000',
        'destino':city.code+'000',
        'valoracion':(order.totalProducts/1.19)*0.8,
        'nivel_servicio':{
          'item':1
        },
        'detalle':{
          'item':{
            'ubl':'0',
            'alto':(11*items).toString(),
            'ancho':'21',
            'largo':'33',
            'peso':(1*items).toString(),
            'unidades':(items).toString(),
          }
        },
        'apikey':'9328bbd0-dbce-11e8-9f8b-f2801f1b9fd1',
        'clave':'6O5vOU!4?2pBB9i',
      }
    };
    let options = {};
    soap.createClient(url, options, (err, client) =>{
      console.log(client);
      let method = client['Cotizador_cotizar'];
      if(err){
        console.log(err);
      }
      method(requestArgs, async (err, result)=>{
        if(err){
          console.log(err);
        }
        await Order.updateOne({id:order.id}).set({fleteFijo:result.Cotizador_cotizarResult.flete_fijo,fleteVariable:result.Cotizador_cotizarResult.flete_variable,fleteTotal:result.Cotizador_cotizarResult.flete_total});
      });
    });
    return exits.success();
  }


};

