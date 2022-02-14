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
    nameErp:{type:'string'},
    retIca:{type:'number', defaultsTo:0},
    retFte:{type:'number', defaultsTo:0},
    safestock:{type:'number', defaultsTo:0},
    idSiigo:{type:'string', defaultsTo:''},
    currency:{
      model:'currency'
    },
    plan:{
      model:'plan'
    },
    mainAddress:{
      model:'address'
    },
    suppliers:{
      collection:'supplier',
      via:'sellers'
    },
    documents:{
      collection: 'documentseller',
      via: 'seller'
    },
  },

};

