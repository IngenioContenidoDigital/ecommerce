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

};
