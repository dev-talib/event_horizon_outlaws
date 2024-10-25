const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const bodyParser = require('body-parser');
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files from the public directory
app.use(express.static('public'));

// Parse URL-encoded data (for form submission)
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Route for serving lobby page
app.get('/lobby', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'lobby.html'));
});

// Handle form submission and redirect to the game
app.post('/join-room', (req, res) => {
  const { playerName, roomName } = req.body;
  console.log(req.body);
  if (playerName && roomName) {
    // Redirect to game.html with query parameters
    res.redirect(`/game.html?room=${encodeURIComponent(roomName)}&player=${encodeURIComponent(playerName)}`);
  } else {
    // If missing data, redirect back to lobby with error (optional)
    res.redirect('/lobby');
  }
});

// Route for serving the game page
app.get('/game.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'game.html'));
});

// Start the server
server.listen(3000, () => {
  console.log('Server listening on port 3000');
});

// Import and use socket events
require('./socket')(io);
