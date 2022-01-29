# Parse Command

Parses slash commands received from Discord and starts the Step Functions Workflow with the data derived from Discord.

## Design

When deployed, this Lambda can be invoked directly or via an API Gateway. However, it is not designed for invocation manually, but from the Discord client. Hence, all requests sent to it must have a valid request signature which is determined by [the `validateRequest` function](./src/validation.ts).

Discord will also send an [Application Command Object](https://discord.com/developers/docs/interactions/application-commands#application-command-object) to the Lambda, which contains commands and subcommands as specified in [`register-commands`](../register-commands). These are parsed here and transformed into an object that can be understood by the State Machine.

## Deployment to AWS

The following environment variables are required for proper functioning of this Lambda;

| Name              | Description                                           |
| ----------------- | ----------------------------------------------------- |
| PUBLIC_KEY        | Discord Bot Public Key                                |
| STATE_MACHINE_ARN | ARN of the AWS Step Functions state machine to launch |

The package can be built by running `npm run build -w @carto/parse-command` from the repository root.
