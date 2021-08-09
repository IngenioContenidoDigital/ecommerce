/**
 * Document.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  attributes: {
    file:{type:'string',required:true},
    name:{type:'string'},
    seller:{
      model:'seller'
    }
  },
};
