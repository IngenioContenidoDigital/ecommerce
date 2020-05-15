/**
 * Sequence.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
    num: { type: 'number' }
  },
  next (id, cb) {
    var db = Sequence.getDatastore().manager;
    var collection = db.collection('num');

    collection.findAndModify(
        { _id: id },
        [[ '_id', 'asc' ]],
        { $inc: { num : 1 }},
        { new: true, upsert : true },
        (err, data) => cb(err, data.value.num)
    );
  }

};

