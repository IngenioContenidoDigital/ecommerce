/**
 * City.js
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
    code:{
      type:'string'
    },
    region:{
      model:'region',
      required:true
    },
    active:{type:'boolean', required:true},

  },

};

