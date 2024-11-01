const rooms = {}; // Store room data

module.exports = function(io) {
    io.on('connection', (socket) => {
        console.log(`Player connected: ${socket.id}`, rooms);

        // Handle the joinRoom event
        socket.on('joinRoom', ({ playerName, roomName }) => {
            if (!rooms[roomName]) {
                rooms[roomName] = {}; // Initialize the room if it doesn't exist
            }

            // Add the player to the room
            rooms[roomName][socket.id] = {
                playerName: playerName,
                socketId: socket.id,
                // Additional player-specific data can be added here
            };

            socket.join(roomName);
            console.log(`Player ${playerName} joined room: ${roomName}`);

            // Notify other players in the room of the updated player list
            const players = Object.values(rooms[roomName]).map(player => player.playerName);
            io.to(roomName).emit('updatePlayerList', players);
        });

        // Handle the reconnectPlayer event
        socket.on('reconnectPlayer', ({ playerName, roomName }) => {
            if (rooms[roomName] && rooms[roomName][socket.id]) {
                console.log(`Player ${playerName} already in room ${roomName}, reconnecting...`);
                // Rejoin the room with existing data
                socket.join(roomName);
            } else {
                console.log(`Player ${playerName} not found in room ${roomName}, adding to room...`);
                // If the player wasn't found, they might need to be reassigned
                rooms[roomName] = rooms[roomName] || {};
                rooms[roomName][socket.id] = {
                    playerName: playerName,
                    socketId: socket.id,
                };
                socket.join(roomName);
            }

            // Notify the updated player list
            const players = Object.values(rooms[roomName]).map(player => player.playerName);
            io.to(roomName).emit('updatePlayerList', players);
        });

        // Handle disconnect event
        socket.on('disconnect', () => {
            console.log(`Player disconnected: ${socket.id}`);

            // Find and remove the player from their room
            for (let roomName in rooms) {
                if (rooms[roomName][socket.id]) {
                    const playerName = rooms[roomName][socket.id].playerName;
                    delete rooms[roomName][socket.id];

                    // Notify other players in the room of the updated player list
                    const players = Object.values(rooms[roomName]).map(player => player.playerName);
                    io.to(roomName).emit('updatePlayerList', players);

                    console.log(`Player ${playerName} disconnected from room: ${roomName}`);

                    // Optionally delete the room if it's empty
                    if (Object.keys(rooms[roomName]).length === 0) {
                        delete rooms[roomName];
                        console.log(`Room ${roomName} is now empty and deleted.`);
                    }
                    break;
                }
            }
        });
    });
};
