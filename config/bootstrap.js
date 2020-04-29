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
  if (await User.count() < 1) {
    await User.create({emailAddress: 'luis.quinones@ingeniocontenido.co', emailStatus:'confirmed', password: await sails.helpers.passwords.hashPassword('L0f3q2n21982**'), fullName: 'Luis Felipe Quiñones Nieto', isSuperAdmin:true});
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




};
