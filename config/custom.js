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
  WOOCOMMERCE_PAGESIZE : 20,
  WOOCOMMERCE_CHANNEL : 'woocommerce',
  VTEX_PAGESIZE : 10,
  VTEX_CHANNEL : 'vtex',
  PRESTASHOP_PAGESIZE : 50,
  PRESTASHOP_CHANNEL : 'prestashop',
  MAGENTO_PAGESIZE : 8,
  MAGENTO_CHANNEL : 'magento',
  MERCADOLIBRE_PAGESIZE : 20,
  MERCADOLIBRE_CHANNEL : 'mercadolibre',
  SIESA_PAGESIZE : 200,
  SIESA_CHANNEL : 'siesa',
  DEFAULTPAGE: 300,
  APP_ID_ML: '376091216963139',
  SECRET_KEY_ML: 'eP3O9LD9hxTBooRGmYSj0EiuC1c48LbS',
  PARTNER_ID_SHOPEE: 1005085,
  PARTNER_KEY_SHOPEE: '7ec956a561478d1095602bd12f8a4e8b9a6b061e2ea856f6ec7420f3680c2075'
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
