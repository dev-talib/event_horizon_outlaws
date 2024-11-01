const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session'); // Import session middleware
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Use express-session middleware
app.use(session({
  secret: 'yourSecretKey', // Replace with your own secret
  resave: false,
  saveUninitialized: true,
}));

// Serve static files from the public directory
app.use(express.static('public'));

// Parse URL-encoded data (for form submission)
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Route for serving the index page (main entry point)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Route for serving staging page
app.get('/staging', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'staging.html'));
});

app.post('/join-room', (req, res) => {
  const { playerName, roomName } = req.body;
  if (playerName && roomName) {
    // Store player name and room name in session
    req.session.playerName = playerName;
    req.session.roomName = roomName;

    // Send JSON response instead of redirection
    res.json({
      redirectUrl: "/lobby.html", 
      playerName: req.session.playerName, 
      roomName: req.session.roomName 
    });
  } else {
    // Redirect back to the staging page if missing data
    // res.redirect('/staging.html');
  }
});

app.get('/playerInfo', (req, res) => {
  const { playerName, roomName } = req.session; // Access session data
  if (playerName && roomName) {
    // Send JSON response with player and room info
    res.json({
      redirectUrl: "/game.html", 
      playerName: playerName,  // Use session playerName
      roomName: roomName       // Use session roomName
    });
  } else {
    res.redirect('/staging.html');
  }
});

// Route for serving the lobby page and accessing session data
app.get('/lobby', (req, res) => {
  if (req.session.playerName && req.session.roomName) {
    // Serve the lobby page
    res.sendFile(path.join(__dirname, 'public', 'lobby.html'));
  } else {
    // Redirect to staging if session data is missing
    res.redirect('/staging.html');
  }
});

// Route for serving the game page
app.get('/game.html', (req, res) => {
  if (req.session.playerName && req.session.roomName) {
    res.sendFile(path.join(__dirname, 'public', 'game.html'));
  } else {
    res.redirect('/staging');
  }
});

// Start the server
server.listen(3000, () => {
  console.log('Server listening on port 3000');
});

// Import and use socket events
require('./socket')(io);
