/**
 * Category.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {

    name:{type:'string', required:true},
    logo:{type:'string'},
    description:{type:'string'},
    tags:{type:'string'},
    active:{type:'boolean', required:true},
    url:{type:'string'},
    level:{type:'number'},
    hasChildren:{type:'boolean'},
    dafiti:{type:'string'},
    nameMercadolibre:{type:'string'},
    mercadolibre:{type:'string'},
    mercadolibremx:{type:'string'},
    linio:{type:'string'},
    liniomx:{type:'string'},
    walmart:{type:'string'},
    shopee:{type:'string'},
    parent:{
      model:'category'
    },
    children:{
      collection:'category',
      via:'parent'
    },
    products:{
      collection:'product',
      via:'categories'
    },
    features:{
      collection:'feature',
      via:'categories'
    }

  },

};

