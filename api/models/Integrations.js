/**
 * Integrations.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
    channel:{model:'channel'},
    url:{
      type:'string',
      required:false,
    },
    name:{
      type:'string',
      required : true
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
    useridml:{
      type:'string'
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

