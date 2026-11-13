// Daily challenge: a seeded "win in 2 moves" puzzle plus streak tracking.
// Puzzle and streak maths are pure (dates are passed in) so they can be tested in node.
(function (global) {
  const { PLAYERS, findWinner } = global.Game;
  const R = PLAYERS.RABBIT;
  const C = PLAYERS.CARROT;

  const KEY = 'rabbitvscarrot:daily';
  const MAX_MOVES = 2; // rabbit must win with its 2nd move at the latest
  const MAX_FREEZES = 2;
  const FREEZE_EVERY = 7; // earn a streak-freeze every 7 days of streak
  const EMPTY = { streak: 0, best: 0, freezes: 1, lastWin: null };

  // ---- dates -------------------------------------------------------------

  function dateKey(date) {
    const d = date || new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  function dayNumber(key) {
    const [y, m, d] = key.split('-').map(Number);
    return Math.round(Date.UTC(y, m - 1, d) / 86400000);
  }

  // ---- seeded random -----------------------------------------------------

  function seedFrom(str) {
    let h = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i++) {
      h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^ (h >>> 16)) >>> 0;
  }

  function rng(seed) {
    let a = seed;
    return function () {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // ---- puzzle ------------------------------------------------------------

  function empties(board) {
    const out = [];
    board.forEach((cell, i) => {
      if (cell === null) out.push(i);
    });
    return out;
  }

  function place(board, index, mark) {
    const next = board.slice();
    next[index] = mark;
    return next;
  }

  // Can the rabbit (to move) force a win within `movesLeft` of its own moves,
  // however the carrot replies?
  function forcedWin(board, movesLeft) {
    if (movesLeft < 1) return false;
    for (const m of empties(board)) {
      const after = place(board, m, R);
      if (findWinner(after)) return true;
      if (movesLeft === 1) continue;
      const replies = empties(after);
      if (replies.length === 0) continue;
      const holds = replies.every((c) => {
        const next = place(after, c, C);
        return !findWinner(next) && forcedWin(next, movesLeft - 1);
      });
      if (holds) return true;
    }
    return false;
  }

  function randomPosition(random) {
    const plies = random() < 0.5 ? 2 : 4;
    let board = Array(9).fill(null);
    for (let ply = 0; ply < plies; ply++) {
      const free = empties(board);
      board = place(board, free[Math.floor(random() * free.length)], ply % 2 === 0 ? R : C);
    }
    return board;
  }

  // The same date always yields the same puzzle: rabbit to move, no instant win,
  // but a forced win in MAX_MOVES moves.
  function puzzleFor(key) {
    const random = rng(seedFrom(key));
    for (let attempt = 0; attempt < 100000; attempt++) {
      const board = randomPosition(random);
      if (findWinner(board) || forcedWin(board, 1) || !forcedWin(board, MAX_MOVES)) continue;
      return { key, board, maxMoves: MAX_MOVES };
    }
    return null;
  }

  // The carrot's scripted reply: win if it can, block if it must, then centre, then first free cell.
  function carrotReply(board) {
    const free = empties(board);
    const winning = free.find((i) => findWinner(place(board, i, C)));
    if (winning !== undefined) return winning;
    const block = free.find((i) => findWinner(place(board, i, R)));
    if (block !== undefined) return block;
    return board[4] === null ? 4 : free[0];
  }

  // ---- streaks -----------------------------------------------------------

  // Days missed between the last win and `today`, or null if there is no last win.
  function missedDays(data, today) {
    if (!data.lastWin) return null;
    return Math.max(0, dayNumber(today) - dayNumber(data.lastWin) - 1);
  }

  function statusOf(data, today) {
    const base = { best: data.best, freezes: data.freezes, doneToday: false };
    if (!data.lastWin) return { ...base, streak: 0, state: 'new' };
    if (data.lastWin >= today) return { ...base, streak: data.streak, doneToday: true, state: 'done' };
    const missed = missedDays(data, today);
    if (missed === 0) return { ...base, streak: data.streak, state: 'at-risk' };
    if (data.freezes >= missed) return { ...base, streak: data.streak, state: 'frozen' };
    return { ...base, streak: 0, state: 'broken' };
  }

  // Returns the updated data after solving the challenge on `today`.
  function completeOn(data, today) {
    if (data.lastWin && data.lastWin >= today) return data;
    const missed = missedDays(data, today);
    const next = { ...data, lastWin: today };
    if (missed === null) {
      next.streak = 1;
    } else if (missed === 0) {
      next.streak = data.streak + 1;
    } else if (data.freezes >= missed) {
      next.freezes = data.freezes - missed;
      next.streak = data.streak + 1;
    } else {
      next.streak = 1;
    }
    next.best = Math.max(data.best, next.streak);
    if (next.streak % FREEZE_EVERY === 0 && next.freezes < MAX_FREEZES) next.freezes += 1;
    return next;
  }

  // ---- storage -----------------------------------------------------------

  function load() {
    try {
      return { ...EMPTY, ...JSON.parse(localStorage.getItem(KEY)) };
    } catch (e) {
      return { ...EMPTY };
    }
  }

  function save(data) {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      // storage unavailable; the streak lasts for this page view only
      return false;
    }
  }

  let data = load();
  let unsaved = false; // progress that could not be persisted; keep it over stored data

  // Re-read storage so another tab's progress is never overwritten; keep the
  // in-memory state when storage is unreadable or empty.
  function refresh() {
    if (unsaved) return;
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) data = { ...EMPTY, ...JSON.parse(raw) };
    } catch (e) {
      // keep in-memory state
    }
  }

  function status() {
    refresh();
    return statusOf(data, dateKey());
  }

  function complete() {
    refresh();
    data = completeOn(data, dateKey());
    unsaved = !save(data);
    return statusOf(data, dateKey());
  }

  global.Daily = {
    MAX_MOVES,
    dateKey,
    puzzleFor,
    carrotReply,
    forcedWin,
    statusOf,
    completeOn,
    status,
    complete,
  };
})(typeof window !== 'undefined' ? window : globalThis);
