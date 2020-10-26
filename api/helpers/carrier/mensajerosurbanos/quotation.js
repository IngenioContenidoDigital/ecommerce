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
      let order = await Order.findOne({id:inputs.id}).populate('addressDelivery').populate('carrier');
      let seller = await Seller.findOne({id:order.seller}).populate('mainAddress');
      seller.mainAddress = await Address.findOne({id:seller.mainAddress.id}).populate('city');
      let city = await City.findOne({id:order.addressDelivery.city});
      city_muvalue=0;
      let oitems = await OrderItem.find({order:order.id}).populate('product');
      let items = oitems.length;
      let alto = 0;
      let largo = 0;
      let ancho = 0;
      let peso = 0;
      let flete_mensajerosurbanos;
      let flete_coordinadora;
      let carriers = await Carrier.find();
      let carrier;
  
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
          flete_coordinadora=result.Cotizador_cotizarResult.flete_total;
        });
      });
      
        switch (seller.mainAddress.city.name) {
          case 'bogota':
            city_muvalue=1;
            break;
          case 'cali':
            city_muvalue=2;
            break;   
          case 'medellin':
            city_muvalue=3;
            break;
          case 'barranquilla':
            city_muvalue=4;
            break;
          case 'cartagena':
            city_muvalue=8;
            break;
          case 'santa marta':
            city_muvalue=9;
            break;   
          case 'bucaramanga':
            city_muvalue=10;
            break;
          case 'ibague':
            city_muvalue=11;
            break;               
          default:
            break;
        }
        if(!(city_muvalue===0)){
          options = {
            method: 'post',
            url: `http://dev.api.mensajerosurbanos.com/oauth/token`,
            // url: `https://cerberus.mensajerosurbanos.com/oauth/token`,
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
          
          if (token) {
            token=token.data.access_token;
            options = {
              method: 'post',
              url: `http://dev.api.mensajerosurbanos.com/calculate`,
              // url: `https://cerberus.mensajerosurbanos.com/calculate`,
              headers: {
                  'access_token':token
              },
              data:{
                  "id_user": 146157,
                  "type_service": 4,
                  "roundtrip": 0,
                  "declared_value": (order.totalProducts/1.19)*0.8,
                  "city": city_muvalue,
                  "parking_surcharge": 0,
                  "coordinates": [
                    {
                      "address": seller.mainAddress.addressline1,
                      "city": seller.mainAddress.city.name
                    },
                    {
                      "address": order.addressDelivery.addressline1,
                      "city": city.name
                    }
                  ]
                }
             };
             flete_mensajerosurbanos = await axios(options).catch((e) => console.log(e));   
          }
        }    
         if(flete_mensajerosurbanos&&flete_coordinadora){
          flete_mensajerosurbanos=flete_mensajerosurbanos.data.data.total_service;
          if(flete_mensajerosurbanos<flete_coordinadora){
            
            carrier=carriers.find(c=>c.name=="mensajeros urbanos");
            await Order.updateOne({id:inputs.id}).set({carrier:carrier.id});
          }
         }
      
      

      return exits.success();
    }
  
  
  };
  
  