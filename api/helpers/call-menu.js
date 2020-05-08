module.exports = {
  friendlyName: 'Call menu',
  description: '',
  inputs: {
  },
  exits: {
    success: {
      description: 'All done.',
    },
  },
  fn: async function (inputs,exits) {
    let menu = await Category.findOne({name:'Inicio'}).populate('children');
    for(let c of menu.children){
      c.children = await Category.findOne({id:c.id}).populate('children');
    }
    return exits.success(menu);
  }


};

