module.exports = {
  friendlyName: 'Categorize',
  description: 'Categorize Products from List.',
  inputs: {
    categories:{
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
    let list = 'Inicio,'+inputs.categories;
    let result = {};

    let clist = list.replace(/\,(\s)+/gi,',').toLowerCase().split(',');
    clist = clist.map(r => r.trim());
    let categories = await Category.find({
      where: {name: clist},
      sort: 'level DESC'
    });
    let categoriesids = [];
    for(let c in categories){
      if(!categoriesids.includes(categories[c].id)){
        categoriesids.push(categories[c].id);
      }
    }
    let realcats = categories.filter(cat => categoriesids.includes(cat.parent));
    let rcatsids=[];
    for(let rc in realcats){
      if(!rc.includes(realcats[rc].id)){
        rcatsids.push(realcats[rc].id);
      }
    }
    
    result.categories = rcatsids;
    result.mainCategory = categories[0].id;
    return exits.success(result);
  }
};

