module.exports = {
  friendlyName: 'Send sms',
  description: 'Used to Send SMS Messages to registered Users',
  inputs: {
    message:{
      type:'string',
      required:true
    },
    destination:{
      type:'number',
      required:true
    }
  },
  exits: {
    success: {
      description: 'All done.',
    },
  },
  fn: async function (inputs,exits) {
    let AWS = require('aws-sdk');
    AWS.config.loadFromPath('./config.json');
    let params = {
      Message: inputs.message,
      PhoneNumber: (inputs.destination).toString()
    };

    let publishTextPromise = new AWS.SNS({apiVersion: '2010-03-31'}).publish(params).promise();
    publishTextPromise
    .then(
      (data) => {
        return exits.success(data);
      }
    )
    .catch(
      (err) => {
        return exits.error(err);
      }
    );
  }
};

