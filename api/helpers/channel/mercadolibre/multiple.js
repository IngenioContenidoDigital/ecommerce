module.exports = {
  friendlyName: 'Multiple',
  description: 'Multiple mercadolibre.',
  inputs: {
    seller: {
      type: 'string',
      required: true,
    },
    action: {
      type: 'string',
      required: true,
    }
  },
  exits: {
    success: {
      description: 'All done.',
    },
  },
  fn: async function (inputs, exits) {
    let mlstate = false;
    let products = null;
    let result = null;
    let response = {Request:[], Errors:[]};
    if(inputs.action==='ProductUpdate'){mlstate = true;}
    if(inputs.action==='ProductCreate' || inputs.action==='ProductUpdate') {
      products = await Product.find({
        where: {seller: inputs.seller, ml: mlstate, active: true},
        select:['id'],
        limit: 600,
        sort: 'createdAt ASC'
      });
      try {
        if(products.length > 0){
          let integration = await sails.helpers.channel.mercadolibre.sign(product[0].seller);
          for(let product of products){
            let body = await sails.helpers.channel.mercadolibre.product(product.id, inputs.action, product.mlprice,'active')
            .intercept((err)=>{
              response.Errors.push({REF:'NODATA',ERR:err.message});
            });
            if(body){
              switch(inputs.action) {
                case 'ProductUpdate':
                  result = await sails.helpers.channel.mercadolibre.request('items/'+product.mlid, integration.secret, body,'PUT')
                  .tolerate((err)=>{
                    response.Errors.push({REF:'NOCTG',ERR:err.message});
                    return;
                  }); 
                  if(result){ response.Request.push({REF:product.reference,MSJ:'Procesado Exitosamente'});}
                  break;
                case 'ProductCreate':
                  result = await sails.helpers.channel.mercadolibre.request('items', integration.secret, body,'POST')
                  .tolerate((err)=>{
                    response.Errors.push({REF:'NOCTG',ERR:err.message});
                    return;
                  }); 
                  if(result.id.length>0){
                    await Product.updateOne({id: product.id}).set({
                      ml: true,
                      mlstatus: true,
                      mlid: response.id
                    });
                    response.Request.push({REF:product.reference,MSJ:'Procesado Exitosamente'});
                  }
                  break;
              }
            }
          }
        }else{
          response.Errors.push({REF:'NODATA',ERR:'Sin productos para procesar'});
        }
      } catch(err) {
        response.Errors.push({REF:'ERR',ERR:err.message});
      }
    }
    return exits.success(response);
  }
};
