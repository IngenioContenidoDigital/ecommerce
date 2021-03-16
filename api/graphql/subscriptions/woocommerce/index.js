const gql = require('graphql-tag');

module.exports = {
  WOOCOMMERCE_PRODUCTS : gql`
    subscription{
        WoocommerceProducts{
            productId,
            key,
            channel
            separate_product_by_color
        }
    }`
};