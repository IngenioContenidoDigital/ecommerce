
/**
 * ProductChannel.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
    attributes: {
        channel:{ model:'channel' },
        channelname:{ type:'string' },
        feature:{ model:'feature' },
        name:{ type:'string' }
    }
};
