const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const session = require('express-session');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Configure express-session middleware
app.use(session({
    secret: 'your-secret-key',  // Use a secret key for signing the session ID cookie
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: false  // Set to `true` if using HTTPS, otherwise `false`
    }
}));

// Serve static files
app.use(express.static('public'));

// Handle the app route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'views', 'index.html'));
});

// Use the session middleware with socket.io
io.use((socket, next) => {
    session({
        secret: 'your-secret-key',  // Use the same secret key for Socket.IO
        resave: false,
        saveUninitialized: true,
        cookie: { secure: false }  // Ensure this is `false` for development (non-HTTPS)
    })(socket.request, socket.request.res || {}, next);
});

// Start the server
server.listen(5000, () => {
    console.log('Server listening on port 5000');
});

// Import and initialize the socket functionality
require('./socket')(io);
