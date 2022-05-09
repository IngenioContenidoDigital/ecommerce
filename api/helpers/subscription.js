const ws = require('ws');
const { WebSocketLink } = require('apollo-link-ws');
const { execute} = require('apollo-link');
const { SubscriptionClient } = require('subscriptions-transport-ws');
const gql = require('graphql-tag');

module.exports = {
  friendlyName: 'Subscription Service',
  description: 'Helper usado para suscribirse a eventos emitidos graphql',
  inputs: {
    data:{
      type:'ref',
      required:true,
    }
  },
  exits: {
    success: {
      description: 'All done.',
    },
  },
  fn: async function (inputs, exits) {
    let subscriptionUrl = sails.config.custom.IMPORT_MICROSERVICE;
    const serverConfig = {serverUrl:subscriptionUrl, subscriptionUrl:subscriptionUrl.replace('http://', 'ws://')};

    const client = new SubscriptionClient(serverConfig.subscriptionUrl, {
      reconnect: true
    }, ws);

    const link = new WebSocketLink(client);

    const operation = {
      query: inputs.data.subscription
    };

    execute(link, operation).subscribe({
      next: data =>inputs.data.callback(data),
      error: error => console.log(`received error ${error}`),
      complete: () => console.log(`complete`),
    });

    exits.success(true);
  }
};


