module.exports = {
  friendlyName: 'Orders',
  description: 'Orders cms.',
  inputs: {
    order:{
      type:'ref',
      required:true
    },
    integration:{
      type:'string',
      required:true
    },
  },
  exits: {
    success: {
      description: 'All done.',
    },
    error:{
      description: 'Error'
    },
  },
  fn: async function (inputs,exits) {
    let profile = await Profile.findOne({name:'customer'});
    let moment = require('moment');
    const order = inputs.order;
    const integration = inputs.integration;
    try{
      let oexists = await Order.find({channel:order.channel, channelref:order.channelref, integration: integration});
      if(order.address.region==='bogota, d.c.' ){order.address.region='bogotá dc';}
      let region = await Region.find({name: order.address.region});
      region = region.length > 0 ? region[0].id : '';
      let city = await City.find({name: order.address.city, region: region}).populate('region');
      if((order.status === 'pending' || order.status === 'paid') && city.length>0 && oexists.length === 0){
        order.customer.password = await sails.helpers.passwords.hashPassword(order.customer.dni);
        order.customer.mobilecountry = city[0].region.country;
        order.customer.profile = profile.id;
        let user = await User.findOrCreate({emailAddress: order.customer.emailAddress},order.customer);

        order.address.country = city[0].region.country;
        order.address.region = city[0].region.id;
        order.address.city = city[0].id;
        order.address.user = user.id;
        let address = await Address.findOrCreate({addressline1: order.address.addressline1},order.address);
        let payment = {
          data:{
            estado:'Aceptado',
            channel:order.channel,
            channelref:order.channelref,
            totalShipping:order.totalShipping,
            integration:integration
          }
        };

        payment.data['ref_payco'] = order.paymentId;
        let cart = await Cart.create().fetch();
        for(let item of order.items){
          let productvariation = await ProductVariation.find({
            or : [
              { reference: item.skuId },
              { skuId: item.skuId }
            ]
          });
          if(productvariation.length > 0){
            let discPrice = 0;
            let product = await Product.findOne({id:productvariation[0].product}).populate('discount',{
              where:{
                to:{'>=':moment().valueOf()},
                from:{'<=':moment().valueOf()}
              },
              sort: 'createdAt DESC',
              limit: 1
            });
            console.log(product);
            if(product.discount.length>0){
              switch(product.discount[0].type){
                case 'P':
                  discPrice+=(productvariation[0].price*(1-(product.discount[0].value/100)));
                  break;
                case 'C':
                  discPrice+=(productvariation[0].price - product.discount[0].value);
                  break;
              }
            }
            for (let i = 1; i <= item.quantity; i++) {
              await CartProduct.create({
                cart:cart.id,
                product:productvariation[0].product,
                productvariation:productvariation[0].id,
                totalDiscount:discPrice.toFixed(2),
                totalPrice:productvariation[0].price,
                externalReference:item.skuId
              });
            }
          }
        }
        if((await CartProduct.count({cart:cart.id}))>0){
          let corders = await sails.helpers.order({address,user,cart,method:order.paymentMethod,payment,carrier:''});
          await Order.updateOne({id:corders[0].id}).set({createdAt:parseInt(moment(order.createdAt).valueOf()),tracking:''});
        } else {
          return exits.error('No se pudo crear la orden');
        }
      }
    }catch(err){
      console.log(err);
      return exits.error(err.message);
    }
    return exits.success();
  }
};
