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

  // By convention, this is a good place to set up fake data during development.
  if (await Profile.count() < 1) {
    await Profile.createEach([
      {name:'superadmin'},
      {name:'customer'},
    ]);
  }
  if (await User.count() < 1) {
    await User.create({emailAddress: 'luis.quinones@ingeniocontenido.co', emailStatus:'confirmed', password: await sails.helpers.passwords.hashPassword('L0f3q2n21982**'), fullName: 'Luis Felipe Quiñones Nieto', profile:(await Profile.findOne({name:'superadmin'})).id});
  }

  if(await Category.count()<1){
    await Category.create({name:'Inicio',description:'Categoria Raiz',active:true,level:1});
  }

  if(await Tax.count()<1){
    await Tax.create({name:'Sin impuestos',value:0});
  }

  if(await Variation.count()<1){
    await Variation.create({name:'Único'});
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
      {name:'rosa',code:'#ff75fa'}
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
      {name:'listproduct', group:'catalogo', description:'Activar o Desactivar un producto'},

      {name:'listbrands', group:'catalogo', description:'Ver Listade de marcas'},
      {name:'addbrand', group:'catalogo', description:'Agregar una nueva marca'},
      {name:'brandstate', group:'catalogo', description:'Activar o Desactivar una marca'},
      {name:'showcolors', group:'catalogo', description:'Ver la lista de Colores'},
      {name:'createcolor', group:'catalogo', description:'Crear un Nuevo Color'},
      {name:'editcolor', group:'catalogo', description:'Editar un Color Existente'},
      {name:'showcategories', group:'catalogo', description:'Ver la lista de categorías'},
      {name:'addcategory', group:'catalogo', description:'Crear una Nueva Categoría'},
      {name:'editcategory', group:'catalogo', description:'Editar una categoría existente'},
      {name:'categorystate', group:'catalogo', description:'Activar o Desactivar una Categoría'},

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

      {name:'listorders', group:'pedidos', description:'Ver la Lista de Pedidos'},
      {name:'updateorder', group:'pedidos', description:'Actualizar un Pedido'},
      {name:'liststates', group:'pedidos', description:'Ver los estados de los pedidos'},
      {name:'stateadd', group:'pedidos', description:'Agregar un nuevo estado de pedido'},
      {name:'stateedit', group:'pedidos', description:'Editar un estado de pedido'},
      {name:'validstate', group:'pedidos', description:'Define si el estado es considerado un pedido válido o no'},

      {name:'discounts', group:'descuentos', description:'Visualizar descuentos'},
      {name:'creatediscount', group:'descuentos', description:'Crear un nuevo descuento'},

      {name:'showcarriers', group:'transporte', description:'Mostrar lista de Transportadores'},
      {name:'createcarrier', group:'transporte', description:'Crear un nuevo transportador'},
      {name:'editcarrier', group:'transporte', description:'Editar un trnasportador existente'},
      {name:'carrierstate', group:'transporte', description:'Activar / Desactivar un Transportador'},
      {name:'shipment', group:'transporte', description:'Visualizar Guías de transporte'},
    ]);
  }

};
