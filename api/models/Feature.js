/**
 * Color.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
    name:{type:'string', required:true, unique:true},
    description:{type:'string'},
    active:{type:'boolean', required:true},
    categories:{
      collection:'category',
      via:'features'
    },
    channels:{
      collection:'featurechannel',
      via:'feature'
    },
  },

};

