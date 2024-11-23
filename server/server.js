const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const bodyParser = require('body-parser');
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public'));

app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'views', 'index.html'));
});

// app.get('/game', (req, res) => {
//   res.sendFile(path.join(__dirname, '..', 'public', 'view', 'game.html'));
// });

server.listen(5000, () => {
  console.log('Server listening on port 5000');
});

require('./socket')(io);
