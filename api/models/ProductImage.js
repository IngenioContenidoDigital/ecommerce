/**
 * ProductImage.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {

    file:{type:'string',required:true},
    position:{type:'number'},
    cover:{type:'number', required:true},
    product:{
      model:'product'
    }

  },

};

