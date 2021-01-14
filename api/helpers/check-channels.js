module.exports = {
  friendlyName: 'Check Channel',
  description: 'Check channels for sellers',
  inputs: {
    seller: {
      type: 'string'
    }
  },
  exits: {
    success: {
      description: 'All done.',
    },
  },
  fn: async function (inputs, exits) {
    let integrations = null;
    let channelDafiti = false;
    let channelLinio = false;
    let channelMercadolibre = false;

    integrations = await Integrations.find({seller: inputs.seller});
    channelDafiti = integrations.some(i => i.channel === 'dafiti') ? true : false;
    channelLinio = integrations.some(i => i.channel === 'linio') ? true : false;
    channelMercadolibre = integrations.some(i => i.channel === 'mercadolibre') ? true : false;

    return exits.success({
      channelDafiti,
      channelLinio,
      channelMercadolibre
    });
  }
};
