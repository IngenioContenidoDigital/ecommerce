/**
 * Route Mappings
 * (sails.config.routes)
 *
 * Your routes tell Sails what to do each time it receives a request.
 *
 * For more information on configuring custom routes, check out:
 * https://sailsjs.com/anatomy/config/routes-js
 */

module.exports.routes = {

  /***************************************************************************
  *                                                                          *
  * Make the view located at `views/homepage.ejs` your home page.            *
  *                                                                          *
  * (Alternatively, remove this and add an `index.html` file in your         *
  * `assets` directory)                                                      *
  *                                                                          *
  ***************************************************************************/

  /* ----- FRONT ROUTES  -----*/
  '/': {controller:'IndexController',action:'index'},
  'GET /inicio': {controller:'IndexController',action:'admin'},
  'POST /filter/dashboard': {controller:'IndexController', action:'filterDashboard'},
  'POST /generatereport': {controller:'IndexController', action:'generateReport'},
  'POST /reportseller': {controller:'IndexController', action:'generateReportSeller'},
  'GET /showreport/:seller': {controller:'IndexController', action:'showreport'},
  'GET /login' : {view:'pages/configuration/login', locals:{error:null}},
  'POST /login' : {action:'login'},
  '/logout' : {action:'logout'},
  'POST /dafitisync' : {controller:'IndexController',action:'dafitisync'},
  'GET /account' : {controller:'FrontController',action:'account'},
  'GET /account/user/:id' : {controller:'FrontController',action:'user'},
  'GET /account/orders' : {controller:'FrontController',action:'orders'},
  'GET /ver/:entity/:name/:page?' : {controller:'IndexController',action:'list'},
  'GET /contenido/:tipo' : {controller:'IndexController',action:'cms'},
  'GET /buscar':{controller:'IndexController',action:'search'},
  'GET /index/:action':{controller:'ProductController',action:'searchindex'},
  'GET /list/product/:name/:reference' : {controller:'IndexController',action:'listproduct'},
  'GET /cart' : {controller:'CartController',action:'viewcart'},
  'PUT /cart' : {controller:'CartController',action:'addtocart'},
  'PUT /apply' : {controller:'CartController',action:'applycoupon'},
  'GET /register' : {controller:'UserController',action:'registerform'},
  'POST /register' : {controller:'UserController',action:'createuser'},
  'POST /verify' : {controller:'UserController',action:'validatemail'},
  'GET /forgot' : {controller:'UserController', action:'forgot'},
  'POST /forgot/code' : {controller:'UserController', action:'sendcode'},
  'GET /addresses' : {controller:'AddressController',action:'addresses'},
  'GET /address/:id?' : {controller:'AddressController',action:'address'},
  'POST /address/create' : {controller:'AddressController',action:'newaddress'},
  'POST /address/edit/:id' : {controller:'AddressController',action:'editaddress'},
  'GET /address/delete/:id' : {controller:'AddressController',action:'deleteaddress'},
  'GET /checkout' : {controller:'IndexController',action:'checkout'},
  'GET /buildmenu/:screen' : {controller:'IndexController',action:'buildmenu'},
  'POST /findprice' : {controller: 'IndexController',action:'variationPrices'},
  'POST /order' : {controller:'OrderController',action:'createorder'},
  'GET /sliders/:action?/:id?' : {controller:'FrontController',action:'listslider'},
  'POST /slide/create' : {controller:'FrontController',action:'createslider'},
  'POST /slide/edit/:id' : {controller:'FrontController',action:'editslider'},
  'PUT /slide/:id' : {controller:'FrontController',action:'sliderstate'},
  'GET /slide/delete/:id' : {controller:'FrontController',action:'sliderdelete'},
  /* ----- FIN FRONT ROUTES  -----*/
  /* ----- ADMIN ROUTES  -----*/
  'GET /manufacturers/:action?/:id?' : {controller:'ManufacturersController',action:'listbrands'},
  'POST /manufacturer/create': {controller:'ManufacturersController',action:'addbrand'},
  'PUT /manufacturers/:id' : {controller:'ManufacturersController',action:'brandstate'},
  'POST /manufacturer/edit/:id' : {controller:'ManufacturersController',action:'editbrand'},
  'GET /categories/list/:id?': {controller:'CategoryController',action:'showcategories'},
  'GET /categories/:id' : {controller:'CategoryController',action:'getchildren'},
  'GET /parent/:id' : {controller:'CategoryController',action:'getparent'},
  'POST /categories/create/:id?': {controller:'CategoryController',action:'addcategory'},
  'PUT /categories/:id' : {controller:'CategoryController',action:'categorystate'},
  'POST /categories/edit/:id' : {controller:'CategoryController',action:'editcategory'},
  'DELETE /category/delete' :{controller:'CategoryController', action:'deletecategory'},
  'GET /features/:action?/:id?' : {controller:'FeaturesController',action:'listfeatures'},
  'POST /features/create': {controller:'FeaturesController',action:'addfeature'},
  'PUT /features/:id' : {controller:'FeaturesController',action:'featurestate'},
  'POST /features/edit/:id' : {controller:'FeaturesController',action:'editfeature'},
  'DELETE /features/delete' :{controller:'FeaturesController', action:'deletefeature'},
  'POST /addproductfeature' :{controller:'FeaturesController', action:'addproductfeature'},
  'GET /integrations/dafiti/features' : {controller:'FeaturesController',action:'dafitifeatures'},
  'GET /integrations/linio/features' : {controller:'FeaturesController',action:'liniofeatures'},
  'GET /integrations/mercadolibre/features' : {controller:'FeaturesController',action:'mercadolibrefeatures'},
  'GET /integrations/mercadolibremx/features' : {controller:'FeaturesController',action:'mercadolibremxfeatures'},
  'GET /sellers/:action?/:id?' : {controller:'SellerController',action:'showsellers'},
  'POST /hash' : {controller:'SellerController', action:'createhash'},
  'GET /channelmessages/:seller' : {controller:'ConversationController',action:'showmessages'},
  'POST /filter/questions' : {controller:'ConversationController', action:'filtermessages'},
  'POST /getquestions' : {controller:'ConversationController', action:'getquestions'},
  'POST /answerquestion' : {controller:'ConversationController', action:'answerquestion'},
  'POST /answerclaim' : {controller:'ConversationController', action:'answerclaim'},
  'POST /answermessages' : {controller:'ConversationController', action:'answermessages'},
  'POST /webhookmessenger/:uuid' : {controller:'ConversationController',action:'webhookmessenger'},
  'POST /donwloadattachment' : {controller:'ConversationController',action:'donwloadattachment'},
  'POST /notificationml' : {controller:'IndexController',action:'notificationml'},
  'POST /seller/create' : {controller:'SellerController',action:'createseller'},
  'PUT /seller/:id' : {controller:'SellerController',action:'sellerstate'},
  'POST /seller/edit/:id' : {controller:'SellerController',action:'editseller'},
  'GET /showreports/:id' : {controller:'SellerController',action:'showreports'},
  'GET /colors/:action?/:id?' : {controller:'ColorController',action:'showcolors'},
  'POST /color/create' : {controller:'ColorController',action:'createcolor'},
  'POST /color/edit/:id' : {controller:'ColorController',action:'editcolor'},
  'GET /products/:seller?' : {controller:'ProductController',action:'showproducts'},
  'POST /products/download' : {controller:'ProductController',action:'downloadproducts'},
  'GET /catalogquery/:page?/:seller?' : {controller:'ProductController',action:'findcatalog'},
  'GET /product/:action?/:id?' : {controller:'ProductController',action:'productmgt'},
  'GET /import/:seller' : {controller:'ProductController',action:'import'},
  'POST /import' : {controller:'ProductController',action:'importexecute'},
  'POST /dafitisync/:identifier?' : {controller:'IndexController',action:'dafitiSync'},
  'POST /liniosync/:identifier?' : {controller:'IndexController',action:'linioSync'},
  'POST /liniomxsync/:identifier?' : {controller:'IndexController',action:'liniomxSync'},
  'POST /productcheck' : {controller:'ProductController',action:'checkdata'},
  'POST /check-product-provider' : {controller:'ProductController',action:'checkProductFromProvider'},

  'GET /multiple/:seller' : {controller:'ProductController',action:'multiple'},
  'POST /multiple' : {controller:'ProductController',action:'multipleexecute'},

  'POST /product/create' : {controller:'ProductController',action:'createproduct'},
  'POST /product/images' : {controller:'ProductController',action:'productimages'},
  'PUT /image/:id' : {controller:'ProductController',action:'setcover'},
  'PUT /images/remove/:id' : {controller:'ProductController',action:'removeimage'},
  'PUT /products/:id' : {controller:'ProductController',action:'productstate'},
  'POST /products/variations/:id' : {controller:'ProductController',action:'productvariations'},
  'DELETE /variations/remove/:id' : {controller:'ProductController',action:'deletevariations'},
  'GET /findvariations/:id' : {controller:'ProductController',action:'findvariations'},
  'GET /findproductvariations/:id' : {controller:'ProductController',action:'findproductvariations'},
  'POST /import-products' : {controller:'ProductController',action:'importProducts'},
  'POST /import-images' : {controller:'ProductController',action:'importImages'},
  'POST /import-variations' : {controller:'ProductController',action:'importVariations'},
  'GET /taxes/:action?/:id?' : {controller:'TaxController',action:'showtaxes'},
  'GET /currencies/:action?/:id?' : {controller:'CurrencyController', action:'showCurrencies'},
  'POST /currencies/create' : {controller:'CurrencyController',action:'createcurrency'},
  'POST /currencies/edit/:id' : {controller:'CurrencyController',action:'editcurrency'},
  'POST /tax/create' : {controller:'TaxController',action:'createtax'},
  'POST /tax/edit/:id' : {controller:'TaxController',action:'edittax'},

  'GET /variations/:action?/:id?':{controller:'VariationController',action:'showvariations'},
  'POST /variation/create':{controller:'VariationController',action:'createvariation'},
  'POST /variation/edit/:id':{controller:'VariationController',action:'editvariation'},

  'GET /suppliers/:action?/:id?' : {controller:'SupplierController',action:'showsuppliers'},
  'POST /supplier/create' : {controller:'SupplierController',action:'createsupplier'},
  'PUT /supplier/:id' : {controller:'SupplierController',action:'supplierstate'},
  'POST /supplier/edit/:id' : {controller:'SupplierController',action:'editsupplier'},

  'GET /countries/:action?/:id?' : {controller:'CountriesController',action:'showcountries'},
  'POST /country/create':{controller:'CountriesController',action:'createcountry'},
  'POST /country/edit/:id':{controller:'CountriesController',action:'editcountry'},
  'PUT /country/:id' : {controller:'CountriesController',action:'countrystate'},

  'GET /regions/:action?/:id?' : {controller:'CountriesController',action:'showregions'},
  'POST /region/create':{controller:'CountriesController',action:'createregion'},
  'POST /region/edit/:id':{controller:'CountriesController',action:'editregion'},
  'PUT /region/:id' : {controller:'CountriesController',action:'regionstate'},

  'GET /cities/:region/:action?/:id?' : {controller:'CountriesController',action:'showcities'},
  'POST /city/create':{controller:'CountriesController',action:'createcity'},
  'POST /city/edit/:id':{controller:'CountriesController',action:'editcity'},
  'PUT /city/:id' : {controller:'CountriesController',action:'citystate'},

  'GET /find/regions/:id' : {controller:'CountriesController',action:'countryregions'},
  'GET /find/cities/:id' : {controller:'CountriesController',action:'regioncities'},

  'GET /carriers/:action?/:id?' : {controller:'CarrierController',action:'showcarriers'},
  'POST /carrier/create' : {controller:'CarrierController',action:'createcarrier'},
  'PUT /carrier/:id' : {controller:'CarrierController',action:'carrierstate'},
  'POST /carrier/edit/:id' : {controller:'CarrierController',action:'editcarrier'},
  'GET /guia/:tracking' : {controller:'CarrierController',action:'shipment'},
  'GET /generateguides' : {controller:'CarrierController',action:'generateguides'},
  'POST /multipleguides' : {controller:'CarrierController',action:'multipleguides'},

  'GET /order/state/:action?/:id?' : {controller:'OrderController',action:'liststates'},
  'POST /orderstate/create' : {controller:'OrderController',action:'stateadd'},
  'POST /orderstate/edit/:id' : {controller:'OrderController',action:'stateedit'},
  'PUT /orderstate/:id' : {controller:'OrderController',action:'validstate'},
  'GET /orders' : {controller:'OrderController',action:'listorders'},
  'GET /order/:action/:id' : {controller:'OrderController',action:'ordermgt'},
  'GET /ordersquery/:page' : {controller:'OrderController',action:'findorders'},
  'GET /order/report' : {controller:'OrderController', action:'report'},
  'POST /order/generatereport': {controller:'OrderController', action:'generateReportExcel'},
  'GET /manifest' : {controller:'OrderController', action:'manifest'},
  'POST /generatemanifest': {controller:'OrderController', action:'generatemanifest'},
  'GET /respuesta' : {controller: 'OrderController', action: 'response'},
  'POST /confirmacion' : {controller:'OrderController', action:'confirmation', csrf:false},
  'POST /verifyorder' : {controller:'OrderController', action:'verifyorder'},
  'POST /guideprocess/:id' : {controller:'OrderController', action:'guideprocess'},
  'GET /discounts/:action?/:id?' : {controller:'DiscountController',action:'discounts'},
  'POST /discount/:action/:id?' : {controller:'DiscountController',action:'creatediscount'},
  'POST /productdiscount' : {controller:'DiscountController',action:'productdiscount'},
  'PUT /removepdiscount' : {controller:'DiscountController',action:'removepdiscount'},

  'GET /coupons/:action?/:id?' : {controller:'DiscountController',action:'coupons'},
  'POST /coupon/create' : {controller:'DiscountController',action:'createcoupon'},
  'POST /coupon/edit/:id' : {controller:'DiscountController',action:'editcoupon'},
  'PUT /random' : {controller:'DiscountController',action:'random'},
  'PUT /order/update' : {controller:'OrderController',action:'updateorder'},
  'PUT /order/update/coppel' : {controller:'OrderController',action:'updatecoppel'},
  'GET /users/:action?/:id?' : {controller:'UserController',action:'users'},
  'POST /user/create' : {controller:'UserController',action:'admincreate'},
  'POST /user/edit/:id' : {controller:'UserController',action:'adminedit'},
  'PUT /user/:id' : {controller:'UserController',action:'userstate'},
  'GET /profiles/:action?/:id?' : {controller:'UserController',action:'profiles'},
  'POST /profile/create' : {controller:'UserController',action:'createprofile'},
  'POST /profile/edit/:id' : {controller:'UserController',action:'editprofile'},
  'GET /permissions/:id' : {controller:'UserController',action:'permissions'},
  'POST /permissions/set/:id' : {controller:'UserController',action:'setpermissions'},
  'GET /permission' : {controller:'UserController',action:'newpermission'},
  'POST /permission/create' : {controller:'UserController',action:'addpermission'},
  'POST /usernotification' : {controller:'UserController',action:'usernotification'},

  'POST /integration/set/:seller/:channel/:namechannel' : {controller:'SellerController',action:'setintegration'},
  'POST /commission/set/:seller' : {controller:'SellerController',action:'setcommission'},
  'POST /commissiondiscount/create/:seller' : {controller:'SellerController',action:'createcommissiondiscount'},
  'PUT /removecommissiondiscount' : {controller:'SellerController',action:'removecommissiondiscount'},
  'POST /commissionchannel/:seller' : {controller:'SellerController',action:'commissionchannel'},
  'PUT /removecommission' : {controller:'SellerController',action:'removecommissionchannel'},
  'GET /integrations/dafiti/categories' : {controller:'CategoryController',action:'dafiticategories'},
  'GET /integrations/linio/categories' : {controller:'CategoryController',action:'liniocategories'},
  'GET /integrations/liniomx/categories' : {controller:'CategoryController',action:'liniomxcategories'},
  'GET /integrations/mercadolibre/categories' : {controller:'CategoryController',action:'mercadolibrecategories'},
  'GET /integrations/mercadolibremx/categories' : {controller:'CategoryController',action:'mercadolibremxcategories'},
  'POST /dafiti/add' : {controller:'ProductController',action:'dafitiadd'},
  'POST /mercadolibre/add' : {controller:'ProductController',action:'mercadolibreadd'},
  'POST /mercadolibremx/add' : {controller:'ProductController',action:'mercadolibremxadd'},
  'POST /linio/add' : {controller:'ProductController',action:'linioadd'},
  'POST /liniomx/add' : {controller:'ProductController',action:'liniomxadd'},
  'POST /coppel/add' : {controller:'ProductController',action:'coppeladd'},
  'POST /iridio/add' : {controller:'ProductController',action:'iridioadd'},
  'POST /delete/product' : {controller:'ProductController',action:'deleteproduct'},
  'POST /updatemultiple/products' : {controller:'ProductController',action:'updatemultipleproduct'},
  'GET /token' : {action:'security/grant-csrf-token'},
  'PUT /menu' : {controller:'UserController',action:'menuvisible'},
  'GET /mlauth/:appid' : {controller:'IntegrationsController', action:'meliauth'},
  'GET /getcover/:productid' : {controller:'ProductController', action:'getcover'},
  'GET /colorindex/:action':{controller:'ColorController',action:'colorindex'},
  'GET /genderindex/:action':{controller:'ProductController',action:'genderindex'},
  'GET /categoryindex/:action':{controller:'CategoryController',action:'categoryindex'},
  'GET /categoryscheme':{controller:'CategoryController',action:'categoryscheme'},

  'GET /channels/:action?/:id?' : {controller:'ChannelController',action:'showchannels'},
  'POST /channel/create' : {controller:'ChannelController',action:'createchannel'},
  'POST /channel/edit/:id' : {controller:'ChannelController',action:'editchannel'},

  'GET /campaigns/:action?/:id?' : {controller:'CampaignController',action:'showcampaigns'},
  'POST /campaign/create' : {controller:'CampaignController',action:'createcampaign'},
  'POST /campaign/edit/:id' : {controller:'CampaignController',action:'editcampaign'},
  'PUT /campaign/:id' : {controller:'CampaignController',action:'campaignstate'},
  'GET /campaign/show/:id' : {controller:'CampaignController',action:'campaignshow'}

  /* ----- FIN ADMIN ROUTES  -----*/

  /***************************************************************************
  *                                                                          *
  * More custom routes here...                                               *
  * (See https://sailsjs.com/config/routes for examples.)                    *
  *                                                                          *
  * If a request to a URL doesn't match any of the routes in this file, it   *
  * is matched against "shadow routes" (e.g. blueprint routes).  If it does  *
  * not match any of those, it is matched against static assets.             *
  *                                                                          *
  ***************************************************************************/


};
