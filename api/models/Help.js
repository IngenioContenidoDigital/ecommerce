/**
 * Help.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
    section:{
      type:'string',
      isIn:['catalog','logistics','discounts','orders'],
      required:true
    },
    name:{
      type:'string',
      required:true,
      unique:true
    },
    source:{
      type:'string'
    }

  },

};

