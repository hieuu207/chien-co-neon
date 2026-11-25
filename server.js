const os = require('os');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'leaderboard.json');
const HTML_FILE = path.join(__dirname, 'public', 'index.html');

function readBoard() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    }
  } catch (e) {}
  return [
    { name: 'Thiên Lang [Bot]', score: 4800, mode: 'Sinh tồn', wave: 'Đợt 6' },
    { name: 'Bão Tố [Bot]', score: 3100, mode: 'Chiến Dịch', wave: 'Màn 4' }
  ];
}

function writeBoard(board) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(board, null, 2), 'utf8');
}

const server = http.createServer((req, res) => {
  if (req.url === '/api/leaderboard' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ leaderboard: readBoard() }));
    return;
  }

  if (req.url === '/api/leaderboard' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => { body += chunk; if (body.length > 1e5) req.destroy(); });
    req.on('end', () => {
      try {
        const entry = JSON.parse(body);
        if (entry && entry.name && typeof entry.score === 'number' && entry.score > 0) {
          const board = readBoard();
          const idx = board.findIndex((r) => r.name === entry.name && r.mode === entry.mode);
          if (idx !== -1) {
            if (entry.score > board[idx].score) board[idx] = entry;
          } else {
            board.push(entry);
          }
          board.sort((a, b) => b.score - a.score);
          const top = board.slice(0, 30);
          writeBoard(top);
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ leaderboard: top }));
          return;
        }
      } catch (e) {}
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid entry' }));
    });
    return;
  }

  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  fs.createReadStream(HTML_FILE).pipe(res);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Chien Co Neon Server dang chay tren May Tinh: http://localhost:${PORT}`);
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        console.log(`Mo tren Dien Thoai (cung Wi-Fi) tai: http://${net.address}:${PORT}`);
      }
    }
  }
});
