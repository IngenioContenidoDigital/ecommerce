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
    products:{
      collection:'product',
      via:'discount'
    }

  },

};

