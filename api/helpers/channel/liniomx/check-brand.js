module.exports = {
  friendlyName: 'Check brand',
  description: 'Check brand linio mexico',
  inputs: {
    brand:{
      type:'string',
      required:true,
    },
  },
  exits: {
    success: {
      description: 'All done.',
    },
  },
  fn: async (inputs,exits) => {
    let brand = 'Generico';
    let channel = await Channel.findOne({name:'liniomx'});
    let integrations = await Integrations.find({channel:channel.id});
    let sign = await sails.helpers.channel.liniomx.sign(integrations[0].id, 'GetBrands', integrations[0].seller);
    inputs.brand=inputs.brand.replace(/[^a-zA-Z0-9_-\s]/g,'');

    await sails.helpers.request(channel.endpoint,'/?'+sign,'GET')
    .then(async (resData)=>{
      let result = JSON.parse(resData);
      if(result.SuccessResponse.Body.Brands.Brand.length>0){
        for(let b of result.SuccessResponse.Body.Brands.Brand){
          if(b.Name.toLowerCase()===inputs.brand.toLowerCase()){
            return exits.success(inputs.brand.toLowerCase());
          }
        }
      }
      return exits.success(brand);
    });
  }
};
