/**
 * Variation.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
    name:{type:'string',required:true, maxLength:15},
    cm:{type:'number', defaultsTo:0},
    col:{type:'string'},
    us:{type:'string'},
    eu:{type:'string'},
    wide:{
      type:'number', defaultsTo:0
    },
    gender:{
      model:'gender'
    },
    category:{
      model:'category'
    }
  },

};

