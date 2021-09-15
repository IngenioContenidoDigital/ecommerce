/**
 * Policy Mappings
 * (sails.config.policies)
 *
 * Policies are simple functions which run **before** your actions.
 *
 * For more information on configuring policies, check out:
 * https://sailsjs.com/docs/concepts/policies
 */

module.exports.policies = {

  /***************************************************************************
  *                                                                          *
  * Default policy for all controllers and actions, unless overridden.       *
  * (`true` allows public access)                                            *
  *                                                                          *
  ***************************************************************************/

  // '*': true,
  IndexController:{
    'checkout': ['isLoggedIn','isEmailVerified'],
    'admin':'isLoggedIn',
    'generateReportSeller': 'isLoggedIn',
    /*'showreports': 'isLoggedIn',*/
    'showreport': 'isLoggedIn',
    'reportsadmin': 'isLoggedIn',
    'generatelink': 'isLoggedIn',
    '*': true
  },
  FrontController:{'*':'isLoggedIn'},
  AddressController:{'*': 'isLoggedIn'},
  CarrierController:{'*': 'isLoggedIn'},
  CategoryController:{'*': 'isLoggedIn'},
  ColorController:{'*': 'isLoggedIn'},
  ChannelController:{'*': 'isLoggedIn'},
  PlanController:{'*': 'isLoggedIn'},
  HelpController:{'*': 'isLoggedIn'},
  CampaignController:{'*': 'isLoggedIn'},
  MessageController:{'*': 'isLoggedIn'},
  CountriesController:{
    'countryregions':true,
    'regioncities':true,
    '*': 'isLoggedIn'
  },
  DiscountController:{'*': 'isLoggedIn'},
  ManufacturersController:{'*': 'isLoggedIn'},
  FeaturesController:{'*': 'isLoggedIn'},
  OrderController:{
    'response':true,
    'confirmation':true,
    '*': 'isLoggedIn'
  },
  ProductController:{
    'findproductvariations' : true,
    '*': 'isLoggedIn'
  },
  SellerController:{
    'confirmationinvoice':true,
    'registersellerform': true,
    'registerseller': true,
    'setaddressseller': true,
    'adddocuments': true,
    'removedocument': true,
    'createcreditcard': true,
    'collectregister': true,
    'generateKey': true,
    '*': 'isLoggedIn'
  },
  ConversationController:{
    'webhookmessenger': true,
    '*': 'isLoggedIn'
  },
  SupplierController:{'*': 'isLoggedIn'},
  TaxController:{'*': 'isLoggedIn'},
  CurrencyController:{'*': 'isLoggedIn'},
  UserController:{
    'registerform':true,
    'createuser':true,
    'validatemail':true,
    'forgot':true,
    'sendcode':true,
    '*': 'isLoggedIn',
  },
  VariationController:{'*': 'isLoggedIn'},
  IntegrationsController:{
    'meliauth' : true,
    '*':'isLoggedIn'
  },

};
