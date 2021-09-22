/**
 * UserNotification.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */
module.exports = {
  attributes: {
    user:{model:'user'},
    state:{model:'orderstate'},
    sms:{type:'boolean',defaultsTo:false},
    email:{type:'boolean',defaultsTo:false},
    feature: {type:'string', isIn: ['orderupdate', 'productnew'], defaultsTo:''}
  }
};
