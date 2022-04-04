const jwt = require('jsonwebtoken');
const axios = require('axios');
let shopify = require('../../graphql/shopify');
let woocommerce = require('../../graphql/woocommerce');
let vtex = require('../../graphql/vtex');
let prestashop = require('../../graphql/prestashop');

let signRequest = (data, query) => {
  let rootQuery;

  switch (data.channel) {
    case 'shopify':
      rootQuery = shopify[query];
      return {
        token: jwt.sign({
          shopName: data.apiUrl,
          apiKey: data.pk,
          password: data.sk,
          version: data.version
        }, 'secret'),
        query: rootQuery
      };
    case 'woocommerce':
      rootQuery = woocommerce[query];
      return {
        token: jwt.sign({
          url: data.apiUrl,
          consumerKey: data.pk,
          consumerSecret: data.sk,
          version: data.version
        }, 'secret'),
        query: rootQuery
      };
    case 'vtex':
      rootQuery = vtex[query];
      return {
        token: jwt.sign({
          shopName: data.apiUrl,
          apiKey: data.pk,
          password: data.sk,
        }, 'secret'),
        query: rootQuery
      };
    case 'prestashop':
      rootQuery = prestashop[query];
      return {
        token: jwt.sign({
          url: data.apiUrl,
          apiKey: data.pk,
        }, 'secret'),
        query: rootQuery
      };
    default:
      break;
  }
};

let fetch = async (data) => {
  return new Promise(async (resolve, reject) => {
    let request = signRequest(data, data.resource);
    let response = await axios.post(sails.config.custom.IMPORT_MICROSERVICE, { query: request.query, variables: { id : data.webhookId} }, {
      headers: {
        'ips-api-token': `Bearer ${request.token}`
      }
    }).catch((e) => console.log(e));

    if (response && response.data) {
      return resolve(response.data.data[Object.keys(response.data.data)[0]]);
    }
    return resolve(null);
  });
};

module.exports = {
  friendlyName: 'Webhook helper',
  description: 'Delete webhooks to CMS',
  inputs: {
    channel: { type: 'string' },
    pk: {
      type: 'string'
    },
    sk: {
      type: 'string'
    },
    apiUrl: {
      type: 'string'
    },
    version: {
      type: 'string'
    },
    resource: { type: 'string' },
    webhookId: { type : 'string'}
  },
  exits: {
    success: {
      description: 'All done.',
    },
  },
  fn: function (inputs) {
    return fetch(inputs);
  }
};
