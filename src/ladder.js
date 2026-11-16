// Player names, per-player stats and Elo ranking. Pure logic plus localStorage; no DOM access.
// Exposed on window.Ladder (and module.exports under node for quick checks).
(function (global) {
  const KEY = 'rabbitvscarrot:ladder';
  const START_ELO = 1000;
  const K_FACTOR = 32;
  const MAX_NAME = 16;

  function cleanName(raw, fallback) {
    const name = String(raw == null ? '' : raw).replace(/\s+/g, ' ').trim().slice(0, MAX_NAME);
    return name || fallback;
  }

  function nameKey(name) {
    return name.toLowerCase();
  }

  function newPlayer(name) {
    return { name, elo: START_ELO, wins: 0, losses: 0, draws: 0, streak: 0 };
  }

  function expected(a, b) {
    return 1 / (1 + Math.pow(10, (b - a) / 400));
  }

  // Applies one game to the ladder. `score` is player A's result: 1 win, 0.5 draw, 0 loss.
  // Mutates and returns { a, b } with each player's Elo change. Same-name games are ignored.
  function applyResult(players, nameA, nameB, score) {
    const ka = nameKey(nameA);
    const kb = nameKey(nameB);
    if (ka === kb) return null;
    const a = players[ka] || (players[ka] = newPlayer(nameA));
    const b = players[kb] || (players[kb] = newPlayer(nameB));
    a.name = nameA;
    b.name = nameB;
    const ea = expected(a.elo, b.elo);
    const da = Math.round(K_FACTOR * (score - ea));
    const db = Math.round(K_FACTOR * ((1 - score) - (1 - ea)));
    a.elo += da;
    b.elo += db;
    if (score === 1) { a.wins++; b.losses++; a.streak = Math.max(a.streak, 0) + 1; b.streak = Math.min(b.streak, 0) - 1; }
    else if (score === 0) { b.wins++; a.losses++; b.streak = Math.max(b.streak, 0) + 1; a.streak = Math.min(a.streak, 0) - 1; }
    else { a.draws++; b.draws++; a.streak = 0; b.streak = 0; }
    return { a: da, b: db };
  }

  // Players sorted by Elo (desc), then wins, then name.
  function ranking(players) {
    return Object.keys(players).map((k) => players[k]).sort(
      (x, y) => y.elo - x.elo || y.wins - x.wins || x.name.localeCompare(y.name)
    );
  }

  function load() {
    try {
      const data = JSON.parse(localStorage.getItem(KEY));
      if (data && typeof data.players === 'object' && data.players) {
        return { players: data.players, names: data.names || {} };
      }
    } catch (e) {
      // fall through to empty
    }
    return { players: {}, names: {} };
  }

  function save(data) {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch (e) {
      // storage unavailable; the ladder lasts for this page view only
    }
  }

  const api = {
    START_ELO, K_FACTOR, MAX_NAME, cleanName, expected, applyResult, ranking,
    load, save,
  };
  global.Ladder = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
