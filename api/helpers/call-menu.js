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
    let navmenu = {};
    let filter = {active:true};
    let navbar = `<div class="navbar-item has-dropdown is-hoverable">
      <div class="navbar-link is-uppercase is-size-7"><a class="has-text-dark" href="#">Categorías</a></div>
        <div class="navbar-dropdown">`

    let navbarmobile =`<aside class="menu">`;
    let cids = [];
    if(inputs.hostname !== undefined && inputs.hostname !== '' && inputs.hostname!=='iridio.co' && inputs.hostname!=='localhost' && inputs.hostname!=='1ecommerce.app'){
      seller = await Seller.findOne({domain:inputs.hostname,active:true}); 
      let categories = await Category.find({
        where: {active:true},
        select: ['name','url']
      }).populate('products',{seller:seller.id,active:true});
      for(let c of categories){
        if(!cids.includes(c.id) && c.products.length>0){
          cids.push(c.id);
        }
      }
      filter.id=cids;
    }

      menu = await Category.findOne({
        where:{name:'inicio'},
        select:['name','url']
      })
      .populate('children',{
        where: filter,
        select: ['name','url']
      });

      for(let c of menu.children){
        c = await Category.findOne({id:c.id,active:true})
        .populate('children',{
          where: filter,
          select: ['name','url']
        });

        navbar+=`
        <div class="nested navbar-item dropdown has-dropdown">
      <div class="dropdown-trigger">
        <span class="is-uppercase has-text-dark is-size-7">`+c.name+`</span>
      </div>
      <div class="dropdown-menu" id="dropdown-menu" role="menu">
        <div class="dropdown-content">`;

        navbarmobile +=`<ul class="menu-list"><li><a class="is-size-7 menu-item">`+c.name.toUpperCase()+`</a><ul class="is-hidden">`;

        for(let d of c.children){
          navbar +=`<a href="/ver/categoria/`+d.url+`" class="dropdown-item is-uppercase is-size-7">`+d.name+`</a>`;
          navbarmobile +=`<li><a class="is-size-7" href="/ver/categoria/`+d.url+`">`+d.name.toUpperCase()+`</a></li>`;  
        }
        navbar +=`
            </div>
          </div>
        </div>` 
        
        navbarmobile +=`</ul></li></ul>`;
      }
      navbar += `
        </div>
      </div>`;

      navbarmobile += `</aside>`;
    
      navmenu.navbar = navbar;
      navmenu.navbarmobile = navbarmobile;
    return exits.success(navmenu);
  }

};

