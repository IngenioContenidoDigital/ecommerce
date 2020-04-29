/**
 * Region.js
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
    country:{
      model:'country',
      required:true
    },
    cities:{
      collection:'city',
      via: 'region'
    },
    active:{type:'boolean', required:true},
  },

};

