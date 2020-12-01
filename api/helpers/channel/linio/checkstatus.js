
module.exports = {
  friendlyName: 'Checkstatus',
  description: 'Checkstatus Linio.',
  inputs: {
    product:{
      type:'string',
      required:true
    }
  },
  exits: {
    success: {
      description: 'All done.',
    },
    notFound:{
      description:'Record Not found',
    }
  },
  fn: async function (inputs,exits) {
    let skus = [];
    let product = await Product.findOne({id:inputs.product})
    .populate('variations');
    for(let pv of product.variations){
      if(!skus.includes(pv.id)){
        skus.push('"'+pv.id+'"');
      }
    }
    let params=['SkuSellerList=['+skus.toString()+']'];
    let sign = await sails.helpers.channel.linio.sign('GetQcStatus',product.seller,params);
    let response = await sails.helpers.request('https://sellercenter-api.linio.com.co','/?'+sign,'GET');
    let result = JSON.parse(response);
    if(result.SuccessResponse.Body.Status.State){
      await Product.updateOne({id:inputs.product}).set({linio:true,linioqc:true});
      return exits.success(result);
    }else{
      await Product.updateOne({id:inputs.product}).set({linio:false,liniostatus:false,linioprice:0,linioqc:false});
      return exits.error({code:'NOTFOUND',message:'Producto no Localizado en Linio'});
    }

  }


};

