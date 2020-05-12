/**
 * CartDiscount.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {

    name:{
      type:'string',
      required:true
    },
    code:{
      type:'string',
      required:true,
      unique:true
    },
    from:{
      type:'number',
      required:true
    },
    to:{
      type:'number',
      required:true
    },
    type:{
      type:'string',
      isIn: ['P', 'C']
    },
    value:{
      type:'number',
      required:true
    },
    user:{
      model:'user'
    },
    active:{
      type:'boolean',
      defaultsTo:true,
    }

  },

};

