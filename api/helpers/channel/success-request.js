module.exports = {
  friendlyName: 'Success Request',
  description: 'Para responder status 200 a la notificacion',
  inputs: {
    res: {
      type: 'ref',
      required: true
    }
  },
  fn: async function (inputs) {
    return inputs.res.ok();
  }
};
