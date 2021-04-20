const gql = require('graphql-tag');

module.exports = {
  SHOPIFY_PRODUCTS : gql`
    subscription{
        ShopifyProducts{
            productId,
            key,
            channel,
            discount
        }
    }`,

  SHOPIFY_ORDERS : gql`
    subscription{
        ShopifyOrders{
            orderId,
            key,
            channel,
        }
    }`
};
