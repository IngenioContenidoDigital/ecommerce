/**
 * Cart.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
    shipping:{
      type:'number',
      defaultsTo:0,
    },
    discount:{
      model:'cartdiscount'
    }
  },

};

