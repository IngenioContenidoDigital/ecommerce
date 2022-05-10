let queue = require('queue');
const jsonxml = require('jsontoxml');

let objectQueue = queue({
  timeout: 5000,
  concurrency: 1,
  autostart: true
});

objectQueue.on('start', async (result) => {
  let imgresult = result.data.integration.channel.name === 'dafiti' ?
    await sails.helpers.channel.dafiti.images([result.data.product], result.data.integration.id) :
    await sails.helpers.channel.linio.images([result.data.product], result.data.integration.id);

  const imgxml = jsonxml(imgresult, true);

  let imgsign = result.data.integration.channel.name === 'dafiti' ?
    await sails.helpers.channel.dafiti.sign(result.data.integration.id, 'Image', result.data.product.seller) :
    await sails.helpers.channel.linio.sign(result.data.integration.id, 'Image', result.data.product.seller);

  await sails.helpers.request(result.data.integration.channel.endpoint,'/?'+imgsign,'POST',imgxml);
});

module.exports = {
  friendlyName: 'Function Image Sync',
  description: 'funcion para enviar imagenes a dafiti y linio',
  inputs: {
    integration: {
      type:'ref',
      required: true,
    },
    product: {
      type:'ref',
      required: true,
    },
  },
  exits: {
    success: {
      description: 'All done.',
    },
  },
  fn: async function (inputs, exits) {
    objectQueue.push(await sails.helpers.makeJob({product: inputs.product, integration: inputs.integration }));
    return exits.success();
  }
};
