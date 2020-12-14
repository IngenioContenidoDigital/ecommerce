/**
 * Seed Function
 * (sails.config.bootstrap)
 *
 * A function that runs just before your Sails app gets lifted.
 * > Need more flexibility?  You can also create a hook.
 *
 * For more information on seeding your app with fake data, check out:
 * https://sailsjs.com/config/bootstrap
 */

module.exports.bootstrap = async function() {
  const { SHOPIFY_PRODUCTS } = require('../api/graphql/subscriptions/shopify');
  const { VTEX_PRODUCTS } = require('../api/graphql/subscriptions/vtex');

  sails.on('lifted', async ()=>{
    await sails.helpers.subscription({ subscription : SHOPIFY_PRODUCTS, callback : async (response)=>{
      if (response.data.ShopifyProducts) {
        let result = response.data.ShopifyProducts;
        let integration = await Integrations.findOne({channel: result.channel, key: result.key});
        if (integration) {
          let product = await sails.helpers.marketplaceswebhooks.findProductGraphql(
            integration.channel,
            integration.key,
            integration.secret,
            integration.url,
            integration.version,
            'PRODUCTID',
            result.productId
          ).catch((e) => console.log(e));
          if (product) {
            await sails.helpers.marketplaceswebhooks.product(product, integration.seller).catch((e)=>console.log(e));
          }
        }
      }
    }});
    await sails.helpers.subscription({ subscription : VTEX_PRODUCTS, callback : async (response)=>{
      if (response.data.VtexProducts) {
        let result = response.data.VtexProducts;
        let integration = await Integrations.findOne({channel: result.channel, key: result.key});
        if (integration) {
          let product = await sails.helpers.marketplaceswebhooks.findProductGraphql(
            integration.channel,
            integration.key,
            integration.secret,
            integration.url,
            integration.version,
            'PRODUCTID',
            result.productId
          ).catch((e) => console.log(e));
          if (product) {
            await sails.helpers.marketplaceswebhooks.product(product, integration.seller).catch((e)=>console.log(e));
          }
        }
      }
    }});
  });
  // By convention, this is a good place to set up fake data during development.
  if (await Profile.count() < 1) {
    await Profile.createEach([
      {name:'superadmin'},
      {name:'customer'},
    ]);
  }
  if (await User.count() < 1) {
    await User.create({emailAddress: 'luis.quinones@ingeniocontenido.co', emailStatus:'confirmed', password: await sails.helpers.passwords.hashPassword('L0f3q2n21982**'), mobile:3212163935,fullName: 'Luis Felipe Quiñones Nieto', profile:(await Profile.findOne({name:'superadmin'})).id});
  }

  if(await Category.count()<1){
    await Category.create({name:'inicio',description:'Categoria Raiz',active:true,url:'inicio',level:1});
  }

  if(await Tax.count()<1){
    await Tax.create({name:'Sin impuestos',value:0});
  }

  if(await Gender.count()<1){
    await Gender.createEach([
      {name:'masculino'},
      {name:'femenino'},
      {name:'niños'},
      {name:'niñas'},
      {name:'bebés'},
      {name:'unisex'},
      {name:'unisex infantil'},
      {name:'infantil'},
      {name:'bebés niña'},
      {name:'bebés niño'},
      {name:'junior'},
      {name:'recién nacido'},
      {name:'recién nacida'}
    ]);
  }

  if(await Variation.count()<1){
    let masculino =await Gender.findOne({name:'masculino'});
    let femenino =await Gender.findOne({name:'femenino'});
    let ninos=await Gender.findOne({name:'niños'});
    let ninas=await Gender.findOne({name:'niñas'});
    let bebes=await Gender.findOne({name:'bebés'});
    let unisex=await Gender.findOne({name:'unisex'});
    let unisexinfantil=await Gender.findOne({name:'unisex infantil'});
    let infantil=await Gender.findOne({name:'infantil'});
    let bebenina=await Gender.findOne({name:'bebés niña'});
    let bebenino=await Gender.findOne({name:'bebés niño'});
    let junior=await Gender.findOne({name:'junior'});
    let reciennacido=await Gender.findOne({name:'recién nacido'});
    let reciennacida=await Gender.findOne({name:'recién nacida'});



    await Variation.createEach([
      {gender: masculino.id ,name:'único',col:'único'},
      {gender: masculino.id ,name:'4',cm:22.5,col:'34',us:'4'},
      {gender: masculino.id ,name:'4.5',cm:23,col:'34.5',us:'4.5'},
      {gender: masculino.id ,name:'5',cm:23.5,col:'35',us:'5'},
      {gender: masculino.id ,name:'5.5',cm:24,col:'36',us:'5.5'},
      {gender: masculino.id ,name:'6',cm:24.5,col:'36.5',us:'6'},
      {gender: masculino.id ,name:'6.5',cm:25,col:'37',us:'6.5'},
      {gender: masculino.id ,name:'7',cm:25.5,col:'37.5',us:'7'},
      {gender: masculino.id ,name:'7.5',cm:25.75,col:'38',us:'7.5'},
      {gender: masculino.id ,name:'8',cm:26,col:'39',us:'8'},
      {gender: masculino.id ,name:'8.5',cm:26.5,col:'39.5',us:'8.5'},
      {gender: masculino.id ,name:'9',cm:27,col:'40',us:'9'},
      {gender: masculino.id ,name:'9.5',cm:27.5,col:'41',us:'9.5'},
      {gender: masculino.id ,name:'10',cm:28,col:'41.5',us:'10'},
      {gender: masculino.id ,name:'10.5',cm:28.5,col:'42',us:'10.5'},
      {gender: masculino.id ,name:'11',cm:29,col:'43',us:'11'},
      {gender: masculino.id ,name:'12',cm:29.5,col:'44',us:'12'},
      {gender: masculino.id ,name:'xs',col:'xs',us:'xs'},
      {gender: masculino.id ,name:'s',col:'s',us:'s'},
      {gender: masculino.id ,name:'m',col:'m',us:'m'},
      {gender: masculino.id ,name:'l',col:'l',us:'l'},
      {gender: masculino.id ,name:'xl',col:'xl',us:'xl'},


      {gender: femenino.id ,name:'único',col:'único'},
      {gender: femenino.id ,name:'5',cm:22.7,col:'34',us:'5'},
      {gender: femenino.id ,name:'5.5',cm:23,col:'34.5',us:'5.5'},
      {gender: femenino.id ,name:'6',cm:23.5,col:'35',us:'6'},
      {gender: femenino.id ,name:'6.5',cm:24,col:'36',us:'6.5'},
      {gender: femenino.id ,name:'7',cm:24.5,col:'36.5',us:'7'},
      {gender: femenino.id ,name:'7.5',cm:25,col:'37',us:'7.5'},
      {gender: femenino.id ,name:'8',cm:25.5,col:'37.5',us:'8'},
      {gender: femenino.id ,name:'8.5',cm:25.75,col:'38',us:'8.5'},
      {gender: femenino.id ,name:'9',cm:26,col:'39',us:'9'},
      {gender: femenino.id ,name:'9.5',cm:26.5,col:'39.5',us:'9.5'},
      {gender: femenino.id ,name:'10',cm:27,col:'40',us:'10'},
      {gender: femenino.id ,name:'10.5',cm:27.5,col:'41',us:'10.5'},
      {gender: femenino.id ,name:'11',cm:28,col:'41.5',us:'11'},
      {gender: femenino.id ,name:'11.5',cm:28.5,col:'42',us:'11.5'},
      {gender: femenino.id ,name:'12',cm:28.75,col:'43',us:'12'},
      {gender: femenino.id ,name:'xs',col:'xs',us:'xs'},
      {gender: femenino.id ,name:'s',col:'s',us:'s'},
      {gender: femenino.id ,name:'m',col:'m',us:'m'},
      {gender: femenino.id ,name:'l',col:'l',us:'l'},
      {gender: femenino.id ,name:'xl',col:'xl',us:'xl'},

      {gender: ninos.id ,name:'único',col:'único'},
      {gender: ninas.id ,name:'único',col:'único'},
      {gender: bebes.id ,name:'único',col:'único'},

      {gender: unisex.id ,name:'único',col:'único'},
      {gender: unisex.id ,name:'21.5cm',cm:21.5,col:'34',us:'3.5/5',eu:'35'},
      {gender: unisex.id ,name:'22cm',cm:22,col:'34.5',us:'4/5.5',eu:'35.5'},
      {gender: unisex.id ,name:'22.5cm',cm:22.5,col:'35',us:'4.5/6',eu:'36'},
      {gender: unisex.id ,name:'23cm',cm:23,col:'35.5',us:'5/6.5',eu:'36.5'},
      {gender: unisex.id ,name:'23.5cm',cm:23.5,col:'36',us:'5.5/7',eu:'37'},
      {gender: unisex.id ,name:'24cm',cm:24,col:'37',us:'6/7.5',eu:'38'},
      {gender: unisex.id ,name:'24.5cm',cm:24.5,col:'37.5',us:'6.5/8',eu:'38.5'},
      {gender: unisex.id ,name:'25cm',cm:25,col:'38',us:'7/8.5',eu:'39'},
      {gender: unisex.id ,name:'25.5cm',cm:25.5,col:'39',us:'7.5/9',eu:'40'},
      {gender: unisex.id ,name:'26cm',cm:26,col:'39.5',us:'8/9.5',eu:'40.5'},
      {gender: unisex.id ,name:'26.5cm',cm:26.5,col:'40',us:'8.5',eu:'41'},
      {gender: unisex.id ,name:'27cm',cm:27,col:'41',us:'9',eu:'42'},
      {gender: unisex.id ,name:'27.5cm',cm:27.5,col:'41.5',us:'9.5',eu:'42.5'},
      {gender: unisex.id ,name:'28cm',cm:28,col:'42',us:'10',eu:'43'},
      {gender: unisex.id ,name:'28.5cm',cm:28.5,col:'43',us:'10.5',eu:'44'},
      {gender: unisex.id ,name:'29cm',cm:29,col:'43.5',us:'11',eu:'44.5'},
      {gender: unisex.id ,name:'29.5cm',cm:29.5,col:'44',us:'11.5',eu:'45'},
      {gender: unisex.id ,name:'30cm',cm:30,col:'45',us:'12',eu:'46'},
      {gender: unisex.id ,name:'31cm',cm:31,col:'46',us:'13',eu:'47'},
      {gender: unisex.id ,name:'32cm',cm:32,col:'47',us:'14',eu:'48'},

      {gender: unisexinfantil.id ,name:'único',col:'único'},
      {gender: infantil.id ,name:'único',col:'único'},
      {gender: bebenina.id ,name:'único',col:'único'},
      {gender: bebenino.id ,name:'único',col:'único'},
      {gender: junior.id ,name:'único',col:'único'},
      {gender: reciennacido.id ,name:'único',col:'único'},
      {gender: reciennacida.id ,name:'único',col:'único'},
    ]);
  }

  if(await Color.count()<1){
    await Color.createEach([
      {name:'blanco',code:'#FFFFFF'},
      {name:'negro',code:'#000000'},
      {name:'café',code:'#825500'},
      {name:'azul',code:'#040080'},
      {name:'verde',code:'#4c9e00'},
      {name:'amarillo',code:'#ffff00'},
      {name:'rojo',code:'#ff0800'},
      {name:'naranja',code:'#ff9d00'},
      {name:'fucsia',code:'#ff00f7'},
      {name:'lila',code:'#8000ff'},
      {name:'celeste',code:'#00ffff'},
      {name:'rosa',code:'#ffb0d1'},
      {name:'beige',code:'#F5F5DC'},
      {name:'chocolate',code:'#7a3d11'},
      {name:'dorado',code:'#FFD700'},
      {name:'gris',code:'#808080'},
      {name:'plateado',code:'#C0C0C0'},
      {name:'violeta',code:'#774177'},
    ]);
  }

  if(await OrderState.count()<1){
    await OrderState.createEach([
      {name:'aceptado',color: (await Color.findOne({name:'verde'})).id, valid:true},
      {name:'pendiente',color:(await Color.findOne({name:'amarillo'})).id, valid:true},
      {name:'cancelado',color:(await Color.findOne({name:'rojo'})).id, valid:true},
      {name:'rechazado',color:(await Color.findOne({name:'café'})).id, valid:true},
      {name:'fallido',color:(await Color.findOne({name:'negro'})).id, valid:true},
      {name:'en procesamiento',color:(await Color.findOne({name:'naranja'})).id, valid:true},
      {name:'empacado',color:(await Color.findOne({name:'celeste'})).id, valid:true},
      {name:'enviado',color:(await Color.findOne({name:'lila'})).id, valid:true},
      {name:'entregado',color:(await Color.findOne({name:'azul'})).id, valid:true},
      {name:'retornado',color:(await Color.findOne({name:'fucsia'})).id, valid:true},
    ]);
  }

  if(await Permission.count()<1){
    await Permission.createEach([
      {name:'showtaxes', group:'localizacion', description:'Ver lista de Impuestos'},
      {name:'createtax', group:'localizacion', description:'Crear un Impuesto'},
      {name:'edittax', group:'localizacion', description:'Modificar un Impuesto'},
      {name:'showcountries', group:'localizacion', description:'Ver lista de Paises'},
      {name:'createcountry', group:'localizacion', description:'Crear un País'},
      {name:'editcountry', group:'localizacion', description:'Editar un País'},
      {name:'countrystate', group:'localizacion', description:'Activar o Desactivar un País'},
      {name:'showregions', group:'localizacion', description:'Ver Lista de Regiones'},
      {name:'createregion', group:'localizacion', description:'Crear una región'},
      {name:'editregion', group:'localizacion', description:'Editar una región'},
      {name:'regionstate', group:'localizacion', description:'Activar o Desactivar una región'},
      {name:'showcities', group:'localizacion', description:'Ver la lista de ciudades'},
      {name:'createcity', group:'localizacion', description:'Crear una nueva ciudad'},
      {name:'editcity', group:'localizacion', description:'Editar una ciudad existente'},
      {name:'citystate', group:'localizacion', description:'Activar o desactivar una ciudad'},

      {name:'showvariations', group:'catalogo', description:'Ver la lista de variaciones'},
      {name:'createvariation', group:'catalogo', description:'crear variaciones de producto'},
      {name:'editvariation', group:'catalogo', description:'Editar variaciones de producto existentes'},
      {name:'showsuppliers', group:'catalogo', description:'Ver la Lista de Proveedores'},
      {name:'createsupplier', group:'catalogo', description:'Crear un Nuevo Proveedor'},
      {name:'editsupplier', group:'catalogo', description:'Editar un Proveedor'},
      {name:'supplierstate', group:'catalogo', description:'Activar o Desactivar un Proveedor'},
      {name:'showproducts', group:'catalogo', description:'Ver la lista de productos'},
      {name:'createproduct', group:'catalogo', description:'Crear un Nuevo Producto'},
      {name:'productimages', group:'catalogo', description:'Agregar imagenes a un producto existente'},
      {name:'setcover', group:'catalogo', description:'Definir la imagen de portada del producto'},
      {name:'removeimage', group:'catalogo', description:'Eliminar una imagen de producto'},
      {name:'productvariations', group:'catalogo', description:'Ver las variaciones de un producto'},
      {name:'deletevariations', group:'catalogo', description:'Eliminar variaciones de un producto'},
      {name:'productstate', group:'catalogo', description:'Activar o Desactivar un Producto'},

      {name:'listbrands', group:'catalogo', description:'Ver Listade de marcas'},
      {name:'addbrand', group:'catalogo', description:'Agregar una nueva marca'},
      {name:'editbrand', group:'catalogo', description:'Editar una marca existente'},
      {name:'brandstate', group:'catalogo', description:'Activar o Desactivar una marca'},
      {name:'showcolors', group:'catalogo', description:'Ver la lista de Colores'},
      {name:'createcolor', group:'catalogo', description:'Crear un Nuevo Color'},
      {name:'editcolor', group:'catalogo', description:'Editar un Color Existente'},
      {name:'showcategories', group:'catalogo', description:'Ver la lista de categorías'},
      {name:'addcategory', group:'catalogo', description:'Crear una Nueva Categoría'},
      {name:'editcategory', group:'catalogo', description:'Editar una categoría existente'},
      {name:'categorystate', group:'catalogo', description:'Activar o Desactivar una Categoría'},
      {name:'updateindex',group:'catalogo',description:'Actualizar o Eliminar el Indice de Productos'},

      {name:'users', group:'usuarios', description:'Ver la Lista de usuarios'},
      {name:'admincreate', group:'usuarios', description:'Crear un nuevo usuario administrativo'},
      {name:'adminedit', group:'usuarios', description:'Editar un usuario administrativo existente'},
      {name:'userstate', group:'usuarios', description:'Activar / Desactivar un usuario'},
      {name:'profiles', group:'usuarios', description:'Ver la Lista de Perfiles de Usuario'},
      {name:'createprofile', group:'usuarios', description:'Crear un Nuevo Perfil de usuario'},
      {name:'editprofile', group:'usuarios', description:'Editar un Perfil Existente'},

      {name:'permissions', group:'usuarios', description:'Visualizar Permisos de un usuario'},
      {name:'setpermissions', group:'usuarios', description:'Modificar los Permisos de un usuario'},

      {name:'showsellers', group:'sellers', description:'Ver los Sellers Activos'},
      {name:'createseller', group:'sellers', description:'Crear un nuevo Seller'},
      {name:'editseller', group:'sellers', description:'Editar un Seller existente'},
      {name:'sellerstate', group:'sellers', description:'Activar o Desactivar un Seller'},
      {name:'integrations', group:'sellers', description:'Administrar Integraciones'},

      {name:'listorders', group:'pedidos', description:'Ver la Lista de Pedidos'},
      {name:'updateorder', group:'pedidos', description:'Actualizar un Pedido'},
      {name:'liststates', group:'pedidos', description:'Ver los estados de los pedidos'},
      {name:'stateadd', group:'pedidos', description:'Agregar un nuevo estado de pedido'},
      {name:'stateedit', group:'pedidos', description:'Editar un estado de pedido'},
      {name:'validstate', group:'pedidos', description:'Define si el estado es considerado un pedido válido o no'},

      {name:'discounts', group:'descuentos', description:'Visualizar descuentos'},
      {name:'sliders', group:'descuentos', description:'Ver la Lista de imagenes del Carrusel'},

      {name:'showcarriers', group:'transporte', description:'Mostrar lista de Transportadores'},
      {name:'createcarrier', group:'transporte', description:'Crear un nuevo transportador'},
      {name:'editcarrier', group:'transporte', description:'Editar un trnasportador existente'},
      {name:'carrierstate', group:'transporte', description:'Activar / Desactivar un Transportador'},
      {name:'shipment', group:'transporte', description:'Visualizar Guías de transporte'},
    ]);
  }

};
