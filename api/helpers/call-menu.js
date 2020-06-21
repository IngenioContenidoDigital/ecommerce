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
    .populate('children',{active:true});
    for(let c in menu.children){
      menu.children[c] = await Category.findOne({id:(menu.children[c]).id,active:true})
      .populate('parent')
      .populate('children',{active:true});
      for(let d in menu.children[c].children){
        menu.children[c].children[d] = await Category.findOne({id:(menu.children[c].children[d]).id,active:true})
        .populate('parent')
        .populate('children',{active:true});
      }
    }
    return exits.success(menu);
  }


};

