let queue = require('queue');
let axios = require('axios');

let objectQueue = queue({
  timeout: 5000,
  concurrency: 1,
  autostart: true
});

objectQueue.on('start', async (result) => {
  let data = JSON.stringify({
    'id_product': result.data.product
  });
  let config = {
    method: 'post',
    url: `https://1jdvdd72rf.execute-api.us-east-1.amazonaws.com/api/prestashop/product/updateproduct/processproduct/${result.data.integrationKey}`,
    headers: {
      'Content-Type': 'application/json'
    },
    data: data
  };

  try {
    await axios(config);
  } catch (error) {
    console.log(error);
  }
});

module.exports = {
  friendlyName: 'Function Stock Sync',
  description: 'funcion lambda para sincronizar actualizar stock productos',
  inputs: {
    productid: {
      type: 'string',
      required: true,
    },
    integrationKey: {
      type: 'string',
      required: true,
    },
  },
  exits: {
    success: {
      description: 'All done.',
    },
  },
  fn: async function (inputs, exits) {
    objectQueue.push(await sails.helpers.makeJob({ product: inputs.productid, integrationKey: inputs.integrationKey }));
    return exits.success();
  }
};
