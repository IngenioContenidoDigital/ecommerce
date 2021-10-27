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
  IMPORT_MICROSERVICE  : process.env.IMPORT_MICROSERVICE ? process.env.IMPORT_MICROSERVICE : 'https://import.1ecommerce.app/graphql',
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
  MAGENTO_PAGESIZE : 8,
  MAGENTO_CHANNEL : 'magento',
  MERCADOLIBRE_PAGESIZE : 20,
  MERCADOLIBRE_CHANNEL : 'mercadolibre',
  DEFAULTPAGE: 300,
  APP_ID_ML: '376091216963139',
  SECRET_KEY_ML: 'eP3O9LD9hxTBooRGmYSj0EiuC1c48LbS'
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
