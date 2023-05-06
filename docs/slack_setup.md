## Slack setup

A Slack app event subscription with a bot user is required for Slack to send events to the API gateway endpoint.

After deploying the application to Google Cloud, refer to the documentation on [Slack Event Subscriptions](https://api.slack.com/events-api) to configure a [slack app](https://api.slack.com/authentication/basics) with an event subscription.

Use `xplorers_bot_function_uri` from terraform output as the event subscription url.

The following scopes are required for bot user to interact with Slack,
* chat:write - Send messages as bot user
* reactions:read - View emoji reactions and their associated content in channels and conversations that bot user has been added to
* reactions:write - Add and edit emoji reactions

Bot events to subscribe to,
* message.channels - A message was posted to a channel
* team_join - A new member has joined

Store the bot oauth token in Google Cloud Secrets. Set environment variable `SLACK_OAUTH_TOKEN` and run the make command `make create-slack-token-secret` to create a secret with the value of the slack token. The token is then mounted to Google Cloud functions which is available to the application code at runtime.
