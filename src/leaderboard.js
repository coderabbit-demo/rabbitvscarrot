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

  function record(winner) {
    const field = FIELDS[winner] || 'draws';
    scores[field] += 1;
    save(scores);
    render();
  }

  function render() {
    const el = document.getElementById('leaderboard');
    if (!el) return;
    const rows = [
      { label: '🐰 Rabbit', value: scores.rabbit },
      { label: '🥕 Carrot', value: scores.carrot },
    ].sort((a, b) => b.value - a.value);
    const leading = rows[0].value !== rows[1].value;
    el.innerHTML = '';
    rows.forEach((row, i) => {
      const li = document.createElement('li');
      li.innerHTML = '<span></span><strong></strong>';
      li.children[0].textContent = (leading && i === 0 ? '👑 ' : '') + row.label;
      li.children[1].textContent = row.value;
      el.appendChild(li);
    });
    const draws = document.getElementById('draws');
    if (draws) draws.textContent = `Draws: ${scores.draws}`;
  }

  function clear() {
    scores = { ...EMPTY };
    save(scores);
    render();
  }

  window.Leaderboard = { record, render, clear };
})();
