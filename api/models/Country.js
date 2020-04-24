/**
 * Country.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
    name:{
      type:'string',
      required:true
    },
    iso:{
      type:'string',
      required:true
    },
    prefix:{
      type:'string'
    },
    active:{type:'boolean', required:true},

  },

};

