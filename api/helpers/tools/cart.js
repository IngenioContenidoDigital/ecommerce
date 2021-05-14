module.exports = {
  friendlyName: 'Cart Products',
  description: 'Update Actual Products in Cart',
  inputs: {
    req:{
      type:'ref',
      requiered:true
    },
    cart:{
      type:'string',
      required:true
    }
  },
  exits: {
    success: {
      description: 'All done.',
    },
  },
  fn: async function (inputs,exits) {
    let cartproducts = [];
    let elements = await CartProduct.find({cart:inputs.cart})
    .populate('product');

    if(elements.length>0){
      for(let item of elements){
        cartproducts.push({
          'item_name' : item.product.name,
          'item_id': item.productvariation,
          'item_brand': (await Manufacturer.findOne({id:item.product.manufacturer})).name,
          'item_reference': item.product.reference,
          'item_category': (await Category.findOne({id:item.product.mainCategory})).name,
          'item_color': (await Color.findOne({id:item.product.mainColor})).name,
          'item_seller': (await Seller.findOne({id:item.product.seller})).name,
          'price': item.totalPrice,
          'quantity': 1,
        });
      }
      inputs.req.session.cart.products = cartproducts;
    }else{
      inputs.req.session.cart.products = null;
    }
    return exits.success(inputs.req.session.cart.products);
  }
};

