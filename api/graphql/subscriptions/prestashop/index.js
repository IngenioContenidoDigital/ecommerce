const gql = require('graphql-tag');

module.exports = {
  PRESTASHOP_PRODUCTS : gql`
    subscription{
      PrestashopProducts{
        productId,
        key,
        channel
      }
    }`
};