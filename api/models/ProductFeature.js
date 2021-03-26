
/**
 * ProductChannel.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
    attributes: {
        product:{ model:'product' },
        feature:{ model:'feature' },
        value:{ type:'string' }
    }
};
