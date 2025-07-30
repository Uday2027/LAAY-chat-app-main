const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const fs = require("fs");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static("public"));

const clients = new Map();
const messagesFile = "messages.json";

function saveMessage(from, to, message) {
  const entry = { timestamp: Date.now(), from, to, message };
  let allMessages = [];

  if (fs.existsSync(messagesFile)) {
    const raw = fs.readFileSync(messagesFile);
    allMessages = JSON.parse(raw);
  }

  allMessages.push(entry);
  fs.writeFileSync(messagesFile, JSON.stringify(allMessages, null, 2));
}

function broadcastOnlineUsers() {
  const onlineUsers = Array.from(clients.keys());
  const payload = JSON.stringify({ type: "onlineUsers", users: onlineUsers });

  for (const client of clients.values()) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
}

wss.on("connection", (ws) => {
  let currentUsername = null;

  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message);

      if (data.type === "register") {
        currentUsername = data.username;
        clients.set(currentUsername, ws);
        console.log(`${currentUsername} connected`);
        broadcastOnlineUsers();
        return;
      }

      if (data.type === "message") {
        const { to, from, message: msg } = data;
        saveMessage(from, to, msg);

        const recipient = clients.get(to);
        if (recipient && recipient.readyState === WebSocket.OPEN) {
          recipient.send(JSON.stringify({ from, message: msg }));
        } else {
          ws.send(JSON.stringify({ error: "Recipient not available." }));
        }
      }
    } catch (err) {
      ws.send(JSON.stringify({ error: "Invalid message format." }));
    }
  });

  ws.on("close", () => {
    if (currentUsername) {
      clients.delete(currentUsername);
      console.log(`${currentUsername} disconnected`);
      broadcastOnlineUsers();
    }
  });
});

server.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
