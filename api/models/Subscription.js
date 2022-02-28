/**
 * Subscription.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  attributes: {
    reference:{type:'string', required : true},
    currentPeriodStart: {type:'string'},
    currentPeriodEnd: {type:'string'},
    state: {type:'string'},
    seller: {model:'seller'},
    plan:{model:'plan'},
    daysPastdue: {type:'number',defaultsTo:0}
  }
};
