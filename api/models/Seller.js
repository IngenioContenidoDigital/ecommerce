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
    rut:{type:'string'},
    cc:{type:'string'},
    auth1ecom:{type:'string'},
    ccr:{type:'string'},
    cbanco:{type:'string'},
    active:{type:'boolean', required:true},
    contact:{type:'string'},
    email:{type:'string', required:true, isEmail:true, unique:true},
    phone:{type:'number'},
    domain:{type:'string',required:true, unique:true},
    tagManager:{type:'string'},
    mainAddress:{
      model:'address'
    },
    suppliers:{
      collection:'supplier',
      via:'sellers'
    }

  },

};

