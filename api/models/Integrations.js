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
      required:false,
    },
    user:{
      type:'string',
     /* required : true*/
    },
    key:{
      type:'string',
      required:true
    },
    secret:{
      type:'string',
      required:false
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

