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
    let moment = require('moment');
    let address = inputs.data.address;
    let user = inputs.data.user;
    let cart = inputs.data.cart;
    let payment = (inputs.data.payment) ? inputs.data.payment : null;
    let extra = (inputs.data.extra) ? inputs.data.extra.toLowerCase().trim() : null;
    let cartproducts = await CartProduct.find({cart:cart.id})
                  .populate('product')
                  .populate('productvariation');
    let carrier = await Carrier.findOne({name:inputs.data.carrier.trim().toLowerCase()});
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
        let productsdiscount = 0;
        let totaldiscount=0;
        let total = 0;
        sellerproducts.forEach(cp=>{
          carttotal+= cp.totalPrice;
          productsdiscount+=cp.totalDiscount;
        });

        if(cart.discount!==undefined && cart.discount!==null){
          if(cart.discount.type==='P'){
            totaldiscount = carttotal*(cart.discount.value/100);
          }else{
            totaldiscount = cart.discount.value;
          }
          total = carttotal - totaldiscount;
        }else{
          total = carttotal;
        }

        try{
          let order = await Order.create({
            totalOrder:total,
            totalShipping:0,
            totalProducts:carttotal,
            totalDiscount:totaldiscount,
            productsDiscount:productsdiscount,
            conversionRate:1,
            customer:user.id,
            addressDelivery: address ? address.id : null,
            cart:cart.id,
            currentstatus:await sails.helpers.orderState(payment.data.estado),
            paymentMethod:inputs.data.method,
            paymentId:payment.data.ref_payco,
            paymentOption:extra,
            seller:seller,
            carrier:carrier.id ? carrier.id : '',
            channel:payment.data.channel ? payment.data.channel : 'direct',
            channelref:payment.data.channelref ? payment.data.channelref : '',
            integration:payment.data.integration ? payment.data.integration : null
          }).fetch();

          await OrderHistory.create({
            order:order.id,
            state:order.currentstatus,
            user: user.id
          });

          order.currentstatus = await OrderState.findOne({id:order.currentstatus});
          const resultseller = await Seller.findOne({id:order.seller});
          order.seller = resultseller;
          const integrat = await Integrations.findOne({id:order.integration});
          let commission = 0;
          if(integrat){
            const commissionDiscount = await CommissionDiscount.find({
              where:{
                to:{'>=':moment().valueOf()},
                from:{'<=':moment().valueOf()},
                seller: seller
              },
              sort: 'createdAt DESC',
              limit: 1
            });
            const commissionChannel = await CommissionChannel.find({
              where:{
                channel: integrat.channel,
                seller: seller
              },
              limit: 1
            });
            commission = commissionDiscount.length > 0 ? commissionDiscount[0].value : commissionChannel.length > 0 ? commissionChannel[0].value : 0;
          }else{
            commission = 20;
          }
          orders.push(order);
          
          for(let cp of sellerproducts){
            await OrderItem.create({
              order:order.id,
              product:cp.product.id,
              productvariation:cp.productvariation.id,
              price:cp.totalPrice,
              discount:cp.totalDiscount,
              originalPrice:cp.productvariation.price,
              externalReference:cp.externalReference,
              commission: commission,
              shippingType: cp.shippingType ? cp.shippingType : ''
            });
            let pv = await ProductVariation.findOne({id:cp.productvariation.id});
            if(pv){
              let quantity = pv.quantity-=1;
              let updated = await ProductVariation.updateOne({id:pv.id}).set({quantity: quantity < 0 ? 0 : quantity});
              let uproduct = await Product.findOne({id:updated.product});
              await sails.helpers.channel.channelSync(uproduct);
            }
          }
          await sails.helpers.notification(order, order.currentstatus.id);
        }catch(err){
          console.log(err);
          return exits.error(err);
        }
      }
    }
    if(cart.discount!==undefined && cart.discount!==null){
      await CartDiscount.updateOne({id:cart.discount.id}).set({user:user.id,active:false});
    }
    return exits.success(orders);
  }
};

