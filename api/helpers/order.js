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
    error:{
      description: 'Error'
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

    let carrier = await Carrier.findOne({name:inputs.data.carrier ? inputs.data.carrier.trim().toLowerCase():''});
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
        const resultSeller = await Seller.findOne({id: seller}).populate('currency');
        let exchangeRate = await sails.helpers.currencyConverter(resultSeller.currency.isocode, 'USD');
        try{
          let order = await Order.create({
            totalOrder:total,
            totalShipping: cart.shipping ? cart.shipping : 0,
            totalProducts:carttotal,
            totalDiscount:totaldiscount,
            productsDiscount:productsdiscount,
            conversionRate: exchangeRate.result,
            customer:user.id,
            addressDelivery: address ? address.id : null,
            cart:cart.id,
            currentstatus:await sails.helpers.orderState(payment.data.estado),
            paymentMethod:inputs.data.method,
            paymentId:payment.data.ref_payco,
            paymentOption:extra,
            seller:seller,
            carrier: carrier && carrier.id ? carrier.id : null,
            channel:payment.data.channel ? payment.data.channel : 'direct',
            channelref:payment.data.channelref ? payment.data.channelref : '',
            integration:payment.data.integration ? payment.data.integration : null,
            modeMeli: payment.data.mode ? payment.data.mode: '',
            shippingMeli: payment.data.shipping ? payment.data.shipping : '',
            receiverId: payment.data.receiverId ? payment.data.receiverId : '',
            packId: payment.data.packId
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
            commission = commissionDiscount.length > 0 ? commissionDiscount[0].value : commissionChannel.length > 0 ? commissionChannel[0].value : 20;
          }else{
            commission = 20;
          }
          orders.push(order);
          let oitems = [];
          for(let cp of sellerproducts){
            let oi = await OrderItem.create({
              order:order.id,
              product:cp.product.id,
              productvariation:cp.productvariation.id,
              price:cp.totalPrice,
              discount:cp.totalDiscount,
              originalPrice:cp.productvariation.price,
              externalReference:cp.externalReference,
              commission: commission,
              shippingType: cp.shippingType ? cp.shippingType : '',
              externalOrder:payment.data.channelref ? payment.data.channelref : '',
              currentstatus: await sails.helpers.orderState(payment.data.estado)
            }).fetch();

            let pv = await ProductVariation.findOne({id:cp.productvariation.id}).populate('product');            
            if(pv){

              oitems.push({
                'item_name' : pv.product.name,
                'item_id': pv.id,
                'item_brand': (await Manufacturer.findOne({id:pv.product.manufacturer})).name,
                'item_reference': pv.product.reference,
                'item_category': (await Category.findOne({id:pv.product.mainCategory})).name,
                'item_color': (await Color.findOne({id:pv.product.mainColor})).name,
                'item_seller': (await Seller.findOne({id:pv.product.seller})).name,
                'price': oi.price,
                'quantity': 1,
              });

              let quantity = pv.quantity-=1;
              let updated = await ProductVariation.updateOne({id:pv.id}).set({quantity: quantity < 0 ? 0 : quantity});
              let uproduct = await Product.findOne({id:updated.product});
              await sails.helpers.channel.channelSync(uproduct);
            }
          }
          order.products = oitems;
          await sails.helpers.notification(order, order.currentstatus.id);
        }catch(err){
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