module.exports = (io) => {
  const players = {};  // Store players by room and socket ID

  io.on('connection', (socket) => {
    console.log('Player connected:', socket.id, players);

    // Listen for the 'joinRoom' event
    socket.on('joinRoom', ({ playerName, roomName, socketId }) => {
      if (!roomName || !playerName) return;  // Ensure valid data

      // If the room doesn't exist yet, create it
      if (!players[roomName]) {
        players[roomName] = {};
      }

      // If player reconnected, update their socketId
      if (socketId && players[roomName][socketId]) {
        // Copy player data from the previous socket ID to the new one
        players[roomName][socket.id] = players[roomName][socketId];
        delete players[roomName][socketId];  // Remove the old socket ID
      } else {
        // Add new player to the room
        players[roomName][socket.id] = {
          playerName,
          rotation: 0,
          x: Math.floor(Math.random() * 3000),  // Random starting position
          y: Math.floor(Math.random() * 3000),
          playerId: socket.id,
          health: 100,
        };
      }

      socket.join(roomName);  // Join the socket room

      console.log(`Player ${playerName} joined room: ${roomName}`);
      console.log(`Updated player list for room: ${roomName}`, 
        Object.keys(players[roomName]).map(sid => players[roomName][sid].playerName));

      // Broadcast updated player list to everyone in the room
      io.to(roomName).emit('updatePlayerList', 
        Object.keys(players[roomName]).map(sid => players[roomName][sid].playerName));

    });

    // Handle player disconnect
    socket.on('disconnect', () => {
      console.log('Player disconnected:', socket.id);

      // Find the room the player was in and remove them
      for (const roomName in players) {
        if (players[roomName][socket.id]) {
          delete players[roomName][socket.id];  // Remove player from the room

          // Broadcast the updated player list to the room
          io.to(roomName).emit('updatePlayerList', 
            Object.keys(players[roomName]).map(sid => players[roomName][sid].playerName));
          
          console.log(`Updated player list for room: ${roomName} after disconnect`);
          break;
        }
      }
    });

    // Handle player movement or state updates (example: moving the player)
    socket.on('playerMove', (movementData) => {
      const { roomName, playerId } = movementData;
      
      if (players[roomName] && players[roomName][playerId]) {
        // Update player position or state here
        players[roomName][playerId].x = movementData.x;
        players[roomName][playerId].y = movementData.y;
        players[roomName][playerId].rotation = movementData.rotation;

        // Optionally, broadcast the movement to other players in the room
        socket.to(roomName).emit('playerMoved', players[roomName][playerId]);
      }
    });
  });
};
