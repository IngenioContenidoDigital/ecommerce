const gql = require('graphql-tag');

module.exports = {
    ORDER_STATUS_CHANGED : gql`
    subscription{
        OrderStatusChanged{
            reference
            status
            statusText
        }
    }`
}