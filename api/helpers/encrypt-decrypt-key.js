module.exports = {
  friendlyName: 'Encrypt or Decrypt Key',
  description: 'Para encriptar o desencriptar string',
  inputs: {
    text:{
      type:'string',
      requiered:true,
    },
    option: {
      type:'string',
      requiered:true,
    },
  },
  exits: {
    success: {
      description: 'All done.',
    },
  },
  fn: async function (inputs, exits) {
    const crypto = require('crypto');
    const key = 'L0f3q2n21982**1ecommerce.app2020';
    const iv = crypto.randomBytes(16);
    try {
      if (inputs.option === 'encrypt') {
        let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), iv);
        let encrypted = cipher.update(`${inputs.text}`);
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        const result = iv.toString('hex') + '_' + encrypted.toString('hex');
        return exits.success(result);
      } else {
        let textIv = inputs.text.split('_')[0];
        let textEncryptedData = inputs.text.split('_')[1];
        let ivtext = Buffer.from(textIv, 'hex');
        let encryptedText = Buffer.from(textEncryptedData, 'hex');
        let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key), ivtext);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return exits.success(decrypted.toString());
      }
    } catch (err) {
      return exits.success('');
    }
  }
};
