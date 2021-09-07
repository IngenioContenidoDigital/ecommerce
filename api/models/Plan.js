/**
 * Plan.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  attributes: {
    name:{
      type:'string',
      required:true
    },
    pricecop:{
      type:'number',
      required:true
    },
    pricemx:{
      type:'number',
      required:true
    },
    pricesubscriptioncop:{
      type:'number',
      required:true
    },
    pricesubscriptionmx:{
      type:'number',
      required:true
    }
  },
};
