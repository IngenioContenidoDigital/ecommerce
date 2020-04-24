/**
 * ProductVariation.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
    product:{
      model:'product'
    },
    variation:{
      model:'variation'
    },
    reference:{type:'string'},
    supplierreference:{type:'string'},
    ean13:{type:'number', max:9999999999999, isInteger:true},
    upc:{type:'number', max:999999999999, isInteger:true},
    price:{type:'number'},
    quantity:{type:'number', min:0,isInteger:true, defaultsTo:0}

  },

};

