# Integration tests

This package contains Integration tests and related setup files for running the Cypress suite against the bot.

## Offline setup

As this bot is hosted on AWS, [Localstack](localstack.cloud) has been configured to provide an offline, free environment to run integration tests. To start localstack, open a terminal in this package and run `docker-compose up`, or `docker-compose up -d` to run the process detached from the terminal session. Note that this requires [Docker](docker.io) to be installed in your development environment.

At this point, Localstack and its internal services are up and running so you can deploy the bot to the environment. First, build the packages with `npm run build` from the root directory. Many packages require Linux specific packages, so you'll need to run this command in a Linux environment, such as WSL on Windows. Then, you'll need to generate the Lambda libraries for `node-canvas` to work. This can be done with the following commands;

```sh
docker build -t canvas-libs .
id=$(docker create canvas-libs)
docker cp $id:/root/dist ./packages/create-map
docker cp $id:/root/dist ./packages/add-token
docker cp $id:/root/dist ./packages/move-delete-token
docker rm -v $id
```

This will build the `canvas-libs` container with all the directories formatted for copying over to the local function distribution directories.

Next, in the [Localstack `terraform`](../terraform/localstack) package you can run

```sh
terraform init
terraform apply
```

To deploy the infrastructure to Localstack, you'll need to also specify the `discord_public_key` and `discord_token`, the former of which can be found in the [`integration-test` GitHub Workflow](../../.github/workflows/integration-test.yml) as a mock value, and the latter unfortunately must be the only piece of secret data to provide, as the `janitor` tests rely on a real connection to Discord to work.

Back in this package directory, you can now run `npm run setup`, making sure you have the `CYPRESS_PRIVATE_KEY` and `CYPRESS_MAP_BUCKET` environment variables set (see the workflow file again to get working values).

## Running the tests

The Cypress tests are configured to run against the [`mock-discord` server](../mock-discord) which must be started up before Cypress is opened. Failure to do so will result in the tests not working correctly.

With the `CYPRESS_PRIVATE_KEY` and `CYPRESS_MAP_BUCKET` environment variables still set, run `npm run int:open` to open the Cypress UI and run whichever test suite you'd like. To run tests as they are run in CI, run `npm run int:run`
