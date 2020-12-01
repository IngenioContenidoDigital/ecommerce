
module.exports = {
  friendlyName: 'Checkstatus',
  description: 'Checkstatus dafiti.',
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
    let sign = await sails.helpers.channel.dafiti.sign('GetQcStatus',product.seller,params);
    let response = await sails.helpers.request('https://sellercenter-api.dafiti.com.co','/?'+sign,'GET');
    let result = JSON.parse(response);

    try{
      if(result.SuccessResponse.Body.Status){
        let state = result.SuccessResponse.Body.Status.State.Status ? result.SuccessResponse.Body.Status.State.Status : result.SuccessResponse.Body.Status.State[0].Status
        if(state==='approved'){
          await Product.updateOne({id:inputs.product}).set({dafiti:true,dafitiqc:true});
        }else if(state==='pending'){
          await Product.updateOne({id:inputs.product}).set({dafiti:true,dafitiqc:false});
        }else{
          await Product.updateOne({id:inputs.product}).set({dafiti:false,dafitiqc:false});
        } 
        return exits.success(state);
      }else{
        await Product.updateOne({id:inputs.product}).set({dafiti:false,dafitistatus:false,dafitiqc:false});
        return exits.success();
      }
    }catch(e){
      console.log(e);
      throw 'notFound';
    }

  }


};

