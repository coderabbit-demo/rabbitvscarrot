# rabbitvscarrot

A tiny browser game of Tic-Tac-Toe where the two players are a rabbit 🐰 and a carrot 🥕.

No build step, no dependencies. Just open the page and play.

## Play

Open `index.html` in any modern browser.

## Rules

- The board is a 3×3 grid.
- Rabbit 🐰 always moves first, then players alternate.
- The first player to line up three of their marks in a row, column, or diagonal wins.
- If the board fills up with no winner, it's a draw.
- Press **Reset** to start a new game.

## Daily challenge

Switch to **Daily challenge** for a new puzzle every day (the same one all day, reset at local midnight):

- The board starts part-filled and it's the rabbit's move. Win within **2 of your moves**; the carrot replies automatically.
- Solving the day's challenge extends your 🔥 **streak**. Retry as often as you like.
- Miss a day and the streak resets, unless you have a ❄️ **streak freeze**. You start with one, earn another every 7 days of streak, and can hold two.
- Challenge games don't count towards the Rabbit vs Carrot leaderboard.

## Project layout

```
index.html    # markup and entry point
styles.css    # board styling
src/game.js   # pure game logic (no DOM)
src/leaderboard.js # rabbit vs carrot win tally (localStorage)
src/daily.js  # seeded daily puzzle and streak logic (no DOM)
src/ui.js     # DOM rendering and input handling
```
