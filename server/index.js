const http = require('http');
const { serveStatic } = require('./static');

const PORT = process.env.PORT || 8080;

const server = http.createServer((req, res) => {
  serveStatic(req, res);
});

server.listen(PORT, () => {
  console.log(`rabbitvscarrot listening on http://localhost:${PORT}`);
});
