/**
 * ReportSkuPrice.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  attributes: {
    month: {type:'string'},
    seller: {model:'seller'},
    price:{type:'number',defaultsTo:0},
    totalProducts:{type:'number',defaultsTo:0}
  }
};
