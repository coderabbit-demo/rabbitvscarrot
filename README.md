# rabbitvscarrot

A tiny browser game of Tic-Tac-Toe where the two players are a rabbit 🐰 and a carrot 🥕.

Play locally in a single browser tab, or start the server and play online against a
friend.

## Play locally

Open `index.html` in any modern browser. No build step, no dependencies.

## Play online

Requires [Node.js](https://nodejs.org/).

```bash
npm install
npm start
```

Then open `http://localhost:8080` in two browsers (or two tabs):

1. On the first, enter a name and click **Create room**. A room code appears.
2. On the second, enter a name, type the room code, and click **Join**.
3. Play as usual. A chat box lets both players talk during the game.

The server keeps each room's board in memory and relays moves and chat between the two
players.

## Rules

- The board is a 3×3 grid.
- Rabbit 🐰 always moves first, then players alternate.
- The first player to line up three of their marks in a row, column, or diagonal wins.
- If the board fills up with no winner, it's a draw.
- Press **Reset** to start a new game.

## Project layout

```
index.html        # markup and entry point
styles.css        # board, lobby and chat styling
src/game.js       # pure game logic (no DOM)
src/ui.js         # local play: DOM rendering and input handling
src/net.js        # client-side WebSocket wrapper
src/online.js     # online play: lobby, board sync and chat
server/index.js   # HTTP + WebSocket server
server/static.js  # static file serving
server/rooms.js   # in-memory room registry
```
