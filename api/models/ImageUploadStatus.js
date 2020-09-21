/**
 * Category.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
    attributes: {
      uploaded:{type:'boolean', defaultsTo:false},
      cover : {type:'boolean', defaultsTo:false},
      images : { type:'ref' },
      file : {type : 'string'},
      position  :  { type:'number' },
      product:{
        model:'product'
      }
    }
  };
  
  