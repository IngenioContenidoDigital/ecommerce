const { SHOPIFY_PRODUCTS } = require('../../api/graphql/subscriptions/shopify');
const { WOOCOMMERCE_PRODUCTS } = require('../../api/graphql/subscriptions/woocommerce');
const { VTEX_PRODUCTS } = require('../../api/graphql/subscriptions/vtex');
const { PRESTASHOP_PRODUCTS } = require('../../api/graphql/subscriptions/prestashop');

module.exports = {
  friendlyName: 'Start graphql subscription',
  description: 'Subscribe to all graphql endpoint subscription',
  inputs: {

  },
  exits: {
    success: {
      description: 'All done.',
    },
    serverError:{
      description: 'Error de Proceso'
    }
  },

  fn: async function (inputs, exits) {
    try {
      await sails.helpers.subscription({ subscription : SHOPIFY_PRODUCTS, callback : async (response)=>{
        if (response.data.ShopifyProducts) {
          let result = response.data.ShopifyProducts;
          let channel = await Channel.findOne({name: result.channel});
          if (channel) {
            let integration = await Integrations.findOne({channel: channel.id, key: result.key}).populate('channel');
            if (integration) {
              let product = await sails.helpers.marketplaceswebhooks.findProductGraphql(
                    integration.channel.name,
                    integration.key,
                    integration.secret,
                    integration.url,
                    integration.version,
                    'PRODUCTID',
                    result.productId
              ).catch((e) => console.log(e));
              if (product) {
                await sails.helpers.marketplaceswebhooks.product(product, integration.seller, result.discount).catch((e)=>console.log(e));
              }
            }
          }
        }
      }});

      await sails.helpers.subscription({ subscription : VTEX_PRODUCTS, callback : async (response)=>{
        if (response.data.VtexProducts) {
          let result = response.data.VtexProducts;
          let channel = await Channel.findOne({name: result.channel});
          if (channel) {
            let integration = await Integrations.findOne({channel: channel.id, key: result.key}).populate('channel');
            if (integration) {
              let product = await sails.helpers.marketplaceswebhooks.findProductGraphql(
                    integration.channel.name,
                    integration.key,
                    integration.secret,
                    integration.url,
                    integration.version,
                    'PRODUCTID',
                    result.productId
              ).catch((e) => console.log(e));
              if (product) {
                await sails.helpers.marketplaceswebhooks.product(product, integration.seller, result.discount).catch((e)=>console.log(e));
              }
            }
          }
        }
      }});

      await sails.helpers.subscription({ subscription : WOOCOMMERCE_PRODUCTS, callback : async (response)=>{
        if (response.data.WoocommerceProducts) {
          let result = response.data.WoocommerceProducts;
          let channel = await Channel.findOne({name: result.channel});
          if (channel) {
            let integration = await Integrations.findOne({channel: channel.id, key: result.key}).populate('channel');
            if (integration) {
              let response = await sails.helpers.marketplaceswebhooks.findProductGraphql(
                    integration.channel.name,
                    integration.key,
                    integration.secret,
                    integration.url,
                    integration.version,
                    'PRODUCTID',
                    result.productId
              ).catch((e) => console.log(e));
              if (response) {
                await sails.helpers.marketplaceswebhooks.woocommerceProduct(response.product, integration.seller, integration, result.separate_product_by_color ).catch((e)=>console.log(e));
              }
            }
          }
        }
      }});

      await sails.helpers.subscription({ subscription : PRESTASHOP_PRODUCTS, callback : async (response)=>{
        if (response.data.PrestashopProducts) {
          let result = response.data.PrestashopProducts;
          let channel = await Channel.findOne({name: result.channel});
          if (channel) {
            let integration = await Integrations.findOne({channel: channel.id, key: result.key}).populate('channel');
            if (integration) {
              let product = await sails.helpers.marketplaceswebhooks.findProductGraphql(
                    integration.channel.name,
                    integration.key,
                    integration.secret,
                    integration.url,
                    integration.version,
                    'PRODUCTID',
                    result.productId
              ).catch((e) => console.log(e));
              if (product) {
                await sails.helpers.marketplaceswebhooks.product(product, integration.seller).catch((e)=>console.log(e));
              }
            }
          }
        }
      }});

      exits.success();

    } catch (error) {
      exits.serverError(error);
    }
  }
};
