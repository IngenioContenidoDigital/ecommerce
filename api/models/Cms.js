/**
 * Cms.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
    name:{
      type:'string',
      required:true,
      unique:true
    },
    url:{
      type:'string',
      required:true
    },
    active:{
      type:'boolean',
      defaultsTo:false
    },
    content:{
      type:'string',
      required:true
    },
    position:{
      type:'string'
    },
    seller:{
      model:'seller'
    }
  },

};

