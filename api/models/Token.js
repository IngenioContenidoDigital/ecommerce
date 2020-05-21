/**
 * Token.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
    token:{type:'string'},
    customerId:{type:'string'},
    docType:{type:'string'},
    docNumber:{type:'string'},
    name:{type:'string'},
    mask:{type:'string'},
    frch:{type:'string'},
    dues:{type:'string'},
    user:{
      model:'user',
      required:true,
    }

  },

};

