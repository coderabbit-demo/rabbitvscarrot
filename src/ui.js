(function () {
  const { createGame, move, PLAYERS } = window.Game;

  const MARKS = { [PLAYERS.RABBIT]: '🐰', [PLAYERS.CARROT]: '🥕' };
  const NAMES = { [PLAYERS.RABBIT]: 'Rabbit', [PLAYERS.CARROT]: 'Carrot' };

  const boardEl = document.getElementById('board');
  const statusEl = document.getElementById('status');
  const resetEl = document.getElementById('reset');

  let state = createGame();
  const cells = [];

  function build() {
    for (let i = 0; i < 9; i++) {
      const cell = document.createElement('button');
      cell.className = 'cell';
      cell.type = 'button';
      cell.dataset.index = String(i);
      cell.addEventListener('click', () => play(i));
      boardEl.appendChild(cell);
      cells.push(cell);
    }
  }

  function play(index) {
    if (!move(state, index)) return;
    render();
  }

  function render() {
    state.board.forEach((mark, i) => {
      cells[i].textContent = mark ? MARKS[mark] : '';
      cells[i].disabled = mark !== null || state.over;
    });

    if (state.winner) {
      statusEl.textContent = `${NAMES[state.winner]} ${MARKS[state.winner]} wins!`;
      if (state.line) state.line.forEach((i) => cells[i].classList.add('win'));
    } else if (state.over) {
      statusEl.textContent = "It's a draw!";
    } else {
      statusEl.textContent = `${NAMES[state.turn]} ${MARKS[state.turn]} to move`;
    }
  }

  function reset() {
    state = createGame();
    cells.forEach((cell) => {
      cell.classList.remove('win');
      cell.disabled = false;
    });
    render();
  }

  resetEl.addEventListener('click', reset);
  build();
  render();
})();
