module.exports = {
    friendlyName: 'Shipping Quotations',
    description: 'Get shipping costs from product dimensions for several carriers',
    inputs: {
      id:{
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
      let axios = require('axios');
      const querystring = require('querystring');
      let url = 'http://sandbox.coordinadora.com/ags/1.5/server.php?wsdl';
      //   let url = 'https://ws.coordinadora.com/ags/1.5/server.php?wsdl';
      let order = await Order.findOne({id:inputs.id}).populate('addressDelivery');
      let seller = await Seller.findOne({id:order.seller}).populate('mainAddress');
      seller.mainAddress = await Address.findOne({id:seller.mainAddress.id}).populate('city');
      let city = await City.findOne({id:order.addressDelivery.city});
      let oitems = await OrderItem.find({order:order.id}).populate('product');
      let items = oitems.length;
      let alto = 0;
      let largo = 0;
      let ancho = 0;
      let peso = 0;
      let flete_coordinadora;
      
  
      for(let p in oitems){
        if(p < 1 || p ==='0'){
          largo=oitems[0].product.length;
          ancho=oitems[0].product.width;
        }
        alto+=oitems[p].product.height;
        peso+=oitems[p].product.weight;
      }
  
      let requestArgs={
        'p':{
          'nit':null,
          'div':null,
          'cuenta':'2',
          'product':'0',
          'origen':seller.mainAddress.city.code+'000',
          'destino':city.code+'000',
          'valoracion':(order.totalProducts/1.19)*0.8,
          'nivel_servicio':{
            'item':1
          },
          'detalle':{
            'item':{
              'ubl':'0',
              'alto':(alto).toString(),
              'ancho':(ancho).toString(),
              'largo':(largo).toString(),
              'peso': (peso < 1 ? 1 : peso).toString(),
              'unidades':(items).toString(),
            }
          },
          'apikey':'154a892e-9909-11ea-bb37-0242ac130002',
          'clave':'1V2JqxYZwtLVuY',
        }
      };
      let options = {};
      soap.createClient(url, options, (err, client) =>{
        let method = client['Cotizador_cotizar'];
        if(err){return exits.error(err);}
        method(requestArgs, async (err, result)=>{
          if(err){return exits.error(err);}
          console.log(result);
          flete_coordinadora=result.Cotizador_cotizarResult.flete_total;
        });
      });

      options = {
        method: 'post',
        url: `http://dev.api.mensajerosurbanos.com/oauth/token`,
        headers: {
            'client_secret':'e29690feccaecde68b8e50b51c6094761f1e2aae',
            'client_id':'14kh8th70kfwvctw6_murbanos',
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        data:querystring.stringify({
            'grant_type':'client_credentials'
        })
       };



       
      let token = await axios(options).catch((e) => console.log(e));
      token=token.data.access_token
      console.log(token);

      options = {
        method: 'post',
        url: `http://dev.api.mensajerosurbanos.com/calculate`,
        headers: {
            'access_token':token
        },
        data:{
            "id_user": 146157,
            "type_service": 4,
            "roundtrip": 0,
            "declared_value": 1250,
            "city": 1,
            "parking_surcharge": 2000,
            "coordinates": [
              {
                "address": "Cra 7 #120-20",
                "city": "bogota"
              },
              {
                "address": "calle 19b#6b",
                "city": "bogota"
              }
            ]
          }
       };

       let flete_mensajerosurbanos = await axios(options).catch((e) => console.log(e));

       console.log(flete_mensajerosurbanos);

      return exits.success();
    }
  
  
  };
  
  