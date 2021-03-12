/**
 * Conversation.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  attributes: {
    identifier: {type:'string'},
    recipient: {type:'string'},
    seller: {model:'seller'},
    integration:{ model:'integrations' }
  }
};
