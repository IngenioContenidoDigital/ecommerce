/**
 * Slider.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {

    name:{type:'string', required:true, unique:true},
    position:{type:'string',isIn: ['main', 'featured','vertical','bottom','wide','middle','tall']},
    image:{type:'string', required:true},
    url:{type:'string'},
    text:{type:'string'},
    textColor:{model:'color'},
    active:{type:'boolean', defaultsTo:false},
    seller:{model:'seller'},

  },

};

