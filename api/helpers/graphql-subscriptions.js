const { SHOPIFY_PRODUCTS, SHOPIFY_ORDERS } = require('../../api/graphql/subscriptions/shopify');
const { WOOCOMMERCE_PRODUCTS, WOOCOMMERCE_ORDERS} = require('../../api/graphql/subscriptions/woocommerce');
const { VTEX_PRODUCTS, VTEX_ORDERS } = require('../../api/graphql/subscriptions/vtex');
const { PRESTASHOP_PRODUCTS,  PRESTASHOP_ORDERS} = require('../../api/graphql/subscriptions/prestashop');
const { NOTIFICATION_MELI } = require('../../api/graphql/subscriptions/mercadolibre');

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
      // subscription para los productos de los cms
      await sails.helpers.subscription({ subscription : SHOPIFY_PRODUCTS, callback : async (response)=>{
        if (response && response.data && response.data.ShopifyProducts) {
          let result = response.data.ShopifyProducts;
          let channel = await Channel.findOne({name: result.channel});
          if (channel) {
            let integration = await Integrations.findOne({channel: channel.id, key: result.key}).populate('channel').populate('seller');
            if (integration && integration.seller.active) {
              let response = await sails.helpers.marketplaceswebhooks.findProductGraphql(
                    integration.channel.name,
                    integration.key,
                    integration.secret,
                    integration.url,
                    integration.version,
                    'PRODUCTID',
                    result.productId
              ).catch((e) => console.log(e));
              if (response && response.data.length > 0) {
                for (const product of response.data) {
                  await sails.helpers.marketplaceswebhooks.product(product, integration.seller.id, result.discount).catch((e)=>console.log(e.message));
                }
              }
            }
          }
        }
      }});

      await sails.helpers.subscription({ subscription : VTEX_PRODUCTS, callback : async (response)=>{
        if (response && response.data && response.data.VtexProducts) {
          let result = response.data.VtexProducts;
          let channel = await Channel.findOne({name: result.channel});
          if (channel) {
            let integration = await Integrations.findOne({channel: channel.id, key: result.key}).populate('channel').populate('seller');
            if (integration && integration.seller.active) {
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
                await sails.helpers.marketplaceswebhooks.product(product, integration.seller.id, result.discount).catch((e)=>console.log(e.message));
              }
            }
          }
        }
      }});

      await sails.helpers.subscription({ subscription : WOOCOMMERCE_PRODUCTS, callback : async (response)=>{
        if (response && response.data && response.data.WoocommerceProducts) {
          let result = response.data.WoocommerceProducts;
          let channel = await Channel.findOne({name: result.channel});
          if (channel) {
            let integration = await Integrations.findOne({channel: channel.id, key: result.key}).populate('channel').populate('seller');
            if (integration && integration.seller.active) {
              let response = await sails.helpers.marketplaceswebhooks.findProductGraphql(
                    integration.channel.name,
                    integration.key,
                    integration.secret,
                    integration.url,
                    integration.version,
                    'PRODUCTID',
                    result.productId
              ).catch((e) => console.log(e));
              if (response && response.data.length > 0) {
                for (const product of response.data) {
                  await sails.helpers.marketplaceswebhooks.product(product, integration.seller.id, true).catch((e)=>console.log(e.message));
                }
              }
            }
          }
        }
      }});

      await sails.helpers.subscription({ subscription : PRESTASHOP_PRODUCTS, callback : async (response)=>{
        if (response && response.data && response.data.PrestashopProducts) {
          let result = response.data.PrestashopProducts;
          let channel = await Channel.findOne({name: result.channel});
          if (channel) {
            let integration = await Integrations.findOne({channel: channel.id, key: result.key}).populate('channel').populate('seller');
            if (integration && integration.seller.active) {
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
                await sails.helpers.marketplaceswebhooks.product(product, integration.seller.id).catch((e)=>console.log(e.message));
              }
            }
          }
        }
      }});

      //subscription para las ordenes de los cms
      await sails.helpers.subscription({ subscription : SHOPIFY_ORDERS, callback : async (response)=>{
        if (response && response.data && response.data.ShopifyOrders) {
          let result = response.data.ShopifyOrders;
          let channel = await Channel.findOne({name: result.channel});
          if (channel) {
            let integration = await Integrations.findOne({channel: channel.id, key: result.key}).populate('channel').populate('seller');
            if (integration && integration.seller.active) {
              let order = await sails.helpers.marketplaceswebhooks.findProductGraphql(
                integration.channel.name,
                integration.key,
                integration.secret,
                integration.url,
                integration.version,
                'ORDERID',
                result.orderId
              ).catch((e) => console.log(e));
              if (order) {
                await sails.helpers.marketplaceswebhooks.order(order, integration).catch((e)=>console.log(e.message));
              }
            }
          }
        }
      }});

      await sails.helpers.subscription({ subscription : VTEX_ORDERS, callback : async (response)=>{
        if (response && response.data && response.data.VtexOrders) {
          let result = response.data.VtexOrders;
          let channel = await Channel.findOne({name: result.channel});
          if (channel) {
            let integration = await Integrations.findOne({channel: channel.id, key: result.key}).populate('channel').populate('seller');
            if (integration && integration.seller.active) {
              let order = await sails.helpers.marketplaceswebhooks.findProductGraphql(
                integration.channel.name,
                integration.key,
                integration.secret,
                integration.url,
                integration.version,
                'ORDERID',
                result.orderId
              ).catch((e) => console.log(e));
              if (order) {
                await sails.helpers.marketplaceswebhooks.order(order, integration).catch((e)=>console.log(e.message));
              }
            }
          }
        }
      }});

      await sails.helpers.subscription({ subscription : WOOCOMMERCE_ORDERS, callback : async (response)=>{
        if (response && response.data && response.data.WoocommerceOrders) {
          let result = response.data.WoocommerceOrders;
          let channel = await Channel.findOne({name: result.channel});
          if (channel) {
            let integration = await Integrations.findOne({channel: channel.id, key: result.key}).populate('channel').populate('seller');
            if (integration && integration.seller.active) {
              let order = await sails.helpers.marketplaceswebhooks.findProductGraphql(
                integration.channel.name,
                integration.key,
                integration.secret,
                integration.url,
                integration.version,
                'ORDERID',
                result.orderId
              ).catch((e) => console.log(e));
              if (order) {
                await sails.helpers.marketplaceswebhooks.order(order, integration).catch((e)=>console.log(e.message));
              }
            }
          }
        }
      }});

      await sails.helpers.subscription({ subscription : PRESTASHOP_ORDERS, callback : async (response)=>{
        if (response && response.data && response.data.PrestashopOrders) {
          let result = response.data.PrestashopOrders;
          let channel = await Channel.findOne({name: result.channel});
          if (channel) {
            let integration = await Integrations.findOne({channel: channel.id, key: result.key}).populate('channel').populate('seller');
            if (integration && integration.seller.active) {
              let order = await sails.helpers.marketplaceswebhooks.findProductGraphql(
                integration.channel.name,
                integration.key,
                integration.secret,
                integration.url,
                integration.version,
                'ORDERID',
                result.orderId
              ).catch((e) => console.log(e));
              if (order) {
                await sails.helpers.marketplaceswebhooks.order(order, integration).catch((e)=>console.log(e.message));
              }
            }
          }
        }
      }});

      await sails.helpers.subscription({ subscription : NOTIFICATION_MELI, callback : async (response)=>{
        if (response && response.data) {
          let result = response.data.NotificationMeli;
          if (result) {
            await sails.helpers.notificationMeli(result).catch((e)=>console.log(e.message));
          }
        }
      }});
    } catch (error) {
      throw new Error(error.message);
    }
  }
};
