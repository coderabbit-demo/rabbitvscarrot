const http = require('http');
const { WebSocketServer } = require('ws');
const { serveStatic } = require('./static');
const { createRoom, joinRoom } = require('./rooms');

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

function send(socket, msg) {
  if (socket.readyState === socket.OPEN) socket.send(JSON.stringify(msg));
}

function handle(socket, msg) {
  switch (msg.type) {
    case 'create': {
      const room = createRoom(socket, msg.name);
      socket.room = room;
      send(socket, { type: 'joined', code: room.code, mark: 'R' });
      break;
    }
    case 'join': {
      const room = joinRoom(msg.code, socket, msg.name);
      if (!room) {
        send(socket, { type: 'error', message: 'Room not found or full' });
        break;
      }
      socket.room = room;
      const [host, guest] = room.players;
      send(guest.socket, { type: 'joined', code: room.code, mark: 'C' });
      send(host.socket, { type: 'opponent', name: guest.name });
      send(guest.socket, { type: 'opponent', name: host.name });
      break;
    }
    default:
      break;
  }
}

server.listen(PORT, () => {
  console.log(`rabbitvscarrot listening on http://localhost:${PORT}`);
});
