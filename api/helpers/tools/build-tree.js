module.exports = {
  friendlyName: 'Build tree',
  description: 'Build category tree from bottom to top at level 2',
  inputs: {
    category:{
      type:'string',
      required:true
    }
  },
  exits: {
    success: {
      description: 'All done.',
    },
  },
  fn: async function (inputs,exits) {
    let results = [];
    let buildTree = async (ct) => {
      let cat = await Category.findOne({id:ct});

      if(cat.level>1 && !results.includes(cat.id)){
        results.push(cat.id);
        await buildTree(cat.parent);
      }else{
        return;
      }
    }
    await buildTree(inputs.category);
    return exits.success(results);
  }
};

