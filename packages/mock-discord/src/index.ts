import express from "express";
import { fileURLToPath } from "url";
import path, { dirname } from "path";
import http from "http";
import { WebSocketServer, OPEN } from "ws";

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const port = 3000;

app.use(express.json());
app.use(
  express.static(
    path.join(dirname(fileURLToPath(import.meta.url)), "/../public")
  )
);

app.patch("/webhooks/:applicationId/:token/messages/@original", (req, res) => {
  wss.clients.forEach((client) => {
    if (client.readyState === OPEN) {
      const response = {
        params: req.params,
        body: req.body,
      };

      client.send(JSON.stringify(response));
    }
  });
  res.sendStatus(204);
});

server.listen(port, () => {
  console.log(`Discord Mock listening at http://localhost:${port}`);
});
