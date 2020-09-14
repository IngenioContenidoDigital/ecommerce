module.exports = {
  friendlyName: 'Check Channel',
  description: 'Check channels for sellers',
  inputs: {
    profile: {
      type: 'string',
      required: true,
    },
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
    let sellers = null;
    let integrations = null;
    let channelDafiti = false;
    let channelLinio = false;
    let channelMercadolibre = false;

    if(inputs.profile === 'superadmin' || inputs.profile === 'admin'){
      integrations = await Integrations.find({
        or : [
          { channel: 'dafiti' },
          { channel: 'linio' },
          { channel: 'mercadolibre' }
        ],
      });
      let slist = integrations.map(i => i.seller);
      sellers = await Seller.find({where: {id: {in: slist}}, select: ['id', 'name']});
      sellers = sellers.map(s => {
        s.channelDafiti = integrations.some(i => i.seller === s.id && i.channel === 'dafiti') ? true : false;
        s.channelLinio = integrations.some(i => i.seller === s.id && i.channel === 'linio') ? true : false;
        s.channelMercadolibre = integrations.some(i => i.seller === s.id && i.channel === 'mercadolibre') ? true : false;
        return s;
      });
    } else {
      integrations = await Integrations.find({seller: inputs.seller});
      channelDafiti = integrations.some(i => i.channel === 'dafiti') ? true : false;
      channelLinio = integrations.some(i => i.channel === 'linio') ? true : false;
      channelMercadolibre = integrations.some(i => i.channel === 'mercadolibre') ? true : false;
    }

    return exits.success({
      sellers,
      channelDafiti,
      channelLinio,
      channelMercadolibre
    });
  }
};
