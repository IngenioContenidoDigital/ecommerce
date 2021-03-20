/**
 * CartProduct.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  attributes: {
    cart:{model:'cart'},
    product:{model:'product'},
    productvariation:{model:'productvariation'},
    totalDiscount:{type:'number',defaultsTo:0},
    totalPrice:{type:'number',defaultsTo:0},
    externalReference:{type:'string'},
    shippingType: {type:'string'}
  },
};
