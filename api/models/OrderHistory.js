/**
 * OrderHistory.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {

    order:{
      model:'order',
      required:true
    },
    state:{
      model:'orderstate',
      required:true
    },
    user:{
      model:'user',
    }

  },

};

