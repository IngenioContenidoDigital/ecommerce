/**
 * Address.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
    name:{
      type:'string',
      required:true,
    },
    addressline1:{
      type:'string',
      required: true
    },
    addressline2:{
      type:'string',
    },
    country:{
      model:'country',
      required:true
    },
    region:{
      model:'region',
      required:true
    },
    city:{
      model:'city',
      required:true
    },
    zipcode:{
      type:'string',
    },
    notes:{
      type:'string',
    },
    user:{
      model:'user'
    },

  },

};

