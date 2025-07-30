const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const path = require("path");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static(path.join(__dirname, "public")));

const clients = new Map();

wss.on("connection", (ws) => {
  let currentUsername = null;

  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message);

      if (data.type === "register") {
        if (!data.username) {
          ws.send(JSON.stringify({ error: "Username is required." }));
          return;
        }

        currentUsername = data.username;
        clients.set(currentUsername, ws);
        console.log(`${currentUsername} connected`);
        return;
      }

      if (data.type === "message") {
        const { to, from, message: msg } = data;
        const recipient = clients.get(to);

        if (recipient && recipient.readyState === WebSocket.OPEN) {
          recipient.send(JSON.stringify({ from, message: msg }));
        } else {
          ws.send(JSON.stringify({ error: "Recipient not available." }));
        }

        return;
      }
    } catch (err) {
      ws.send(JSON.stringify({ error: "Invalid JSON format." }));
    }
  });

  ws.on("close", () => {
    if (currentUsername) {
      clients.delete(currentUsername);
      console.log(`${currentUsername} disconnected`);
    }
  });
});

server.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
