# Carto - Mapping Discord Bot

Carto aims to give DMs and Players on Discord a simple way to track movement around a gridded map.

[![Deployment](https://github.com/Carto-Discord/carto/actions/workflows/deployment.yml/badge.svg)](https://github.com/Carto-Discord/carto/actions/workflows/deployment.yml)

## Getting Started

Here are some steps to help you get started with Carto

- [Add Carto to your server](https://discord.com/api/oauth2/authorize?client_id=830747336531116053&permissions=2147534912&redirect_uri=https%3A%2F%2Fcarto-discord.github.io%2Fdocumentation%2Fhow-to%2F&response_type=code&scope=bot%20messages.read%20applications.commands)
- [Join the Discord Server](https://discord.gg/7mrGqQt3pD)
- [Read the user guide](https://carto-discord.github.io/carto)

## Development

This project uses [NPM Workspaces](https://docs.npmjs.com/cli/v8/using-npm/workspaces), and thus requires a Node version of 14 or higher, and an NPM version higher than 7.

Each package is individually documented, but all builds, tests and linting can be run from the root directory with

```
npm run build
npm run test
npm run lint
```

respectively.

## Contributing

All contributions are welcome! Please raise an issue with your ideas first before making a PR.
