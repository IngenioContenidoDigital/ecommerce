/**
 * Conversation.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  attributes: {
    name: {type:'string'},
    identifier: {type:'string'},
    recipient: {type:'string'},
    integration:{ model:'integrations' },
    questions:{
      collection:'question',
      via:'conversation'
    }
  }
};
