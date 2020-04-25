module.exports = {
  friendlyName: 'Order',
  description: 'Order something.',
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
    let address = inputs.data.address;
    let user = inputs.data.user;
    let cart = inputs.data.cart;
    let payment = (inputs.data.payment) ? inputs.data.payment : null;
    let extra = (inputs.data.extra) ? inputs.data.extra.toLowerCase().trim() : null;
    let cartproducts = await CartProduct.find({cart:cart.id})
                  .populate('product')
                  .populate('productvariation');

    let carttotal = 0;
    cartproducts.forEach(async cp=>{
      carttotal+= cp.productvariation.price;
    });

    try{
      let order = await Order.create({
        totalOrder:carttotal,
        totalShipping:0,
        totalProducts:carttotal,
        totalDiscount:0,
        conversionRate:1,
        customer:user.id,
        addressDelivery:address.id,
        cart:cart.id,
        currentstatus:await sails.helpers.orderState(payment.data.estado),
        paymentMethod:inputs.data.method,
        paymentId:payment.data.ref_payco,
        paymentOption:extra,
      }).fetch();

      for(let cp of cartproducts){
        for(let i=0; i<cp.quantity; i++){
          await OrderItem.create({
            order:order.id,
            product:cp.product.id,
            productvariation:cp.productvariation.id,
            price:cp.productvariation.price,
            discount:0,
            originalPrice:cp.productvariation.price});
        }
      }
      return exits.success(order);
    }catch(err){
      return exits.error(err);
    }
  }
};

