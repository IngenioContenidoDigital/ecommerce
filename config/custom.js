/**
 * Custom configuration
 * (sails.config.custom)
 *
 * One-off settings specific to your application.
 *
 * For more information on custom configuration, visit:
 * https://sailsjs.com/config/custom
 */
//IMPORT_MICROSERVICE  : 'https://import.1ecommerce.app:9000/graphql',
module.exports.custom = {
  IMPORT_MICROSERVICE  : process.env.IMPORT_MICROSERVICE ? process.env.IMPORT_MICROSERVICE : 'http://localhost:9000/graphql',
  PRODUCT_TYPE: 'Product',
  PRODUCT_VARIATION: 'Variations',
  IMAGE_TYPE: 'ProductImage',
  STATUS_UPLOADED : true,
  SHOPIFY_CHANNEL : 'shopify',
  SHOPIFY_PAGESIZE : 50,
  WOOCOMMERCE_PAGESIZE : 50,
  WOOCOMMERCE_CHANNEL : 'woocommerce',
  VTEX_PAGESIZE : 10,
  VTEX_CHANNEL : 'vtex',
  PRESTASHOP_PAGESIZE : 50,
  PRESTASHOP_CHANNEL : 'prestashop',
  DEFAULTPAGE: 300,
  /***************************************************************************
  *                                                                          *
  * Any other custom config this Sails app should use during development.    *
  *                                                                          *
  ***************************************************************************/
  // mailgunDomain: 'transactional-mail.example.com',
  // mailgunSecret: 'key-testkeyb183848139913858e8abd9a3',
  // stripeSecret: 'sk_test_Zzd814nldl91104qor5911gjald',
  // …

};
