// In-memory registry of active rooms. A room holds up to two players,
// the shared board and whose turn it is.
const rooms = new Map();

function generateCode() {
  return Math.random().toString(36).slice(2, 6);
}

function createRoom(socket, name) {
  let code = generateCode();
  while (rooms.has(code)) code = generateCode();

  const room = {
    code,
    players: [{ socket, mark: 'R', name: name || 'Rabbit' }],
    board: Array(9).fill(null),
    turn: 'R',
  };
  rooms.set(code, room);
  return room;
}

function joinRoom(code, socket, name) {
  const room = rooms.get(code);
  if (!room || room.players.length >= 2) return null;
  room.players.push({ socket, mark: 'C', name: name || 'Carrot' });
  return room;
}

function playerFor(room, socket) {
  return room.players.find((p) => p.socket === socket) || null;
}

function applyMove(room, index, player) {
  room.board[index] = player;
  room.turn = player === 'R' ? 'C' : 'R';
}

function resetBoard(room) {
  room.board = Array(9).fill(null);
  room.turn = 'R';
}

// Removes the socket's room and returns the remaining player, if any.
function handleDisconnect(socket) {
  const room = socket.room;
  if (!room) return null;
  rooms.delete(room.code);
  return room.players.find((p) => p.socket !== socket) || null;
}

module.exports = {
  rooms,
  createRoom,
  joinRoom,
  playerFor,
  applyMove,
  resetBoard,
  handleDisconnect,
};
