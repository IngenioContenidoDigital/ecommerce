module.exports = {
  friendlyName: 'Order',
  description: 'Helper usado para realizar la creación de ordenes',
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
    let carrier = await Carrier.findOne({name:'coordinadora'});
    let sellers = [];
    let orders = [];
    cartproducts.forEach(cp=>{
      if(!sellers.includes(cp.product.seller)){
        sellers.push(cp.product.seller);
      }
    });

    for(let seller of sellers){
      let sellerproducts = cartproducts.filter(cp => cp.product.seller === seller);
      if(sellerproducts.length>0){
        let carttotal = 0;
        let totaldiscount = 0;
        sellerproducts.forEach(cp=>{
          carttotal+= cp.totalPrice;
          totaldiscount+=cp.totalDiscount;
        });

        try{
          let order = await Order.create({
            totalOrder:carttotal,
            totalShipping:0,
            totalProducts:carttotal,
            totalDiscount:totaldiscount,
            conversionRate:1,
            customer:user.id,
            addressDelivery:address.id,
            cart:cart.id,
            currentstatus:await sails.helpers.orderState(payment.data.estado),
            paymentMethod:inputs.data.method,
            paymentId:payment.data.ref_payco,
            paymentOption:extra,
            seller:seller,
            carrier:carrier.id
          }).fetch();

          orders.push(order.id);

          await OrderHistory.create({
            order:order.id,
            state:order.currentstatus,
            user: user.id
          });

          for(let cp of sellerproducts){
            await OrderItem.create({
              order:order.id,
              product:cp.product.id,
              productvariation:cp.productvariation.id,
              price:cp.totalPrice,
              discount:cp.totalDiscount,
              originalPrice:cp.productvariation.price});
          }
        }catch(err){
          return exits.error(err);
        }
      }
    }
    return exits.success(orders);
  }
};

