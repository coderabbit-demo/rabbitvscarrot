// Computer opponent. Pure logic, no DOM access. Exposed on window.Ai.
// Levels: 'easy' (random), 'medium' (win / block / else random), 'hard' (unbeatable minimax).
(function (global) {
  const { findWinner } = global.Game;
  const LEVELS = ['easy', 'medium', 'hard'];
  const STORAGE_KEY = 'rvc.opponent';

  function emptyCells(board) {
    const out = [];
    board.forEach((cell, i) => { if (cell === null) out.push(i); });
    return out;
  }

  function other(player) {
    return player === 'R' ? 'C' : 'R';
  }

  function pick(list, rng) {
    return list[Math.floor((rng || Math.random)() * list.length)];
  }

  // Cell that would complete a line for `player`, or -1.
  function completingMove(board, player) {
    for (const i of emptyCells(board)) {
      board[i] = player;
      const win = findWinner(board);
      board[i] = null;
      if (win) return i;
    }
    return -1;
  }

  // Score from `me`'s perspective: +10 - depth for a win, depth - 10 for a loss, 0 draw.
  function minimax(board, turn, me, depth) {
    const win = findWinner(board);
    if (win) return win.player === me ? 10 - depth : depth - 10;
    const moves = emptyCells(board);
    if (moves.length === 0) return 0;
    let best = turn === me ? -Infinity : Infinity;
    for (const i of moves) {
      board[i] = turn;
      const score = minimax(board, other(turn), me, depth + 1);
      board[i] = null;
      best = turn === me ? Math.max(best, score) : Math.min(best, score);
    }
    return best;
  }

  function bestMoves(board, player) {
    let bestScore = -Infinity;
    let best = [];
    for (const i of emptyCells(board)) {
      board[i] = player;
      const score = minimax(board, other(player), player, 1);
      board[i] = null;
      if (score > bestScore) { bestScore = score; best = [i]; }
      else if (score === bestScore) best.push(i);
    }
    return best;
  }

  // Choose a cell for `player` on `board`. Returns -1 if the board is full.
  // Does not mutate the board. `rng` is optional (returns [0,1)) for tests.
  function chooseMove(board, player, level, rng) {
    const work = board.slice();
    const moves = emptyCells(work);
    if (moves.length === 0) return -1;
    if (level === 'hard') {
      // Every opening is a draw with best play, so skip the costly search on an empty board.
      if (moves.length === 9) return pick([0, 2, 4, 6, 8], rng);
      return pick(bestMoves(work, player), rng);
    }
    if (level === 'medium') {
      const win = completingMove(work, player);
      if (win !== -1) return win;
      const block = completingMove(work, other(player));
      if (block !== -1) return block;
    }
    return pick(moves, rng);
  }

  function loadLevel() {
    try {
      const v = global.localStorage.getItem(STORAGE_KEY);
      return v === 'human' || LEVELS.indexOf(v) !== -1 ? v : 'human';
    } catch (e) {
      return 'human';
    }
  }

  function saveLevel(level) {
    try {
      global.localStorage.setItem(STORAGE_KEY, level);
    } catch (e) { /* storage unavailable: ignore */ }
  }

  global.Ai = { LEVELS, chooseMove, loadLevel, saveLevel };
})(typeof window !== 'undefined' ? window : globalThis);
