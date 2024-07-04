const WebSocket = require("ws");
const http = require("http");

// Create an HTTP server
const server = http.createServer();

// Create a WebSocket server
const wss = new WebSocket.Server({ server, path: "/voice" });

wss.on("connection", (ws) => {
  console.log("Client connected");

  ws.on("message", (message) => {
    console.log(`Received message: $${message}`);
    // Echo the message back to the client
    ws.send(`Server received: $${message}`);
  });

  ws.on("close", () => {
    console.log("Client disconnected");
  });
});

// Start the server
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server is listening on port $${PORT}`);
});
