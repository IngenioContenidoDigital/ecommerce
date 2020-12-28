/**
 * OrderItem.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {

    order:{model:'order'},
    product:{model:'product'},
    productvariation:{model:'productvariation'},
    commission:{
      type:'number'
    },
    price:{
      type:'number'
    },
    discount:{
      type:'number'
    },
    originalPrice:{
      type:'number'
    },
    externalReference:{
      type:'string'
    }

  },

};

