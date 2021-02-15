
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
    let channel = await channel.findOne({name:'dafiti'});
    let product = await Product.findOne({id:inputs.product})
    .populate('variations')
    .populate('productchannel');
    for(let pv of product.variations){
      if(!skus.includes(pv.id)){
        skus.push('"'+pv.id+'"');
      }
    }
    if(skus.length>0){
      let params=['SkuSellerList=['+skus.toString()+']'];
      for(let pc of product.productchannel){
        let state = null;
        let sign = await sails.helpers.channel.dafiti.sign(pc.integration,'GetQcStatus',product.seller,params);
        let response = await sails.helpers.request(channel.endpoint,'/?'+sign,'GET');
        let result = JSON.parse(response);
        try{
          if(result.SuccessResponse.Body.Status){
            state = result.SuccessResponse.Body.Status.State.Status ? result.SuccessResponse.Body.Status.State.Status : result.SuccessResponse.Body.Status.State[0].Status
            if(state==='approved'){
              await ProductChannel.updateOne({id:pc.id}).set({qc:true});
            }else{
              await ProductChannel.updateOne({id:pc.id}).set({qc:false});
            } 
          }else{
            await ProductChannel.destroyOne({id:pc.id});
          }
        }catch(e){
          console.log(e);
        }
      }
    }
    return exits.success(state);
  }
};

