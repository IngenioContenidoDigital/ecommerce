/**
 * Seller.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {

    name:{type:'string', required:true, unique:true},
    dni:{type:'string', required:true, unique:true},
    logo:{type:'string'},
    active:{type:'boolean', required:true},
    contact:{type:'string'},
    email:{type:'string', required:true, isEmail:true, unique:true},
    phone:{type:'number'},
    domain:{type:'string'},
    tagManager:{type:'string'},
    salesCommission:{type:'number', defaultsTo:0},
    skuPrice:{type:'number', defaultsTo:0},
    activeSku:{type:'boolean', defaultsTo:false},
    integrationErp:{type:'boolean', defaultsTo:false},
    safestock:{type:'number', defaultsTo:0},
    currency:{
      model:'currency'
    },
    mainAddress:{
      model:'address'
    },
    suppliers:{
      collection:'supplier',
      via:'sellers'
    }

  },

};

