
/**
 * ProductChannel.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
    attributes: {
        product:{
            model:'product'
        },
        channel:{ model:'channel' },
        integrations:{ model:'integrations' },
        channelid:{ type:'string' },
        status:{ type:'boolean' },
        qc:{ type:'boolean' },
        price:{ type:'number' }
    }
};