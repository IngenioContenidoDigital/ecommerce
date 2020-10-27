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
        let seller = await Seller.findOne({id:order.seller}).populate('mainAddress');
        seller.mainAddress = await Address.findOne({id:seller.mainAddress.id}).populate('city').populate('region');
        let city = await City.findOne({id:order.addressDelivery.city});
        let oitems = await OrderItem.find({order:order.id}).populate('product');
        let totalSku=1110;
        let price=0;
        if(order.paymentMethod==='COD'){
            price=order.totalOrder;
          } 
        console.log(seller.mainAddress);
        console.log(order);

        try {
            // const html = '<p class="subtitle is-6 text">Siniestros</p>';
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
                  }
                  .row:after {
                    content: "";
                    display: table;
                    clear: both;
                  }
                  .subtitle {
                    color: #4a4a4a;
                    font-size: 1rem;
                    font-weight: 400;
                    line-height: 1.25;
                  }
                  .title {
                    color: #4a4a4a;
                    font-size: 0.75rem;
                    line-height: 1.25;
                    font-weight: bold;
                  }
                  .title-balance {
                    color: #4a4a4a;
                    font-size: 1rem;
                    line-height: 1.25;
                    font-weight: bold;
                  }
                  .subtitle.is-6 {
                    font-size: 0.75rem;
                  }
                  .subtitle.is-8 {
                    text-align: center;
                    font-size: 1rem;
                    font-weight: bold;
                  }
                  .img{
                    margin-left: 30%;
                    width: 200px;
                  }
                  .text{
                    margin-top: 8px;
                    margin-bottom: 0px;
                  }
                </style>
              </head>
            
              <body>
                 <p class="subtitle is-8">Guía (uuid): `+ order.tracking +`</p>
                <div class="row">
                  <div class="column">
                    <h5 class="subtitle is-6">` + seller.name.toUpperCase() + `<br>NIT. ` + seller.dni + `<br>`+ seller.mainAddress.addressline1 +`<br>Tel. `+ seller.phone +`<br></h5>
                    <h5 class="subtitle is-6">` + order.customer.fullName.toUpperCase() + `<br> ` + order.customer.dniType +`. ` + order.customer.dni + `<br>`+ order.addressDelivery.addressline1 +`<br>Tel. `+ order.customer.mobile +`<br></h5>
                  </div>
                  <div class="column">
                    <h5 class="subtitle is-6"><br><br>`+ seller.mainAddress.city.name.toUpperCase()+' - '+ seller.mainAddress.region.name.toUpperCase()+`<br><br><br><br></h5>
                    <h5 class="subtitle is-6">`+ seller.mainAddress.city.name.toUpperCase()+' - '+ seller.mainAddress.region.name.toUpperCase()+`</h5>
                  </div>
                </div>
                <div class="row">
                  <div class="column">
                    <p class="subtitle is-6">`+moment(order.createdAt).format("YYYY-MM-DD")+`</p>
                    <p class="subtitle is-6">Paquete con `+ oitems.length +` Artículo(s)</p>
                  </div>
                  <div class="column">
                    <p class="subtitle is-6">Valor a recaudar:`+ Math.round(price).toLocaleString('es-CO')+`</p>
                    <p class="subtitle is-6">REF:`+ order.reference +`</p>
                  </div>
                </div>
                <br>
                <div class="row" style="text-align: center;">
                    <h2 class="title-balance is-6 text">Archivo</h2>
                    <h2 class="title-balance is-6 text">------------------------------------------------------------</h2>
                </div>
                <div class="row" style="text-align: center;">
                <h5 class="subtitle is-8">Guía (uuid): `+ order.tracking +`</h5>
               </div>
               <div class="row">
                 <div class="column">
                   <h5 class="subtitle is-6">` + seller.name.toUpperCase() + `<br>NIT. ` + seller.dni + `<br>`+ seller.mainAddress.addressline1 +`<br>Tel. `+ seller.phone +`<br></h5>
                   <h5 class="subtitle is-6">` + order.customer.fullName.toUpperCase() + `<br> ` + order.customer.dniType +`. ` + order.customer.dni + `<br>`+ order.addressDelivery.addressline1 +`<br>Tel. `+ order.customer.mobile +`<br></h5>
                 </div>
                 <div class="column">
                   <h5 class="subtitle is-6"><br><br>`+ seller.mainAddress.city.name.toUpperCase()+' - '+ seller.mainAddress.region.name.toUpperCase()+`<br><br><br><br></h5>
                   <h5 class="subtitle is-6">`+ seller.mainAddress.city.name.toUpperCase()+' - '+ seller.mainAddress.region.name.toUpperCase()+`</h5>
                 </div>
               </div>
               <div class="row">
                 <div class="column">
                   <p class="subtitle is-6">`+moment(order.createdAt).format("YYYY-MM-DD")+`</p>
                   <p class="subtitle is-6">Paquete con `+ oitems.length +` Artículo(s)</p>
                 </div>
                 <div class="column">
                   <p class="subtitle is-6">Valor a recaudar:`+ Math.round(price).toLocaleString('es-CO')+`</p>
                   <p class="subtitle is-6">REF:`+ order.reference +`</p>
                 </div>
               </div>
               <br>
              <div class="row" style="text-align: center;">
                  <h2 class="title-balance is-6 text">Destinatario</h2>
              </div>
              <div class="row" style="text-align: center;">
              <h5 class="subtitle is-8">Guía (uuid): `+ order.tracking +`</h5>
             </div>
             <div class="row">
               <div class="column">
                 <h5 class="subtitle is-6">` + seller.name.toUpperCase() + `<br>NIT. ` + seller.dni + `<br>`+ seller.mainAddress.addressline1 +`<br>Tel. `+ seller.phone +`<br></h5>
                 <h5 class="subtitle is-6">` + order.customer.fullName.toUpperCase() + `<br> ` + order.customer.dniType +`. ` + order.customer.dni + `<br>`+ order.addressDelivery.addressline1 +`<br>Tel. `+ order.customer.mobile +`<br></h5>
               </div>
               <div class="column">
                 <h5 class="subtitle is-6"><br><br>`+ seller.mainAddress.city.name.toUpperCase()+' - '+ seller.mainAddress.region.name.toUpperCase()+`<br><br><br><br></h5>
                 <h5 class="subtitle is-6">`+ seller.mainAddress.city.name.toUpperCase()+' - '+ seller.mainAddress.region.name.toUpperCase()+`</h5>
               </div>
             </div>
             <div class="row">
               <div class="column">
                 <p class="subtitle is-6">`+moment(order.createdAt).format("YYYY-MM-DD")+`</p>
                 <p class="subtitle is-6">Paquete con `+ oitems.length +` Artículo(s)</p>
               </div>
               <div class="column">
                 <p class="subtitle is-6">Valor a recaudar:`+ Math.round(price).toLocaleString('es-CO')+`</p>
                 <p class="subtitle is-6">REF:`+ order.reference +`</p>
               </div>
             </div>
             <br>
            <div class="row" style="text-align: center;">
                <h2 class="title-balance is-6 text">Control Entrega</h2>
            </div>
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
  

  
  