module.exports = function(io) {
    let lobbies = {};

    function generateLobbyCode() {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    }

    io.on('connection', (socket) => {
        if (!socket.request.session) {
            console.log('Session not available');
            return;
        }

        // Event: Player joins a lobby
        socket.on('joinLobby', ({ username, lobbyCode }) => {

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
                lobby = { code: lobbyCode, players: [], state: 'lobby', host: null,  playerCount: 0 };
                lobbies[lobbyCode] = lobby;
            }

            // Ensure no duplicate players in the same lobby
            if (lobby.players.some(player => player.username === username)) {
                socket.emit('lobbyJoined', { success: false, message: 'Username already taken in this lobby.' });
                return;
            }

            // Add the player to the lobby
            lobby.players.push({ username, socketId: socket.id });
            lobby.playerCount += 1; // Increase the player count
           
            // Assign the first player to join as the host
            if (!lobby.host) {
                lobby.host = socket.id;
            }
            // Save the player state on the server (username and their current lobby)
            socket.join(lobbyCode);

            // Save the username and lobbyCode in the session
            socket.request.session.username = username;
            socket.request.session.lobbyCode = lobbyCode; // Ensure lobbyCode is correctly set
            socket.request.session.save(); // Save session changes

            // Emit success to the player who joined
            io.to(socket.id).emit('lobbyJoined', { success: true, lobbyCode });

            // Notify all players in the lobby about the updated player list
            io.to(lobbyCode).emit('lobbyUpdate', lobby.players);

            // Check if there are more than 2 players in the lobby and start the game
            if (lobby.players.length > 1) {
              // Emit a 'startGame' event to all players in the lobby
              setTimeout(() => {
                io.to(lobbyCode).emit('startGame', { message: 'Game is starting!' });
                // change the state of the lobby to 'game' 
                lobby.state = 'game';
                io.to(lobbyCode).emit('lobbyUpdate', lobby.players);
              }, 2000);
             
            }

             // Handle player disconnection
             socket.on('disconnect', () => {
                console.log('A user disconnected:', socket.id);
                let lobbyCode = socket.request.session.lobbyCode;
                let lobby = lobbies[lobbyCode];
                if (!lobby) {
                    return;
                }
            
                // Find disconnected player
                let player = lobby.players.find(player => player.socketId === socket.id);
                if (player) {
                    lobby.players = lobby.players.filter(player => player.socketId !== socket.id);
                    lobby.playerCount -= 1; 
            
                    if (lobby.host === socket.id) {
                        if (lobby.players.length > 0) {
                            lobby.host = lobby.players[0].socketId; 
                        } else {
                            delete lobby.host; 
                        }
                    }
            
                    io.to(lobbyCode).emit('lobbyUpdate', lobby.players);
                    if (lobby.players.length === 0) {
                        delete lobbies[lobbyCode];
                        console.log(`Lobby ${lobbyCode} deleted as no players remain.`);
                    } else {
                        io.to(lobbyCode).emit('playerDisconnected', { username: player.username });
                    }
                }
             });
        });

        socket.on('loadLobbyDetails', () => {
            const { lobbyCode, username } = socket.request.session;
            // Check if the user has a valid session with a lobby code
            if (lobbyCode && lobbies[lobbyCode]) {
                const lobby = lobbies[lobbyCode];
                // Normalize username to avoid case or space mismatches
                const normalizedUsername = username.trim().toLowerCase();
                
                // Find the player in the lobby by normalized username
                const player = lobby.players.find(player => {
                    const normalizedPlayerUsername = player.username.trim().toLowerCase();
                    return normalizedPlayerUsername === normalizedUsername;
                });
        
                if (player) {
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
        

        socket.on('spawnPlayer', ({ playerName, roomName }) => {
            socket.join(roomName);
            if (!lobbies[roomName]) {
                lobbies[roomName] = {};
            }
        
            // Ensure the initial position is within the bounds of the map
            const initialX = Math.floor(Math.random() * 3200); // Adjust based on map size
            const initialY = Math.floor(Math.random() * 3200); // Adjust based on map size
        
            lobbies[roomName][socket.id] = {
                playerName,
                rotation: 0,
                x: initialX,
                y: initialY,
                playerId: socket.id,
                health: 200
            };
        
            socket.emit('loadCurrentPlayers', lobbies[roomName]);
            socket.to(roomName).emit('spawnNewPlayerInstance', lobbies[roomName][socket.id]);
        });

        
        socket.on('playerMovement', ({ roomName, x, y, rotation }) => {
            if (lobbies[roomName] && lobbies[roomName][socket.id]) {
              const player = lobbies[roomName][socket.id];
              player.x = x;
              player.y = y;
              player.rotation = rotation;
              socket.to(roomName).emit('syncPlayerMovement', player);
            }
        });

        
        socket.on('fireBullet', (data) => {
          if (data.roomCode) {
              io.in(data.roomCode).emit('bulletFired', data);
          }
        });

        socket.on('playerHit', ({ roomCode, playerId, bulletId }) => {
            if (lobbies[roomCode] && lobbies[roomCode][playerId]) {
              const player = lobbies[roomCode][playerId];
              player.health -= 10; // Reduce player health
              if (player.health <= 0 && lobbies[roomCode].playerCount  > 0) {
                lobbies[roomCode].playerCount -= 1;
                // delete rooms[roomName][playerId];
                io.in(roomCode).emit('playerDied', {player, playerCount: lobbies[roomCode].playerCount});

                // Check if there's only one player left alive
                if (lobbies[roomCode].playerCount === 1) {
                    checkWinner(roomCode)
                }

              } else {
                io.in(roomCode).emit('playerHitUpdate', { playerId, health: player.health, bulletId, playerName: player });
              }
            }
        });

        socket.on('generateAsteroids', ({asteroidData, roomCode}) => {
            const lobby = lobbies[roomCode];
            const hostPlayer = lobby?.host? lobby.host: null;
            if (roomCode && asteroidData && hostPlayer === socket.id) {
                setTimeout(()=>{
                    io.in(roomCode).emit('spawnAsteroids', asteroidData);
                },3000)
            }
        });

        socket.on('changePlayerHealth', ({ roomCode, playerId, health}) => {
            if (lobbies[roomCode] && lobbies[roomCode][playerId]) {
              const player = lobbies[roomCode][playerId];  
              if (player.health <= 0 && lobbies[roomCode].playerCount  > 0) {
                 lobbies[roomCode].playerCount -= 1;
                 io.in(roomCode).emit('playerDied', {player, playerCount: lobbies[roomCode].playerCount });
              }
              
              // Check if there's only one player left alive
              if (lobbies[roomCode].playerCount === 1) {
                checkWinner(roomCode)
              }

              player.health = health; 
              io.in(roomCode).emit('playerHealthChanged', { playerId, health: player.health, playerName: player });
            }
        });

        function checkWinner(lobbyCode) {
            const lobby = lobbies[lobbyCode];
            if (!lobby || !lobby.players) {
                console.log("Lobby not found or no players in the lobby.");
                return;
            }
            // Find the remaining player with health > 0
            const remainingPlayer = Object.values(lobby.players)
                .map(player => lobby[player.socketId]) 
                .find(player => player && player.health > 0);

            if (remainingPlayer) {
                io.in(lobbyCode).emit('declareWinner', { player: remainingPlayer });
            } else {
                console.log("No remaining player with health > 0.");
            }
        }

    });

};
