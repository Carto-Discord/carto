# Mock Discord

A simple websocket server to emulate Discord application command functionality

## Design

Launching the server with `npm start -w @carto/mock-discord` will serve a simple HTML page at `http://localhost:3000` that will display all messages sent with the PATCH method to `http://localhost:3000/webhooks/:applicationId/:token/messages/@original`. The URL parameters and PATCH body will be added to a list on the page, that can then be asserted on my test suites, such as [the `integration` tests](../integration).
