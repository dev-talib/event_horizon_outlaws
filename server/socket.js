module.exports = function(io) {
    // A simple store for lobbies, now tracking players by their socket IDs
    let lobbies = {};

    // Utility to generate a random lobby code
    function generateLobbyCode() {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    }

    io.on('connection', (socket) => {
        console.log('A user connected:', socket.id);

        // Event: Player joins a lobby
        socket.on('joinLobby', ({ username, lobbyCode }) => {
            console.log("EVENT JOIN LOBBY");
            let lobby;

            // If a lobby code is provided, join that lobby; otherwise, create a new one
            if (lobbyCode && lobbies[lobbyCode]) {
                lobby = lobbies[lobbyCode];
            } else {
                // Create a new lobby if no code is provided
                if (!lobbyCode) {
                    lobbyCode = generateLobbyCode();
                }
                lobby = { code: lobbyCode, players: [], state: 'lobby' };
                lobbies[lobbyCode] = lobby;
            }

            // Ensure no duplicate players in the same lobby
            if (lobby.players.some(player => player.username === username)) {
                socket.emit('lobbyJoined', { success: false, message: 'Username already taken in this lobby.' });
                return;
            }

            // Add the player to the lobby, tracking their socketId, username, and lobbyCode
            lobby.players.push({ username, socketId: socket.id });

            // Add the player to the room (lobbyCode)
            socket.join(lobbyCode);

            // Emit a success response to the player who joined
            io.to(socket.id).emit('lobbyJoined', { success: true, lobbyCode });

            // Notify all players in the lobby about the updated player list
            console.log("lobbyCode", lobbyCode)
            io.to(lobbyCode).emit('lobbyUpdate', lobby.players); // This sends to all in the lobby, including the sender

            // Print the current lobby state for debugging
            console.log("***lobby details***", lobbies);

            // Listen for startGame event
            socket.on('startGame', () => {
                if (lobby.players.length > 1) {
                    // Emit a game start message to players in the lobby
                    io.to(lobbyCode).emit('gameStart', { message: 'Game is starting!' });
                } else {
                    io.to(socket.id).emit('gameStartError', { message: 'Not enough players to start the game.' });
                }
            });

            // Handle player disconnection
            socket.on('disconnect', () => {
                console.log('A user disconnected:', socket.id);
                // Remove player from the lobby
                lobby.players = lobby.players.filter(player => player.socketId !== socket.id);

                // If no players remain in the lobby, delete the lobby
                if (lobby.players.length === 0) {
                    delete lobbies[lobbyCode];
                } else {
                    // Emit updated player list to remaining players in the lobby
                    io.to(lobbyCode).emit('lobbyUpdate', lobby.players);
                }
            });
        });

        // Event: Load lobby details (based on socket.id)
        socket.on('loadLobbyDetails', () => {
            let playerLobby = null;
            let playerUsername = null;

            for (let lobbyCode in lobbies) {
                let lobby = lobbies[lobbyCode];
                let player = lobby.players.find(p => p.socketId === socket.id);
                if (player) {
                    playerUsername = player.username;
                    playerLobby = lobbyCode;
                    break;
                }
            }

            if (playerUsername && playerLobby) {
                io.to(socket.id).emit('lobbyDetails', { success: true, lobbyCode: playerLobby, username: playerUsername });
                // Notify all players in the lobby about the updated player list
                io.to(playerLobby).emit('lobbyUpdate', lobbies[playerLobby].players);
            } else {
                io.to(socket.id).emit('gameStartError', { message: 'Player not found in any lobby.' });
            }
        });
    });
};
