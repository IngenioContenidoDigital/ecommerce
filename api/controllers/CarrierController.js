/**
 * CarrierController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
  showcarriers: async function(req, res){
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if(rights.name!=='superadmin' && !_.contains(rights.permissions,'showcarriers')){
      throw 'forbidden';
    }
    let error= req.param('error') ? req.param('error') : null;
    let carrier = null;
    let action = req.param('action') ? req.param('action') : null;
    let id = req.param('id') ? req.param('id') : null;
    let carriers = await Carrier.find();
    if(id){
      carrier = await Carrier.findOne({id:id});
    }
    res.view('pages/carriers/carriers',{layout:'layouts/admin',carriers:carriers,action:action,carrier:carrier,error:error});
  },
  createcarrier: async function(req, res){
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if(rights.name!=='superadmin' && !_.contains(rights.permissions,'createcarrier')){
      throw 'forbidden';
    }
    let error=null;
    let isActive = (req.body.activo==='on') ? true : false;
    try{
      let filename = await sails.helpers.fileUpload(req,'logo',2000000,'images/carriers');
      await Carrier.create({
        name:req.body.name.trim().toLowerCase(),
        url:req.body.url,
        logo: filename[0].filename,
        active:isActive});
    }catch(err){
      error=err;
    }
    if (error===undefined || error===null){
      return res.redirect('/carriers');
    }else{
      return res.redirect('/carriers?error='+error);
    }
  },
  editcarrier: async function(req, res){
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if(rights.name!=='superadmin' && !_.contains(rights.permissions,'editcarrier')){
      throw 'forbidden';
    }
    let error=null;
    let isActive = (req.body.activo==='on') ? true : false;
    let id = req.param('id');
    let route = 'images/carriers';
    try{
      uploaded = await sails.helpers.fileUpload(req,'logo',2000000,route);

      await Carrier.updateOne({id:id}).set({
        name:req.body.name.trim().toLowerCase(),
        url: req.body.url,
        logo: uploaded[0].filename,
        active:isActive});

    }catch(err){
      error=err;
      if(error.code==='badRequest'){
        await Carrier.updateOne({id:id}).set({
          name:req.body.name.trim().toLowerCase(),
          url: req.body.url,
          active:isActive});
      }
    }

    if (error===undefined || error===null || error.code==='badRequest'){
      return res.redirect('/carriers');
    }else{
      return res.redirect('/carriers?error='+error);
    }
  },
  carrierstate: async function(req, res){
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if(rights.name!=='superadmin' && !_.contains(rights.permissions,'carrierstate')){
      throw 'forbidden';
    }
    if (!req.isSocket) {
      return res.badRequest();
    }
    var id = req.param('id');
    var state = req.body.active;
    var updatedCarrier = await Carrier.updateOne({id:id}).set({active:state});
    return res.send(updatedCarrier);
  },
  shipment:async (req, res) =>{
    let rights = await sails.helpers.checkPermissions(req.session.user.profile);
    if(rights.name!=='superadmin' && !_.contains(rights.permissions,'shipment')){
      throw 'forbidden';
    }
    let tracking = req.param('tracking');
    let orders = await Order.find({tracking:tracking});
    let guia=null;
    let label=null;
    for(let order of orders){
      if(order.channel==='direct'){
        guia = await sails.helpers.carrier.guia(tracking);
        label = await sails.helpers.carrier.label(tracking);
      }
      if(order.channel==='dafiti'){
        let oitems = await OrderItem.find({order:order.id});
        let litems = [];
        for(let it of oitems){
          if(!litems.includes(it.externalReference)){
            litems.push(it.externalReference);
          }
        }
        let route = await sails.helpers.channel.dafiti.sign(order.integration,'GetDocument',order.seller,['OrderItemIds=['+litems.join(',')+']','DocumentType=shippingParcel']);
        let response = await sails.helpers.request('https://sellercenter-api.dafiti.com.co','/?'+route,'GET');
        let result = JSON.parse(response);
        guia = result.SuccessResponse.Body.Documents.Document.File;
      }

      if(order.channel==='linio'){
        let oitems = await OrderItem.find({order:order.id});
        let litems = [];
        for(let it of oitems){
          if(!litems.includes(it.externalReference)){
            litems.push(it.externalReference);
          }
        }
        let route = await sails.helpers.channel.linio.sign(order.integration,'GetDocument',order.seller,['OrderItemIds=['+litems.join(',')+']','DocumentType=shippingParcel']);
        let response = await sails.helpers.request('https://sellercenter-api.linio.com.co','/?'+route,'GET');
        let result = JSON.parse(response);
        guia = result.SuccessResponse.Body.Documents.Document.File;
      }

      if(order.channel==='mercadolibre'){
        guia = await sails.helpers.channel.mercadolibre.shipping(order);
      }
    }
    return res.view('pages/pdf',{layout:'layouts/admin',guia:guia,label:label});
  },
  generateguides: async function(req, res){
    res.view('pages/carriers/generateguides',{layout:'layouts/admin'});
  },
  multipleguides: async function(req, res){
    const PDFDocument = require('pdf-lib').PDFDocument;
    let orderState = await OrderState.findOne({name: 'empacado'});
    const dateStart = req.body.startDate;
    const dateEnd = req.body.endDate;
    let numbers = req.body.numbers;
    const seller = req.session.user.seller;
    let orders = null;
    try {
      if (dateStart && dateEnd) {
        orders = await Order.find({
          where: {
            seller: seller,
            channel: ['linio', 'dafiti'],
            currentstatus: orderState.id,
            createdAt: { '>': new Date(dateStart).valueOf(), '<': new Date(dateEnd).valueOf() }
          },
          sort: 'createdAt DESC'
        });
      } else if(numbers){
        const result = [];
        numbers = numbers.split(',');
        numbers.forEach(n => {
          result.push(parseInt(n));
        });
        orders = await Order.find({
          where: {
            seller: seller,
            channel: ['linio', 'dafiti'],
            currentstatus: orderState.id,
            reference: result
          },
          sort: 'createdAt DESC'
        });
      }
      if (orders && orders.length > 0) {
        let documents = [];
        for (const order of orders) {
          let litems = [];
          let oitems = await OrderItem.find({order:order.id}).populate('product');
          let integration = await Integrations.findOne({id: order.integration}).populate('channel');
          for(let it of oitems){
            if(!litems.includes(it.externalReference)){
              litems.push(it.externalReference);
            }
          }
          let route = order.channel === 'dafiti' ? await sails.helpers.channel.dafiti.sign(order.integration, 'GetDocument',order.seller,['OrderItemIds=['+litems.join(',')+']','DocumentType=shippingParcel']) :
            await sails.helpers.channel.linio.sign(order.integration,'GetDocument',order.seller,['OrderItemIds=['+litems.join(',')+']','DocumentType=shippingParcel']);
          let respo = await sails.helpers.request(integration.channel.endpoint,'/?'+route,'GET');
          let result = JSON.parse(respo);
          if(result.SuccessResponse){
            const resultBuf = Buffer.from(result.SuccessResponse.Body.Documents.Document.File, 'base64');
            documents.push(resultBuf);
          }
        }
        const mergedPdf = await PDFDocument.create();
        for (const pdfBytes of documents) {
          const pdf = await PDFDocument.load(pdfBytes);
          const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
          copiedPages.forEach((page) => {
            mergedPdf.addPage(page);
          });
        }
        const buf = await mergedPdf.save();
        const resultPdf = Buffer.from(new Uint8Array(buf)).toString('base64');
        return res.send({guia: resultPdf, error: null});
      } else {
        return res.send({guia: null, error: 'No se encontró pedidos para procesar'});
      }
    } catch (error) {
      return res.send({guia: null, error: 'Error al procesar guias'});
    }
  }
};
