# Send Response

Sends the received embed object to Discord

## Design

This Lambda should not be invoked directly, it is designed to be part of a State Machine. Exposing it to the internet may result in abuse of the service.

Intended as the last step in the State Machine, this function simply takes an [embed](https://discord.com/developers/docs/resources/channel#embed-object) object along with the `application_id` and `token` from the original message from Discord, that can be used to [update a message](https://discord.com/developers/docs/interactions/receiving-and-responding#edit-original-interaction-response). If no embed is received, the message will be a generic error. This will often only occur when an upstream Lambda throws an unhandled exception.

## Deployment to AWS

The following environment variables are required for proper functioning of this Lambda;

| Name     | Description                         |
| -------- | ----------------------------------- |
| BASE_URL | Discord URL with API version number |

The package can be built by running `npm run build -w @carto/send-response` from the repository root.
