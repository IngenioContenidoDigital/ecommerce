/**
 * Attachments.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  attributes: {
    filename:{type:'string',required:true},
    name:{type:'string'},
    type:{type:'string',required:true},
    question:{model:'question'},
    answer:{model:'answer'}
  },
};
