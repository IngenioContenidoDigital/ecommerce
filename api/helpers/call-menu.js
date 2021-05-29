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
    let productfilter={active:true};   

      let navbar = `<div class="navbar-item has-dropdown is-hoverable">
      <div class="navbar-link is-uppercase is-size-7"><a class="has-text-dark" href="#">Categorías</a></div>
        <div class="navbar-dropdown">`

    let navbarmobile =`<aside class="menu">`;
    let cids = [];
    if(inputs.hostname !== undefined && inputs.hostname !== '' && inputs.hostname!=='iridio.co' && inputs.hostname!=='demo.1ecommerce.app' && inputs.hostname!=='localhost' && inputs.hostname!=='1ecommerce.app'){
      seller = await Seller.findOne({domain:inputs.hostname,active:true}); 
      productfilter.seller=seller.id;
    }

    let categories = await Category.find({
      where: {active:true},
      select: ['name','url']
    }).populate('products',productfilter);
    for(let c of categories){
      if(!cids.includes(c.id) && c.products.length>0){
        cids.push(c.id);
      }
    }
    filter.id=cids;

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

        navbarmobile +=`<ul class="menu-list"><li>`;

        if(c.children.length>0){
          navbarmobile +=`<a class="is-size-7 menu-item">`+c.name.toUpperCase()+`</a>`
          navbarmobile +=`<ul class="menu-list is-hidden">`;

          navbar+=`
        <div class="nested navbar-item dropdown has-dropdown">
      <div class="dropdown-trigger">
        <span class="is-uppercase has-text-dark is-size-7">`+c.name+`</span>
      </div>
      <div class="dropdown-menu" id="dropdown-menu" role="menu">
        <div class="dropdown-content">`;

          for(let d of c.children){
            d = await Category.findOne({id:d.id,active:true})
            .populate('children',{
              where: filter,
              select: ['name','url']
            });

            if(d.children.length>0){
              navbarmobile +=`<li><a class="is-size-7 menu-item">`+d.name.toUpperCase()+`</a>`;
              navbarmobile+=`<ul class="menu-list is-hidden">`;

              navbar+=`
        <div class="nested navbar-item dropdown has-dropdown">
      <div class="dropdown-trigger">
        <span class="is-uppercase has-text-dark is-size-7">`+d.name+`</span>
      </div>
      <div class="dropdown-menu" id="dropdown-menu" role="menu">
        <div class="dropdown-content">`;

              for(let e of d.children){
                navbarmobile +=`<li><a class="is-size-7" href="/ver/categoria/`+e.url+`">`+e.name.toUpperCase()+`</a></li>`;
                navbar+=`<a href="/ver/categoria/`+e.url+`" class="dropdown-item is-uppercase is-size-7">`+e.name.toUpperCase()+`</a>`
              }

              navbarmobile+=`</ul></li>`;
              navbar +=`
            </div>
          </div>
        </div>`;
            }else{
              navbarmobile +=`<li><a class="is-size-7" href="/ver/categoria/`+d.url+`">`+d.name.toUpperCase()+`</a></li>`;
              navbar+=`<a href="/ver/categoria/`+d.url+`" class="dropdown-item is-uppercase is-size-7">`+d.name.toUpperCase()+`</a>`;
            }
          }
          navbarmobile +=`</ul>`;
          
          navbar +=`
            </div>
          </div>
        </div>`;
        }else{
          navbarmobile +=`<a href="/ver/categoria/`+c.url+`" class="is-size-7 menu-item">`+c.name.toUpperCase()+`</a>`;
          navbar+=`<a href="/ver/categoria/`+c.url+`" class="dropdown-item is-uppercase is-size-7">`+c.name.toUpperCase()+`</a>`;
        } 
        navbarmobile +=`</li></ul>`;
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

