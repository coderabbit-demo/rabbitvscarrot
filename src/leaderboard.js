(function () {
  const KEY = 'rabbitvscarrot:leaderboard';
  const FIELDS = { R: 'rabbit', C: 'carrot' };
  const EMPTY = { rabbit: 0, carrot: 0, draws: 0 };

  function load() {
    try {
      return { ...EMPTY, ...JSON.parse(localStorage.getItem(KEY)) };
    } catch (e) {
      return { ...EMPTY };
    }
  }

  function save(scores) {
    try {
      localStorage.setItem(KEY, JSON.stringify(scores));
    } catch (e) {
      // storage unavailable; scores last for this page view only
    }
  }

  let scores = load();

  // `names` is optional: { R: 'Alice', C: 'Bob', bot: false } to also update the ranked ladder.
  let ladder = window.Ladder.load();

  function record(winner, names) {
    const field = FIELDS[winner] || 'draws';
    scores[field] += 1;
    save(scores);
    if (names) {
      const score = winner === 'R' ? 1 : winner === 'C' ? 0 : 0.5;
      const result = window.Ladder.applyResult(ladder.players, names.R, names.C, score);
      // Remember only what a human typed; a bot identity must not overwrite the saved carrot name.
      ladder.names = { R: names.R, C: names.bot ? ladder.names.C : names.C };
      window.Ladder.save(ladder);
      lastChange = result ? { R: result.a, C: result.b, names } : null;
    }
    render();
  }

  let lastChange = null;

  function render() {
    const el = document.getElementById('leaderboard');
    if (!el) return;
    el.innerHTML = '';
    const ranked = window.Ladder.ranking(ladder.players);
    if (!ranked.length) {
      const li = document.createElement('li');
      li.className = 'empty';
      li.textContent = 'No ranked games yet. Finish a game to join the ladder.';
      el.appendChild(li);
    }
    ranked.forEach((p, i) => {
      const li = document.createElement('li');
      li.innerHTML = '<span class="rank"></span><span class="who"></span><span class="rec"></span><strong></strong>';
      li.children[0].textContent = i === 0 ? '👑' : `${i + 1}.`;
      li.children[1].textContent = p.name;
      li.children[2].textContent = `${p.wins}W ${p.losses}L ${p.draws}D`;
      li.children[3].textContent = p.elo;
      el.appendChild(li);
    });
    const draws = document.getElementById('draws');
    if (draws) {
      let text = `🐰 ${scores.rabbit} · 🥕 ${scores.carrot} · Draws: ${scores.draws}`;
      if (lastChange) {
        const fmt = (d) => (d > 0 ? `+${d}` : String(d));
        text += ` · Last game: ${lastChange.names.R} ${fmt(lastChange.R)}, ${lastChange.names.C} ${fmt(lastChange.C)}`;
      }
      draws.textContent = text;
    }
  }

  function clear() {
    scores = { ...EMPTY };
    ladder = { players: {}, names: ladder.names };
    lastChange = null;
    save(scores);
    window.Ladder.save(ladder);
    render();
  }

  window.Leaderboard = { record, render, clear, savedNames: () => ladder.names };
})();
