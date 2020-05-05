/**
 * Category.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {

    name:{type:'string', required:true, unique:true},
    logo:{type:'string'},
    description:{type:'string'},
    active:{type:'boolean', required:true},
    url:{type:'string'},
    level:{type:'number'},
    hasChildren:{type:'boolean'},
    parent:{
      collection:'category',
      via: 'children'
    },
    children:{
      collection:'category',
      via:'parent'
    },
    products:{
      collection:'product',
      via:'categories'
    }

  },

};

