// Pure Tic-Tac-Toe logic. No DOM access lives here so it can be reused and tested.
// Exposed on window.Game so the page works when opened directly from the filesystem.
(function (global) {
  const PLAYERS = { RABBIT: 'R', CARROT: 'C' };

  const WINNING_LINES = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
    [0, 4, 8], [2, 4, 6],            // diagonals
  ];

  function createGame() {
    return {
      board: Array(9).fill(null), // each cell is null, 'R', or 'C'
      turn: PLAYERS.RABBIT,       // rabbit always starts
      winner: null,              // 'R', 'C', or null
      line: null,                // winning line indices, when there is a winner
      over: false,               // true on win or draw
      history: [],               // cell indices in the order they were played
    };
  }

  // Attempt to play cell `index` for the current player.
  // Returns true if the move was applied, false if it was illegal.
  function move(state, index) {
    if (state.over || state.board[index] !== null) return false;

    state.board[index] = state.turn;
    state.history.push(index);

    const win = findWinner(state.board);
    if (win) {
      state.winner = win.player;
      state.line = win.line;
      state.over = true;
    } else if (state.board.every((cell) => cell !== null)) {
      state.over = true; // draw
    } else {
      state.turn = state.turn === PLAYERS.RABBIT ? PLAYERS.CARROT : PLAYERS.RABBIT;
    }

    return true;
  }

  // Take back the last move. Returns true if there was one to undo.
  // Rabbit moves first, so whoever made move N is fixed by the parity of N.
  function undo(state) {
    if (state.history.length === 0) return false;

    state.board[state.history.pop()] = null;
    state.turn = state.history.length % 2 === 0 ? PLAYERS.RABBIT : PLAYERS.CARROT;
    state.winner = null;
    state.line = null;
    state.over = false;
    return true;
  }

  // Returns { player, line } for a completed line, or null.
  function findWinner(board) {
    for (const line of WINNING_LINES) {
      const [a, b, c] = line;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return { player: board[a], line };
      }
    }
    return null;
  }

  global.Game = { PLAYERS, createGame, move, undo, findWinner };
})(typeof window !== 'undefined' ? window : globalThis);
