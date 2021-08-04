/**
 * CommissionChannel.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

 module.exports = {
  attributes: {
    value:{type:'number',required:true},
    channel:{model:'channel',required:true},
    seller:{model:'seller',required:true},
    collect:{type:'boolean', defaultsTo:false},
  }
};
