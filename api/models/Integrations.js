/**
 * Integrations.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {

    channel:{
      type:'string',
      required:true
    },
    url:{
      type:'string',
      required:true,
    },
    user:{
      type:'string',
      required : false
    },
    key:{
      type:'string',
      required:true
    },
    secret:{
      type:'string',
      required:true
    },
    seller:{
      model:'seller',
      required:true
    },
    version:{
      type:'string'
    }
  },

};

