(function () {
  const MARKS = { R: '🐰', C: '🥕' };
  const NAMES = { R: 'Rabbit', C: 'Carrot' };

  const boardEl = document.getElementById('board');
  const lobby = document.getElementById('lobby');
  const roomInfo = document.getElementById('room-info');
  const nameInput = document.getElementById('name');
  const codeInput = document.getElementById('code');
  const createBtn = document.getElementById('create');
  const joinBtn = document.getElementById('join');

  let net = null;
  let myMark = null;
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
        roomInfo.textContent = `Room ${msg.code} — you are ${NAMES[msg.mark]} ${MARKS[msg.mark]}`;
        lobby.classList.add('hidden');
        buildBoard();
        renderBoard();
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
      cells[i].disabled = mark !== null;
    });
  }

  createBtn.addEventListener('click', () => {
    ensureConnected();
    net.send({ type: 'create', name: nameInput.value.trim() });
  });

  joinBtn.addEventListener('click', () => {
    ensureConnected();
    net.send({ type: 'join', code: codeInput.value.trim(), name: nameInput.value.trim() });
  });
})();
