module.exports = {

  friendlyName: 'Category children',
  description: '',
  inputs: {
    id:{type:'number'}
  },
  exits: {
    success: {
      description: 'All done.',
    },
  },
  fn: async function (inputs, exits) {
    let childs = await Category.findOne({id:inputs.id}).populate('children');
    return exits.success(childs);
  }

};

