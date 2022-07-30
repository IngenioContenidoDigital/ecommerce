let queue = require('queue');
let axios = require('axios');

let objectQueue = queue({
  timeout: 15000,
  concurrency: 1,
  autostart: true
});

objectQueue.on('start', async (result) => {
  let data = JSON.stringify({
    'productId': result.data.product
  });

  let config = {
    method: 'post',
    url: 'https://1jdvdd72rf.execute-api.us-east-1.amazonaws.com/api/marketplace/channel/channelsync/processproduct',
    headers: {
      'Content-Type': 'application/json'
    },
    data: data
  };

  try {
    let response = await axios(config);
    console.log(response.data);
  } catch (error) {
  }
});

module.exports = {
  friendlyName: 'Function Channel Sync',
  description: 'funcion lambda para sincronizar productos en los marketplaces',
  inputs: {
    productid: {
      type: 'string',
      required: true,
    }
  },
  exits: {
    success: {
      description: 'All done.',
    },
  },
  fn: async function (inputs, exits) {
    objectQueue.push(await sails.helpers.makeJob({ product: inputs.productid }));
    return exits.success();
  }
};

