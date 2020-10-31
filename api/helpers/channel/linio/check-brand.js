module.exports = {
  friendlyName: 'Check brand',
  description: '',
  inputs: {
    brand:{
      type:'string',
      required:true,
    },
    seller:{
      type:'string',
      required:true,
    }
  },
  exits: {
    success: {
      description: 'All done.',
    },
  },
  fn: async (inputs,exits) => {
    let brand = 'Generico';
    let sign = await sails.helpers.channel.linio.sign('GetBrands', inputs.seller);

    await sails.helpers.request('https://sellercenter-api.linio.com.co','/?'+sign,'GET')
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
}