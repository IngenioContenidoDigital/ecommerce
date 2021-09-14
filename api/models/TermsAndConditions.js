/**
 * TermsAndConditions.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */
module.exports = {
  attributes: {
    date:{type:'string', required:true},
    hour:{type:'string', required:true},
    mac:{type:'string', required:true},
    ip:{type:'string', required:true},
    accept:{type:'boolean', defaultsTo:false},
    seller:{model:'seller'}
  },
};
