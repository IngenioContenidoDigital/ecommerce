/**
 * Manufacturer.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {

    name:{type:'string', required:true, unique:true},
    linioname:{type:'string'},
    logo:{type:'string'},
    description:{type:'string'},
    active:{type:'boolean', required:true},
    url:{type:'string'},
    products:{
      collection:'product',
      via:'manufacturer'
    }
  },

};

