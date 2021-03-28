module.exports = {
  friendlyName: 'Order Shipping',
  description: 'Helper usado para realizar la creación de orden item cuando hay mas de una orden con el mismo shipping',
  inputs: {
    data:{
      type:'ref',
      required:true,
    }
  },
  exits: {
    success: {
      description: 'All done.',
    },
  },
  fn: async function (inputs, exits) {
    let moment = require('moment');
    let order = inputs.data.order;
    let cartproducts = inputs.data.cartProducts;
    let sellers = [];
    cartproducts.forEach(cp=>{
      if(!sellers.includes(cp.product.seller)){
        sellers.push(cp.product.seller);
      }
    });

    for(let seller of sellers){
      let sellerproducts = cartproducts.filter(cp => cp.product.seller === seller);
      if(sellerproducts.length>0){
        let carttotal = 0;
        let productsdiscount = 0;
        sellerproducts.forEach(cp=>{
          carttotal+= cp.totalPrice;
          productsdiscount+=cp.totalDiscount;
        });

        try{
          await Order.updateOne({id:order.id}).set({
            totalOrder: order.totalOrder + carttotal,
            totalProducts: order.totalProducts + carttotal,
            productsDiscount: order.productsDiscount + productsdiscount
          });
          const integrat = await Integrations.findOne({id:order.integration});
          const commissionChannel = await CommissionChannel.find({
            where:{
              channel: integrat.channel,
              seller: seller
            },
            limit: 1
          });
          const commissionDiscount = await CommissionDiscount.find({
            where:{
              to:{'>=':moment().valueOf()},
              from:{'<=':moment().valueOf()},
              seller: seller
            },
            sort: 'createdAt DESC',
            limit: 1
          });

          for(let cp of sellerproducts){
            await OrderItem.create({
              order:order.id,
              product:cp.product.id,
              productvariation:cp.productvariation.id,
              price:cp.totalPrice,
              discount:cp.totalDiscount,
              originalPrice:cp.productvariation.price,
              externalReference:cp.externalReference,
              commission: commissionDiscount.length > 0 ? commissionDiscount[0].value : commissionChannel.length > 0 ? commissionChannel[0].value : 0
            });
            let pv = await ProductVariation.findOne({id:cp.productvariation.id});
            if(pv){
              let quantity = pv.quantity-=1;
              let updated = await ProductVariation.updateOne({id:pv.id}).set({quantity: quantity < 0 ? 0 : quantity});
              let uproduct = await Product.findOne({id:updated.product});
              await sails.helpers.channel.channelSync(uproduct);
            }
          }
        }catch(err){
          return exits.error(err);
        }
      }
    }
    return exits.success();
  }
};
