/**
 * Invoice.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  attributes: {
    reference:{type:'string', required : true},
    invoice: {type:'string'},
    state:{
      model:'orderstate',
      required:true,
    },
    paymentMethod: {type:'string'},
    total:{type:'number'},
    tax:{type:'number'},
    seller: {model:'seller'},
    idSiigo:{type:'string', defaultsTo:''},
  }
};
