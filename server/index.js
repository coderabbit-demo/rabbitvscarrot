const http = require('http');
const { WebSocketServer } = require('ws');
const { serveStatic } = require('./static');

const PORT = process.env.PORT || 8080;

const server = http.createServer((req, res) => {
  serveStatic(req, res);
});

const wss = new WebSocketServer({ server });

wss.on('connection', (socket) => {
  socket.on('message', (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw);
    } catch {
      return;
    }
    handle(socket, msg);
  });
});

function handle(socket, msg) {
  switch (msg.type) {
    default:
      break;
  }
}

server.listen(PORT, () => {
  console.log(`rabbitvscarrot listening on http://localhost:${PORT}`);
});
