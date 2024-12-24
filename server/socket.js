module.exports = function(io) {
    let lobbies = {};

    function generateLobbyCode() {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    }

    io.on('connection', (socket) => {
        console.log('A user connected:', socket.id);
        if (!socket.request.session) {
            console.log('Session not available');
            return;
        }

        // Event: Player joins a lobby
        socket.on('joinLobby', ({ username, lobbyCode }) => {
            console.log("EVENT JOIN LOBBY");

            if (!socket.request.session) {
                console.log('Session not available during joinLobby');
                return;
            }
           

            let lobby;

            // If a lobby code is provided, join that lobby; otherwise, create a new one
            if (lobbyCode && lobbies[lobbyCode]) {
                lobby = lobbies[lobbyCode];
            } else {
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

            // Add the player to the lobby
            lobby.players.push({ username, socketId: socket.id });

            // Save the player state on the server (username and their current lobby)
            socket.join(lobbyCode);

            console.log("*** going to store data in session ****",username, lobbyCode)
            // Save the username and lobbyCode in the session
            socket.request.session.username = username;
            socket.request.session.lobbyCode = lobbyCode; // Ensure lobbyCode is correctly set
            socket.request.session.save(); // Save session changes

            // Emit success to the player who joined
            io.to(socket.id).emit('lobbyJoined', { success: true, lobbyCode });

            // Notify all players in the lobby about the updated player list
            io.to(lobbyCode).emit('lobbyUpdate', lobby.players);

                    // Listen for startGame event
                    socket.on('startGame', () => {
                        if (lobby.players.length > 1) {
                            io.to(lobbyCode).emit('gameStart', { message: 'Game is starting!' });
                        } else {
                            io.to(socket.id).emit('gameStartError', { message: 'Not enough players to start the game.' });
                        }
                    });

            // Handle player disconnection
            socket.on('disconnect', () => {
                console.log('A user disconnected:', socket.id);
                let player = lobby.players.find(player => player.socketId === socket.id);
                if (player) {
                    lobby.players = lobby.players.filter(player => player.socketId !== socket.id);
                    if (lobby.players.length === 0) {
                        delete lobbies[lobbyCode];
                    } else {
                        io.to(lobbyCode).emit('lobbyUpdate', lobby.players);
                    }
                }
            });
        });

        socket.on('loadLobbyDetails', () => {
            const { lobbyCode, username } = socket.request.session;
            // Check if the user has a valid session with a lobby code
            if (lobbyCode && lobbies[lobbyCode]) {
                const lobby = lobbies[lobbyCode];
        
                // Log the structure of the players array
                console.log("Lobby players: ", lobby.players);
        
                // Normalize username to avoid case or space mismatches
                const normalizedUsername = username.trim().toLowerCase();
                
                // Find the player in the lobby by normalized username
                const player = lobby.players.find(player => {
                    const normalizedPlayerUsername = player.username.trim().toLowerCase();
                    console.log(`Comparing: ${normalizedPlayerUsername} === ${normalizedUsername}`);
                    return normalizedPlayerUsername === normalizedUsername;
                });
        
                if (player) {
                    console.log("***inside method loadLobbyDetails *** player found: ", lobbyCode, username);
                    // Emit the current lobby details (lobby code, player info)
                    io.to(socket.id).emit('lobbyDetails', {
                        success: true,
                        lobbyCode,
                        username,
                        players: lobby.players
                    });
                } else {
                    // Player not found in the session's lobby, handle it
                    io.to(socket.id).emit('lobbyDetails', {
                        success: false,
                        message: 'Player not found in the lobby.'
                    });
                }
            } else {
                // No valid lobby, or no session information
                io.to(socket.id).emit('lobbyDetails', {
                    success: false,
                    message: 'No lobby found or user not connected to any lobby.'
                });
            }
        });
        

        socket.on('reconnect', () => {
            const { lobbyCode, username } = socket.request.session;
            console.log("reconnecting....", lobbyCode, username);
            if (lobbyCode && lobbies[lobbyCode]) {
                const lobby = lobbies[lobbyCode];
                const player = lobby.players.find(player => player.username === username);
                if (player) {
                    // Emit the current lobby details to the reconnected player
                    io.to(socket.id).emit('lobbyDetails', {
                        success: true,
                        lobbyCode,
                        username,
                        players: lobby.players
                    });
                } else {
                    io.to(socket.id).emit('lobbyDetails', {
                        success: false,
                        message: 'Player not found in the lobby.'
                    });
                }
            } else {
                io.to(socket.id).emit('lobbyDetails', {
                    success: false,
                    message: 'No lobby found or user not connected to any lobby.'
                });
            }
        });

    });
};
