module.exports = {
  friendlyName: 'Orders',
  description: 'Orders mercadolibre.',
  inputs: {
    seller:{
      type:'string',
      required:true
    },
    params:{
      type:'ref',
      required:true
    }
  },
  exits: {
    success: {
      description: 'All done.',
    },
  },
  fn: async function (inputs,exits) {
    let mercadolibre = await sails.helpers.channel.mercadolibre.sign(inputs.seller);
    let integrations = await Integrations.findOne({channel:'mercadolibre',seller:inputs.seller});
    let response = mercadolibre.get('/orders/search/'+inputs.params.status+'?seller='+integrations.user+'&access_token='+integrations.secret);
    console.log(response);
    return exits.success();
    /*let orders = response.body; 
    /*for(let order of orders){
      let oexists = await Order.findOne({channel:'mercadolibre',channelref:order.id});
    }*/
  }


};

