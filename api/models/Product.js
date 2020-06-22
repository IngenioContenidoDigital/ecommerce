/**
 * Product.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {

    name: {type:'string'},
    reference:{type:'string'},
    description:{type:'string'},
    descriptionShort:{type:'string'},
    active:{type:'boolean',required:true},
    price:{type:'number'},
    tax:{model:'tax'},
    mainCategory: {model:'category'},
    mainColor: {model:'color'},
    manufacturer: {model:'manufacturer'},
    gender:{model:'gender'},
    width:{type:'number'},
    height:{type:'number'},
    length:{type:'number'},
    weight:{type:'number'},
    stock:{type:'boolean',defaultsTo:false},
    seller: {model:'seller'},
    dafitiprice:{type:'number', defaultsTo:0},
    dafitistatus:{type:'boolean', defaultsTo:false},
    dafiti:{type:'boolean', defaultsTo:false},
    mlprice:{type:'number', defaultsTo:0},
    mlstatus:{type:'boolean', defaultsTo:false},
    ml:{type:'boolean', defaultsTo:false},
    mlid:{type:'string',defaultsTo:''},
    categories:{
      collection:'category',
      via:'products'
    },
    images:{
      collection: 'productimage',
      via: 'product'
    },
    variations:{
      collection:'productvariation',
      via:'product'
    },
    suppliers:{
      collection:'supplier',
      via:'products'
    },
    discount:{
      collection:'catalogdiscount',
      via:'products'
    }

  },

};

