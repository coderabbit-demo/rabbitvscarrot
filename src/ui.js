(function () {
  const { createGame, move, PLAYERS } = window.Game;
  const { Daily, Ai } = window;

  const MARKS = { [PLAYERS.RABBIT]: '🐰', [PLAYERS.CARROT]: '🥕' };
  const NAMES = { [PLAYERS.RABBIT]: 'Rabbit', [PLAYERS.CARROT]: 'Carrot' };
  const CARROT_DELAY_MS = 450;

  const boardEl = document.getElementById('board');
  const statusEl = document.getElementById('status');
  const resetEl = document.getElementById('reset');
  const modeFreeEl = document.getElementById('mode-free');
  const modeDailyEl = document.getElementById('mode-daily');
  const streakEl = document.getElementById('streak');
  const opponentEl = document.getElementById('opponent');
  const opponentWrapEl = document.getElementById('opponent-wrap');
  const dailyNoteEl = document.getElementById('daily-note');

  let state = createGame();
  let challenge = null; // { puzzle, rabbitMoves, locked, message } while in daily mode
  let carrotTimer = null;
  let opponent = Ai.loadLevel(); // 'human' or an Ai level; the computer plays the carrot in free play
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
    if (challenge) return playChallenge(index);
    if (computerTurn()) return;
    if (!move(state, index)) return;
    afterFreeMove();
  }

  function computerTurn() {
    return opponent !== 'human' && (state.turn === PLAYERS.CARROT || carrotTimer !== null);
  }

  function afterFreeMove() {
    render();
    if (state.over) return window.Leaderboard.record(state.winner);
    if (computerTurn()) {
      carrotTimer = setTimeout(() => {
        carrotTimer = null;
        move(state, Ai.chooseMove(state.board, PLAYERS.CARROT, opponent));
        afterFreeMove();
      }, CARROT_DELAY_MS);
    }
  }

  function playChallenge(index) {
    if (challenge.locked) return;
    if (challenge.puzzle.key !== Daily.dateKey()) {
      setMode(true); // past midnight: load today's puzzle instead of crediting yesterday's
      return;
    }
    if (!move(state, index)) return;
    challenge.rabbitMoves += 1;

    if (state.winner === PLAYERS.RABBIT) return finishChallenge(true);
    if (state.over || challenge.rabbitMoves >= challenge.puzzle.maxMoves) return finishChallenge(false);

    challenge.locked = true;
    render();
    carrotTimer = setTimeout(() => {
      carrotTimer = null;
      move(state, Daily.carrotReply(state.board));
      challenge.locked = false;
      if (state.over) return finishChallenge(false);
      render();
    }, CARROT_DELAY_MS);
  }

  function finishChallenge(won) {
    state.over = true;
    if (won) {
      const result = Daily.complete();
      challenge.message = `Solved! 🔥 ${result.streak}-day streak`;
    } else {
      challenge.message = `Not this time. Win in ${challenge.puzzle.maxMoves} moves. Press Retry.`;
    }
    render();
    renderDaily();
  }

  function render() {
    state.board.forEach((mark, i) => {
      cells[i].textContent = mark ? MARKS[mark] : '';
      cells[i].disabled = mark !== null || state.over || (challenge !== null && challenge.locked) ||
        (challenge === null && computerTurn());
    });
    if (state.line) state.line.forEach((i) => cells[i].classList.add('win'));

    if (challenge) {
      const { puzzle, rabbitMoves, message } = challenge;
      statusEl.textContent =
        message || `Daily challenge: win in ${puzzle.maxMoves} moves (move ${rabbitMoves + 1} of ${puzzle.maxMoves})`;
    } else if (state.winner) {
      statusEl.textContent = `${NAMES[state.winner]} ${MARKS[state.winner]} wins!`;
    } else if (state.over) {
      statusEl.textContent = "It's a draw!";
    } else {
      statusEl.textContent = `${NAMES[state.turn]} ${MARKS[state.turn]} to move`;
    }
    opponentWrapEl.hidden = challenge !== null;
    resetEl.textContent = challenge ? 'Retry' : 'Reset';
  }

  function renderDaily() {
    const s = Daily.status();
    streakEl.textContent = `🔥 Streak: ${s.streak} · Best: ${s.best} · ❄️ Freezes: ${s.freezes}`;
    const notes = {
      new: 'Solve today’s challenge to start a streak.',
      done: '✅ Today’s challenge is solved. Come back tomorrow!',
      'at-risk': 'Solve today’s challenge to keep your streak alive.',
      frozen: 'You missed a day, but a freeze will protect your streak if you solve today’s challenge.',
      broken: 'Streak lost. Solve today’s challenge to start a new one.',
    };
    dailyNoteEl.textContent = notes[s.state];
  }

  function clearTimer() {
    if (carrotTimer !== null) {
      clearTimeout(carrotTimer);
      carrotTimer = null;
    }
  }

  function startGame() {
    clearTimer();
    cells.forEach((cell) => cell.classList.remove('win'));
    if (challenge) {
      if (challenge.puzzle.key !== Daily.dateKey()) {
        const fresh = Daily.puzzleFor(Daily.dateKey());
        if (!fresh) return setMode(false);
        challenge.puzzle = fresh;
        renderDaily();
      }
      state = createGame();
      state.board = challenge.puzzle.board.slice();
      challenge = { puzzle: challenge.puzzle, rabbitMoves: 0, locked: false, message: '' };
    } else {
      state = createGame();
    }
    render();
  }

  function setMode(daily) {
    modeFreeEl.setAttribute('aria-pressed', String(!daily));
    modeDailyEl.setAttribute('aria-pressed', String(daily));
    if (daily) {
      const puzzle = Daily.puzzleFor(Daily.dateKey());
      if (!puzzle) return setMode(false);
      challenge = { puzzle, rabbitMoves: 0, locked: false, message: '' };
    } else {
      challenge = null;
    }
    startGame();
    renderDaily();
  }

  opponentEl.value = opponent;
  opponentEl.addEventListener('change', () => {
    opponent = opponentEl.value;
    Ai.saveLevel(opponent);
    startGame();
  });
  resetEl.addEventListener('click', startGame);
  modeFreeEl.addEventListener('click', () => setMode(false));
  modeDailyEl.addEventListener('click', () => setMode(true));
  document.getElementById('clear-scores').addEventListener('click', window.Leaderboard.clear);
  window.Leaderboard.render();
  build();
  setMode(false);
  renderDaily();
})();
