let rooms = {};
module.exports = function(io) {
  // let rooms = {};

  // Middleware to handle socket reconnection and reassignment
  // io.use((socket, next) => {
  //     const { playerName, roomName } = socket.handshake.query;

  //     // If playerName and roomName exist, check if the player is already in a room
  //     if (playerName && roomName) {
  //         for (const room in rooms) {
  //             for (const id in rooms[room]) {
  //                 if (rooms[room][id].playerName === playerName && room === roomName) {
  //                     // Reassign new socket ID to the existing player
  //                     rooms[roomName][socket.id] = { ...rooms[room][id], playerId: socket.id };
  //                     delete rooms[roomName][id]; // Remove the old socket ID entry
  //                     console.log(`Reassigned socket ID for player: ${playerName} in room: ${roomName}`);
  //                     logTotalPlayers(); // Log total players after reassignment
  //                     return next(); // Continue with the connection
  //                 }
  //             }
  //         }
  //     }
  //     next(); // If player not found, continue as normal
  // });

  io.on('connection', (socket) => {
      console.log(`Player connected: ${socket.id}`, rooms);
      socket.on('checkPlayer', ({ playerName }) => {
        // Reassign the new socket ID if the player already exists
        for (const roomName in rooms) {
            for (const playerId in rooms[roomName]) {
                if (rooms[roomName][playerId].playerName === playerName) {
                    rooms[roomName][socket.id] = rooms[roomName][playerId];
                    delete rooms[roomName][playerId];  // Remove old socket ID
                    socket.join(roomName);
                    console.log(`Reassigned ${playerName} to new socket: ${socket.id}`);

                    // Emit updated player list and player info
                    updatePlayerList(roomName);
                    socket.emit('currentPlayers', rooms[roomName]);
                    return;
                }
            }
        }
      });
      // const { playerName, roomName } = socket.handshake.query;

      // console.log(`Player connected: ${socket.id} | Player: ${playerName} | Room: ${roomName}`);
      // console.log('Current Rooms:', rooms);

      // socket.on('joinRoom', ({ playerName, roomName }) => {
      //     socket.join(roomName);
          
      //     // if (!rooms[roomName]) {
      //     //     rooms[roomName] = {};
      //     // }

      //     // Ensure the initial position is within the bounds of the map
      //     const initialX = Math.floor(Math.random() * 3200); // Adjust based on map size
      //     const initialY = Math.floor(Math.random() * 3200); // Adjust based on map size

      //     rooms[roomName][socket.id] = {
      //         playerName,
      //         rotation: 0,
      //         x: initialX,
      //         y: initialY,
      //         playerId: socket.id,
      //         health: 100
      //     };

      //     console.log(`Player ${playerName} joined room: ${roomName}`);
      //     logTotalPlayers(); // Log total players after a player joins

      //     console.log('Updated Room State:', rooms);

      //     // Emit the updated player list to all players in the room
      //     updatePlayerList(roomName);

      //     socket.emit('currentPlayers', rooms[roomName]);
      //     socket.to(roomName).emit('newPlayer', rooms[roomName][socket.id]);
      // });
      socket.on('joinRoom', ({ playerName, roomName }) => {
        socket.join(roomName);
        if (!rooms[roomName]) rooms[roomName] = {};

        const initialX = Math.floor(Math.random() * 3200); 
        const initialY = Math.floor(Math.random() * 3200); 

        rooms[roomName][socket.id] = {
            playerName,
            rotation: 0,
            x: initialX,
            y: initialY,
            playerId: socket.id,
            health: 100
        };

        console.log(`Player ${playerName} joined room: ${roomName}`);
        updatePlayerList(roomName);
        // socket.emit('currentPlayers', rooms[roomName]);
        // socket.to(roomName).emit('newPlayer', rooms[roomName][socket.id]);
    });

      socket.on('playerMovement', ({ roomName, x, y, rotation }) => {
          if (rooms[roomName] && rooms[roomName][socket.id]) {
              const player = rooms[roomName][socket.id];
              player.x = x;
              player.y = y;
              player.rotation = rotation;
              socket.to(roomName).emit('playerMoved', player);
              console.log('Player movement broadcasted:', player);
          }
      });

      socket.on('shootBullet', ({ roomName, bulletData }) => {
          console.log("Bullet details:", roomName, bulletData);
          if (rooms[roomName] && rooms[roomName][socket.id]) {
              socket.to(roomName).emit('newBullet', bulletData);
          }
      });

      socket.on('playerHit', ({ roomName, playerId }) => {
          if (rooms[roomName] && rooms[roomName][playerId]) {
              const player = rooms[roomName][playerId];
              player.health -= 10; // Reduce player health
              console.log(`Player ${playerId} hit. Health: ${player.health}`);
              if (player.health <= 0) {
                  delete rooms[roomName][playerId];
                  io.in(roomName).emit('playerDied', playerId);
              } else {
                  io.in(roomName).emit('updateHealth', { playerId, health: player.health });
              }
          }
      });

      socket.on('disconnect', () => {
          console.log(`Player disconnected: ${socket.id}`, rooms);
          // for (const roomName in rooms) {
          //     if (rooms[roomName][socket.id]) {
          //         delete rooms[roomName][socket.id];
          //         // socket.to(roomName).emit('disconnect', socket.id);
          //         updatePlayerList(roomName); // Emit updated player list after a player disconnects
          //         logTotalPlayers(); // Log total players after a player disconnects
          //     }
          // }
      });
  });

  // Function to update player list and emit to all players in the room
  function updatePlayerList(roomName) {
      const players = Object.values(rooms[roomName]).map(player => player.playerName);
      io.in(roomName).emit('updatePlayerList', players);
      console.log(`Updated player list for room: ${roomName}`, players);
  }

  // Function to log the total number of players and detailed room/player info
  function logTotalPlayers() {
      let totalPlayers = 0;
      for (const roomName in rooms) {
          const playersInRoom = Object.keys(rooms[roomName]).length;
          totalPlayers += playersInRoom;
          console.log(`Room: ${roomName}, Players: ${playersInRoom}`, rooms[roomName]);
      }
      console.log(`Total number of players: ${totalPlayers}`);
  }
};
