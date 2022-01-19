const gql = require('graphql-tag');

module.exports = {
  NOTIFICATION_MELI : gql`
    subscription{
      NotificationMeli{
        resource,
        user_id,
        topic
      }
    }`
};
