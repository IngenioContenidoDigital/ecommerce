/**
 * Campaign.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  attributes: {
    campaignid:{type:'string'},
    name:{type:'string'},
    userid:{type:'string'},
    budget:{type:'number'},
    status:{type:'string', isIn: ['active', 'paused']},
    integration:{model:'integrations'},
    seller:{model:'seller'}
  },
};
