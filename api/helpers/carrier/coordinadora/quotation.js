module.exports = {
  friendlyName: 'Quotation',
  description: 'Quotation coordinadora.',
  inputs: {
    address:{
      type:'string',
      required:true
    },
    cart:{
      type:'string',
      required:true
    }
  },
  exits: {
    success: {
      description: 'All done.',
    },
  },
  fn: async function (inputs,exits) {
    let sellers = [];
    let address = await Address.findOne({id:inputs.address}).populate('city');
    let cart = await Cart.findOne({id:inputs.cart});

    let cartvalue = 0;let sellervalue = 0;
    let shipping = 0;
    let citems = await CartProduct.find({cart:cart.id}).populate('product');

    let requestArgs={
      'p':{
        'nit':'',
        'div':'',
        'cuenta':'3',
        'product':'0',
        'destino':address.city.code+'000',
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

    for(let item of citems){
      cartvalue+=item.totalPrice;
      if(!sellers.includes(item.product.seller)){sellers.push(item.product.seller)}
    }

    if(cartvalue>=130000){
      await Cart.updateOne({id:cart.id}).set({shipping:0});
      return exits.success({cartvalue:cartvalue,shipping:0});
    }else{
      let allsellers = await Seller.find({
        where:{id:sellers},
        select:['mainAddress']
      }).populate('mainAddress');

      for(let seller of allsellers){
        let city = await City.findOne({id:seller.mainAddress.city});
        requestArgs.p.origen = city.code+'000';
        let sellerproducts = citems.filter(elm => elm.product.seller===seller.id);
        for(let sp of sellerproducts){
          requestArgs.p.detalle.item.push({
            'ubl':'0',
            'alto':(sp.product.height).toString(),
            'ancho':(sp.product.width).toString(),
            'largo':(sp.product.length).toString(),
            'peso': (sp.product.weight).toString(),
            'unidades':'1',
          });
          sellervalue+=sp.totalPrice;
        }
        requestArgs.p.valoracion = ((sellervalue/1.19)*0.7).toString();
        let result = await sails.helpers.carrier.coordinadora.soap(requestArgs,'Cotizador_cotizar');
        shipping+=result.Cotizador_cotizarResult.flete_total;
      }
      await Cart.updateOne({id:cart.id}).set({shipping:shipping});
      return exits.success({cartvalue:cartvalue+shipping,shipping:shipping});
    }
  }
};

