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
    group:{type:'string'},
    active:{type:'boolean',required:true},
    price:{type:'number',defaultsTo:0},
    tax:{model:'tax'},
    mainCategory: {model:'category'},
    mainColor: {model:'color'},
    manufacturer: {model:'manufacturer'},
    gender:{model:'gender'},
    width:{type:'number'},
    height:{type:'number'},
    length:{type:'number'},
    weight:{type:'number'},
    externalId:{type:'string'},
    stock:{type:'boolean',defaultsTo:false},
    seller: {model:'seller'},
    activity:{type:'string'},
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
    channels:{
      collection:'productchannel',
      via:'product'
    },
    features:{
      collection:'productfeature',
      via:'product'
    },
    suppliers:{
      collection:'supplier',
      via:'products'
    },
    discount:{
      collection:'catalogdiscount',
      via:'products'
    },
    details:{type:'string',defaultsTo:''},
    delete:{type:'boolean',required:false}
  },
};

