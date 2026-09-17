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

## Project layout

```
index.html    # markup and entry point
styles.css    # board styling
src/game.js   # pure game logic (no DOM)
src/ui.js     # DOM rendering and input handling
```
