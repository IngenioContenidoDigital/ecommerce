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
      required:true,
    },
    key:{
      type:'string',
      required:true
    },
    seller:{
      model:'seller',
      required:true
    }

  },

};

