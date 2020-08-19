const jwt = require('jsonwebtoken');
const axios = require('axios');
let shopify = require('../graphql/shopify')
let woocommerce = require('../graphql/woocommerce');

let signRequest = (data) => {
  let rootQuery;

  switch (data.channel) {
    case 'shopify':
      rootQuery = shopify.CATALOG;
      return {
        token: jwt.sign({
          shopName: data.apiUrl,
          password: data.sk,
          consumerSecret: data.pk,
          version: data.version
        }, 'secret'),
        query: rootQuery
      }

    case 'woocommerce':
      rootQuery = woocommerce.CATALOG
      return {
        token: jwt.sign({
          url: data.apiUrl,
          consumerKey: data.pk,
          consumerSecret: data.sk,
          version: data.version
        }, 'secret'),
        query: rootQuery
      }

    default:
      break;
  }
};

let getCatalog = async (data) => {
  return new Promise(async (resolve, reject) => {
    let request = signRequest(data);

    let response = await axios.post('http://localhost:9000/graphql', { query: request.query }, {
      headers: {
        'ips-api-token': `Bearer ${request.token}`
      }
    }).catch((e) => console.log(e)); 

    if (response && response.data) {
        return resolve(response.data.data[Object.keys(response.data.data)[0]]);
    }
  });
}

module.exports = {


  friendlyName: 'Commerce importer',


  description: 'Import data from marketplaces providers',


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
  },

  exits: {

    success: {
      description: 'All done.',
    },

  },

  fn: function (inputs) {
    return getCatalog(inputs);
  }

};

