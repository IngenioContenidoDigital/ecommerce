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
    '*': true
  },
  FrontController:{'*':'isLoggedIn'},
  AddressController:{'*': 'isLoggedIn'},
  CarrierController:{'*': 'isLoggedIn'},
  CategoryController:{'*': 'isLoggedIn'},
  ColorController:{'*': 'isLoggedIn'},
  ChannelController:{'*': 'isLoggedIn'},
  CountriesController:{'*': 'isLoggedIn'},
  DiscountController:{'*': 'isLoggedIn'},
  ManufacturersController:{'*': 'isLoggedIn'},
  OrderController:{
    'response':true,
    'confirmation':true,
    'muybacanoorders': true,
    '*': 'isLoggedIn'
  },
  ProductController:{
    'findproductvariations' : true,
    'muybacanoupdate' : true,
    '*': 'isLoggedIn'
  },
  SellerController:{
    'notificationml': true,
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
