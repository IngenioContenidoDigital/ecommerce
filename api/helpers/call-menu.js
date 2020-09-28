module.exports = {
  friendlyName: 'Call menu',
  description: '',
  inputs: {
    hostname:{
      type:'string'
    }
  },
  exits: {
    success: {
      description: 'All done.',
    },
  },
  fn: async function (inputs,exits) {
    let seller = null;
    let menu = null;
    if(inputs.hostname === undefined || inputs.hostname === '' || req.hostname==='iridio.co' || req.hostname==='localhost' || inputs.hostname==='1ecommerce.app'){
      menu = await Category.findOne({name:'inicio'})
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
    }else{
      seller = await Seller.findOne({domain:inputs.hostname});
      let cids = [];
      let categories = await Category.find({active:true}).populate('products',{seller:seller.id});

      for(let c of categories){
        if(!cids.includes(c.id) && c.products.length>0){
          cids.push(c.id);
        }
      }

      menu = await Category.findOne({name:'inicio'})
      .populate('children',{id:cids, active:true});
      for(let c in menu.children){
        menu.children[c] = await Category.findOne({id:(menu.children[c]).id,active:true})
        .populate('parent')
        .populate('children',{id:cids,active:true});
        for(let d in menu.children[c].children){
          menu.children[c].children[d] = await Category.findOne({id:(menu.children[c].children[d]).id,active:true})
          .populate('parent')
          .populate('children',{id:cids,active:true});
        }
      }
    }
    return exits.success(menu);
  }


};

