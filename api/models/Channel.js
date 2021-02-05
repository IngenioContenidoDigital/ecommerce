/**
 * Channel.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
    name:{type:'string'},
    logo:{type:'string'},
    endpoint:{type:'string'},
    type:{
      type:'string',
      isIn:['marketplace','cms','messenger'],
      required:true
    },
    currency:{
      model:'currency'
    }
  },
};
