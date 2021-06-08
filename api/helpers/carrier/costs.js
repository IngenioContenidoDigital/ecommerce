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
    let order = await Order.findOne({tracking:inputs.tracking}).populate('addressDelivery');
    let seller = await Seller.findOne({id:order.seller}).populate('mainAddress');
    seller.mainAddress = await Address.findOne({id:seller.mainAddress.id}).populate('city');
    let city = await City.findOne({id:order.addressDelivery.city});
    let oitems = await OrderItem.find({order:order.id}).populate('product');

    let requestArgs={
      'p':{
        'nit':'',
        'div':'',
        'cuenta':'3',
        'product':'0',
        'origen':seller.mainAddress.city.code+'000',
        'destino':city.code+'000',
        'valoracion':(order.totalProducts/1.19)*0.7,
        'nivel_servicio':{
          'item':1
        },
        'detalle':{
          'item':[]
        },
        'apikey':'154a892e-9909-11ea-bb37-0242ac130002',
        'clave':'1V2JqxYZwtLVuY',
      }
    };
    let items = [];
    for(let p of oitems){
      if(items.length<1){
        items.push({
          'ubl':'0',
          'alto':(p.product.height).toString(),
          'ancho':(p.product.width).toString(),
          'largo':(p.product.length).toString(),
          'peso': (p.product.weight).toString(),
          'unidades':'1',
        });
      }else{
        let added = false;
        for(let it of items){
          if(it.alto===(p.product.height).toString() && it.ancho===(p.product.width).toString() && it.largo===(p.product.length).toString() && it.peso===(p.product.weight).toString()){
            it.unidades= (parseInt(it.unidades)+1).toString();
            added=true;
          }
        }
        if(!added){
          items.push({
            'ubl':'0',
            'alto':(p.product.height).toString(),
            'ancho':(p.product.width).toString(),
            'largo':(p.product.length).toString(),
            'peso': (p.product.weight).toString(),
            'unidades':'1',
          });
        }
      }
    }
    requestArgs.p.detalle.item = items;
    let result = await sails.helpers.carrier.coordinadora.soap(requestArgs,'Cotizador_cotizar','prod','tracking');
    await Order.updateOne({id:order.id}).set({fleteFijo:parseFloat(result.Cotizador_cotizarResult.flete_fijo),fleteVariable:parseFloat(result.Cotizador_cotizarResult.flete_variable),fleteTotal:parseFloat(result.Cotizador_cotizarResult.flete_total)});
    return exits.success();
  }


};

