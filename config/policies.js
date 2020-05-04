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
  AddressController:{'*': 'isLoggedIn'},
  CarrierController:{'*': 'isLoggedIn'},
  CategoryController:{
    'listcategory':true,
    '*': 'isLoggedIn'
  },
  ColorController:{'*': 'isLoggedIn'},
  CountriesController:{'*': 'isLoggedIn'},
  DiscountController:{'*': 'isLoggedIn'},
  ManufacturersController:{'*': 'isLoggedIn'},
  OrderController:{'*': 'isLoggedIn'},
  ProductController:{'*': 'isLoggedIn'},
  SellerController:{'*': 'isLoggedIn'},
  SupplierController:{'*': 'isLoggedIn'},
  TaxController:{'*': 'isLoggedIn'},
  UserController:{
    'registerform':true,
    'createuser':true,
    'validatemail':true,
    '*': 'isLoggedIn',
  },
  VariationController:{'*': 'isLoggedIn'}

};
