/**
 * Plan.js
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
    price:{
      type:'number',
      required:true
    },
    pricesubscription:{
      type:'number',
      required:true
    },
    trialDays:{
      type:'number',
      required:true
    },
    description:{
      type:'string',
      required:true
    },
    products:{
      type:'string',
      required:true
    },
    channels:{
      type:'string',
      required:true
    },
    onboarding:{
      type:'string',
      required:true
    },
    erp:{
      type:'string',
      required:true
    },
    support:{
      type:'string',
      required:true
    },
    visible:{type:'boolean',required:true}
  },
};
