/**
 * User.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
    emailAddress: {type:'string', required:true, unique:true, isEmail:true},
    emailStatus: {type:'string', isIn: ['unconfirmed',  'confirmed'], defaultsTo:'unconfirmed'},
    password: {type:'string',required:true, protect: true},
    fullName: {type:'string'},
    verification:{type:'string', minLength:6, maxLength:6},
    isSuperAdmin: {type:'boolean', defaultsTo:false},
  },
  customToJSON: function() {
    return _.omit(this, ['password']);
  },

};

