const http = require('http');
const { WebSocketServer } = require('ws');
const { serveStatic } = require('./static');
const { createRoom, joinRoom, applyMove, resetBoard, playerFor } = require('./rooms');

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

function broadcastState(room) {
  const payload = { type: 'state', board: room.board, turn: room.turn };
  room.players.forEach((p) => send(p.socket, payload));
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
      broadcastState(room);
      break;
    }
    case 'move': {
      const room = socket.room;
      if (!room) break;
      applyMove(room, msg.index, msg.player);
      broadcastState(room);
      break;
    }
    case 'reset': {
      const room = socket.room;
      if (!room) break;
      resetBoard(room);
      broadcastState(room);
      break;
    }
    case 'chat': {
      const room = socket.room;
      if (!room) break;
      const me = playerFor(room, socket);
      const payload = { type: 'chat', name: me ? me.name : 'Anon', text: msg.text };
      room.players.forEach((p) => send(p.socket, payload));
      break;
    }
    default:
      break;
  }
}

server.listen(PORT, () => {
  console.log(`rabbitvscarrot listening on http://localhost:${PORT}`);
});
