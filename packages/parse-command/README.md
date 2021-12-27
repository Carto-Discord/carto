# Parse Command

Parses slash commands received from Discord and starts the Step Functions Workflow with the data derived from Discord.

## Build

In the repo root

```sh
npm run build -w parse-command
```

## Local development

Within this monorepo local development is supported by Localstack.
(Instructions coming soon)

## Deployment to AWS

The following environment variables are required for proper functioning of this Lambda;

| Name              | Description                                           |
| ----------------- | ----------------------------------------------------- |
| PUBLIC_KEY        | Discord Bot Public Key                                |
| STATE_MACHINE_ARN | ARN of the AWS Step Functions state machine to launch |
