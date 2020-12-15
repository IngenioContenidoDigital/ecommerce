const gql = require('graphql-tag');

module.exports = {
  VTEX_PRODUCTS : gql`
    subscription{
      VtexProducts{
        productId,
        key,
        channel
      }
    }`
};
