const gql = require('graphql-tag');

module.exports = {
  SHOPIFY_PRODUCT_CREATED : gql`
    subscription{
        ShopifyProductCreated{
            productId,
            key,
            channel
        }
    }`
};
