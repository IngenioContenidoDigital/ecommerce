/**
 * CatalogDiscount.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {

    name:{
      type:'string'
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
    seller:{
      model:'seller',
      required:true
    },
    manufacturer:{
      model:'manufacturer'
    },
    color:{
      model:'color'
    },
    gender:{
      model:'gender'
    },
    category:{
      model:'category'
    },
    products:{
      collection:'product',
      via:'discount'
    }

  },

};

