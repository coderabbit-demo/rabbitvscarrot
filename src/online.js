(function () {
  const MARKS = { R: '🐰', C: '🥕' };
  const NAMES = { R: 'Rabbit', C: 'Carrot' };

  const boardEl = document.getElementById('board');
  const statusEl = document.getElementById('status');
  const resetEl = document.getElementById('reset');
  const lobby = document.getElementById('lobby');
  const roomInfo = document.getElementById('room-info');
  const nameInput = document.getElementById('name');
  const codeInput = document.getElementById('code');
  const createBtn = document.getElementById('create');
  const joinBtn = document.getElementById('join');
  const chatPanel = document.getElementById('chat');
  const chatLog = document.getElementById('chat-log');
  const chatInput = document.getElementById('chat-input');
  const chatSend = document.getElementById('chat-send');

  let net = null;
  let myMark = null;
  let online = false;
  let board = Array(9).fill(null);
  let turn = 'R';
  const cells = [];

  function ensureConnected() {
    if (!net) net = window.Net.connect({ onMessage: handle });
  }

  function handle(msg) {
    switch (msg.type) {
      case 'joined':
        myMark = msg.mark;
        online = true;
        roomInfo.textContent = `Room ${msg.code} — you are ${NAMES[msg.mark]} ${MARKS[msg.mark]}`;
        lobby.classList.add('hidden');
        chatPanel.classList.remove('hidden');
        buildBoard();
        renderBoard();
        break;
      case 'state':
        board = msg.board;
        turn = msg.turn;
        renderBoard();
        break;
      case 'opponent':
        addSystem(`${msg.name} joined`);
        break;
      case 'chat':
        addChat(msg.name, msg.text);
        break;
      case 'left':
        addSystem('Opponent left');
        break;
      case 'error':
        roomInfo.textContent = msg.message;
        break;
      default:
        break;
    }
  }

  function buildBoard() {
    boardEl.innerHTML = '';
    cells.length = 0;
    for (let i = 0; i < 9; i++) {
      const cell = document.createElement('button');
      cell.className = 'cell';
      cell.type = 'button';
      cell.addEventListener('click', () => sendMove(i));
      boardEl.appendChild(cell);
      cells.push(cell);
    }
  }

  function sendMove(index) {
    if (board[index] !== null) return;
    if (turn !== myMark) return;
    net.send({ type: 'move', index, player: myMark });
  }

  function renderBoard() {
    board.forEach((mark, i) => {
      cells[i].textContent = mark ? MARKS[mark] : '';
      cells[i].classList.remove('win');
    });

    const win = window.Game.findWinner(board);
    if (win) {
      win.line.forEach((i) => cells[i].classList.add('win'));
      statusEl.textContent = `${NAMES[win.player]} ${MARKS[win.player]} wins!`;
    } else if (board.every((cell) => cell !== null)) {
      statusEl.textContent = "It's a draw!";
    } else {
      const yours = turn === myMark ? ' (your turn)' : '';
      statusEl.textContent = `${NAMES[turn]} ${MARKS[turn]} to move${yours}`;
    }

    const done = !!win || board.every((cell) => cell !== null);
    cells.forEach((cell, i) => {
      cell.disabled = board[i] !== null || done || turn !== myMark;
    });
  }

  resetEl.addEventListener('click', () => {
    if (online && net) net.send({ type: 'reset' });
  });

  function addChat(name, text) {
    const line = document.createElement('div');
    line.className = 'chat-line';
    line.innerHTML = `<b>${name}</b>: ${text}`;
    chatLog.appendChild(line);
    chatLog.scrollTop = chatLog.scrollHeight;
  }

  function addSystem(text) {
    const line = document.createElement('div');
    line.className = 'chat-line system';
    line.innerHTML = text;
    chatLog.appendChild(line);
    chatLog.scrollTop = chatLog.scrollHeight;
  }

  function sendChat() {
    const text = chatInput.value.trim();
    if (!text || !net) return;
    net.send({ type: 'chat', text });
    chatInput.value = '';
  }

  chatSend.addEventListener('click', sendChat);
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendChat();
  });

  createBtn.addEventListener('click', () => {
    ensureConnected();
    net.send({ type: 'create', name: nameInput.value.trim() });
  });

  joinBtn.addEventListener('click', () => {
    ensureConnected();
    net.send({ type: 'join', code: codeInput.value.trim(), name: nameInput.value.trim() });
  });
})();
