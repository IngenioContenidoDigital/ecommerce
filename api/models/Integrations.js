/**
 * Integrations.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
    channel:{model:'channel'},
    url:{
      type:'string',
      required:false,
    },
    name:{
      type:'string',
      required : true
    },
    user:{
      type:'string',
      /* required : true*/
    },
    key:{
      type:'string',
      required:false
    },
    secret:{
      type:'string',
      required:false
    },
    useridml:{
      type:'string'
    },
    shopid:{
      type:'string'
    },
    seller:{
      model:'seller',
      required:true
    },
    discount:{
      collection:'catalogdiscount',
      via:'integrations'
    },
    version:{
      type:'string'
    },
    product_creation_webhookId:{
      type:'string', required:false
    },
    product_updates_webhookId:{
      type:'string', required:false
    },
    product_webhook_status:{
      type:'boolean', required:false
    },
    order_updated_webhookId:{
      type:'string', required:false
    },
    order_webhook_status:{
      type:'boolean', required:false
    },
    priceAdjustment:{type:'number', defaultsTo:0},
    priceDiscount:{type:'number', defaultsTo:0}
  },
};

