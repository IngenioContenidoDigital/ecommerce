module.exports = {
    friendlyName: 'Imprimir Guia',
    description: 'Guia carrier.',
    inputs: {
      tracking:{
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
        const pdf = require('html-pdf');
        const pdf2base64 = require('pdf-to-base64');
        let moment = require('moment');
        let order = await Order.findOne({tracking:inputs.tracking}).populate('addressDelivery').populate('carrier').populate('customer');
        order.addressDelivery = await Address.findOne({id:order.addressDelivery.id}).populate('city').populate('region');
        let seller = await Seller.findOne({id:order.seller}).populate('mainAddress');
        seller.mainAddress = await Address.findOne({id:seller.mainAddress.id}).populate('city').populate('region');
        let oitems = await OrderItem.find({order:order.id}).populate('product');
        let price=0;
        if(order.paymentMethod==='COD'){
            price=order.totalOrder;
          } 

        try {
            const html = `<!DOCTYPE html>
            <html lang="en">
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <title>Template Report</title>
                <style>
                  body {
                    font-family: BlinkMacSystemFont,
                    -apple-system,"Segoe UI",
                    Roboto,Oxygen,Ubuntu,Cantarell,
                    "Fira Sans","Droid Sans",
                    "Helvetica Neue",
                    Helvetica,Arial,sans-serif;
                  }
                  .column {
                    float: left;
                    width: 50%;
                  }
                  .row {
                    padding: 0rem 2rem;
                    margin-left: 80px;
                  }
                  .row:after {
                    content: "";
                    display: table;
                    clear: both;
                  }
                  .subtitle.is-6 {
                    font-size: 0.75rem;
                    color: #4a4a4a;
                    font-weight: 400;
                    line-height: normal;
                  }
                  .title {
                    text-align: center;
                    font-size: 0.75rem;
                    font-weight: bold;
                  }
                  .img{
                    margin-left: 30%;
                    width: 200px;
                  }
                  .text{
                    margin-top: 4px;
                    margin-bottom: 0px;
                  }
                </style>
              </head>
            
              <body>
                 <p class="title">GUIA (UUID): `+ order.tracking +`</p>
                <div class="row">
                  <div class="column">
                    <h5 class="subtitle is-6">` + seller.name.toUpperCase() + `<br>NIT. ` + seller.dni + `<br>`+ seller.mainAddress.addressline1+' - '+seller.mainAddress.addressline2 +' - '+seller.mainAddress.notes+`<br>Tel. `+ seller.phone +`<br></h5>
                    <h5 class="subtitle is-6">` + order.customer.fullName.toUpperCase() + `<br> ` + order.customer.dniType +`. ` + order.customer.dni + `<br>`+ order.addressDelivery.addressline1+' - '+order.addressDelivery.addressline2+' - '+order.addressDelivery.notes+`<br>Tel. `+ order.customer.mobile +`</h5>
                  </div>
                  <div class="column">
                    <h5 class="subtitle is-6"><br><br>`+ seller.mainAddress.zipcode+' - '+ seller.mainAddress.city.name.toUpperCase()+' - '+ seller.mainAddress.region.name.toUpperCase()+`<br><br><br><br><br></h5>
                    <h5 class="subtitle is-6">`+ order.addressDelivery.zipcode+' - '+ order.addressDelivery.city.name.toUpperCase()+' - '+ order.addressDelivery.region.name.toUpperCase()+`</h5>
                  </div>
                </div>
                <div class="row">
                  <div class="column">
                    <p class="subtitle is-6">`+moment(order.createdAt).format("YYYY-MM-DD")+`<br>Paquete con `+oitems.length+` Artículo(s).</p>                  </div>
                  <div class="column">
                    <p class="subtitle is-6">Valor a recaudar:`+ Math.round(price).toLocaleString('es-CO')+`<br>REF:`+ order.reference +`</p>
                  </div>
                </div>
                <p class="title text">Archivo</p>
                <p class="title text">----------------------------------------------------------------------------------------------------------</p>
                <p class="title">GUIA (UUID): `+ order.tracking +`</p>
                <div class="row">
                  <div class="column">
                  <h5 class="subtitle is-6">` + seller.name.toUpperCase() + `<br>NIT. ` + seller.dni + `<br>`+ seller.mainAddress.addressline1+' - '+seller.mainAddress.addressline2 +' - '+seller.mainAddress.notes+`<br>Tel. `+ seller.phone +`<br></h5>
                    <h5 class="subtitle is-6">` + order.customer.fullName.toUpperCase() + `<br> ` + order.customer.dniType +`. ` + order.customer.dni + `<br>`+ order.addressDelivery.addressline1+' - '+order.addressDelivery.addressline2+' - '+order.addressDelivery.notes+`<br>Tel. `+ order.customer.mobile +`</h5>
                  </div>
                  <div class="column">
                  <h5 class="subtitle is-6"><br><br>`+ seller.mainAddress.zipcode+' - '+ seller.mainAddress.city.name.toUpperCase()+' - '+ seller.mainAddress.region.name.toUpperCase()+`<br><br><br><br><br></h5>
                  <h5 class="subtitle is-6">`+ order.addressDelivery.zipcode+' - '+ order.addressDelivery.city.name.toUpperCase()+' - '+ order.addressDelivery.region.name.toUpperCase()+`</h5>
                  </div>
                </div>
                <div class="row">
                  <div class="column">
                  <p class="subtitle is-6">`+moment(order.createdAt).format("YYYY-MM-DD")+`<br>Paquete con `+oitems.length+` Artículo(s).</p>
                  </div>
                  <div class="column">
                  <p class="subtitle is-6">Valor a recaudar:`+ Math.round(price).toLocaleString('es-CO')+`<br>REF:`+ order.reference +`</p>
                  </div>
                </div>
                <p class="title text">Destinatario</p>
                <p class="title text">----------------------------------------------------------------------------------------------------------</p>
                <p class="title">GUIA (UUID): `+ order.tracking +`</p>
                <div class="row">
                  <div class="column">
                  <h5 class="subtitle is-6">` + seller.name.toUpperCase() + `<br>NIT. ` + seller.dni + `<br>`+ seller.mainAddress.addressline1+' - '+seller.mainAddress.addressline2 +' - '+seller.mainAddress.notes+`<br>Tel. `+ seller.phone +`<br></h5>
                    <h5 class="subtitle is-6">` + order.customer.fullName.toUpperCase() + `<br> ` + order.customer.dniType +`. ` + order.customer.dni + `<br>`+ order.addressDelivery.addressline1+' - '+order.addressDelivery.addressline2+' - '+order.addressDelivery.notes+`<br>Tel. `+ order.customer.mobile +`</h5>
                  </div>
                  <div class="column">
                  <h5 class="subtitle is-6"><br><br>`+ seller.mainAddress.zipcode+' - '+ seller.mainAddress.city.name.toUpperCase()+' - '+ seller.mainAddress.region.name.toUpperCase()+`<br><br><br><br><br></h5>
                  <h5 class="subtitle is-6">`+ order.addressDelivery.zipcode+' - '+ order.addressDelivery.city.name.toUpperCase()+' - '+ order.addressDelivery.region.name.toUpperCase()+`</h5>
                  </div>
                </div>
                <div class="row">
                  <div class="column">
                  <p class="subtitle is-6">`+moment(order.createdAt).format("YYYY-MM-DD")+`<br>Paquete con `+oitems.length+` Artículo(s).</p>
                  </div>
                  <div class="column">
                  <p class="subtitle is-6">Valor a recaudar:`+ Math.round(price).toLocaleString('es-CO')+`<br>REF:`+ order.reference +`</p>
                  </div>
                </div>
                <p class="title text">Control Entrega</p>
            </body>
            </html>`;
            const options = { format: 'Letter' };
            pdf.create(html, options).toFile('./.tmp/uploads/guias/guia.pdf', async (err, result) => {
              if (err) {return console.log(err);}
              guia = await pdf2base64(result.filename);
              return exits.success(guia);
            });
          } catch (err) {
            return exits.error(err);
          }

  
    }
  };
  

  
  