/**
 * CommissionDiscount.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  attributes: {
    from:{
      type:'number',
      required:true
    },
    to:{
      type:'number',
      required:true
    },
    value:{
      type:'number',
      required:true
    },
    seller:{
      model:'seller',
      required:true
    }
  },
};
