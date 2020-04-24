/**
 * Supplier.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
    name:{type:'string', required:true, unique:true},
    dni:{type:'string', required:true, unique:true},
    active:{type:'boolean', required:true},
    contact:{type:'string'},
    email:{type:'string', required:true, isEmail:true, unique:true},
    phone:{type:'number'},
    sellers:{
      collection:'seller',
      via:'suppliers'
    },
    products:{
      collection:'product',
      via:'suppliers'
    }
  },

};

