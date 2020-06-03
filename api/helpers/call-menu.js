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
    let menu = await Category.findOne({name:'Inicio'})
    .populate('children');
    for(let c in menu.children){
      menu.children[c] = await Category.findOne({id:(menu.children[c]).id,active:true})
      .populate('parent')
      .populate('children');
      for(let d in menu.children[c].children){
        menu.children[c].children[d] = await Category.findOne({id:(menu.children[c].children[d]).id,active:true})
        .populate('parent')
        .populate('children');
      }
    }
    return exits.success(menu);
  }


};

