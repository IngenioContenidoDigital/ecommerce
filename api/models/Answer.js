/**
 * Answer.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  attributes: {
    idAnswer: {type:'string'},
    text: {type:'string'},
    status: {type:'string'},
    dateCreated: {type:'number'},
    question: {model:'question'},
    attachments:{
      collection:'attachment',
      via:'answer'
    }
  },
};
