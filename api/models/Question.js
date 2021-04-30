/**
 * Question.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  attributes: {
    idMl: {type:'string'},
    seller: {model:'seller'},
    text: {type:'string'},
    status: {type:'string'},
    dateCreated: {type:'number'},
    product: {model:'product'},
    answers:{
      collection:'answer',
      via:'question'
    },
    conversation: {model:'conversation'},
    integration:{ model:'integrations' },
    attachments:{
      collection:'attachment',
      via:'question'
    },
    senderRole:{type:'string'}
  },
};
