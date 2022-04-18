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
    url: `https://sync.1ecommerce.app/prestashop/product/updateproduct/processproduct/${result.data.integrationKey}`,
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
  friendlyName: 'Function Stock Sync',
  description: 'funcion lambda para sincronizar actualizar stock productos',
  inputs: {
    productid: {
      type:'string',
      required: true,
    },
    integrationKey: {
      type:'string',
      required: true,
    },
  },
  exits: {
    success: {
      description: 'All done.',
    },
  },
  fn: async function (inputs, exits) {
    objectQueue.push(await sails.helpers.makeJob({product: inputs.productid, integrationKey: inputs.integrationKey}));
    return exits.success();
  }
};

