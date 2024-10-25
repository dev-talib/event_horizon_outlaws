module.exports = function(io) {
    let rooms = {};
  
    io.on('connection', (socket) => {
      console.log(`Player connected: ${socket.id}`);
  
      socket.on('joinRoom', ({ playerName, roomName }) => {
        socket.join(roomName);
        
        if (!rooms[roomName]) {
          rooms[roomName] = {};
        }

        // Ensure the initial position is within the bounds of the map
        const initialX = Math.floor(Math.random() * 3200); // Adjust based on map size
        const initialY = Math.floor(Math.random() * 3200); // Adjust based on map size

  
        rooms[roomName][socket.id] = {
          playerName,
          rotation: 0,
          x: initialX,
          y: initialY,
          playerId: socket.id,
          health: 100
        };
  
        socket.emit('currentPlayers', rooms[roomName]);
        socket.to(roomName).emit('newPlayer', rooms[roomName][socket.id]);
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
        console.log("bullet details=======>>", roomName,bulletData)  
        if (rooms[roomName] && rooms[roomName][socket.id]) {
          console.log("bullet details=======>>", roomName,bulletData)  
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
  
      socket.on('disconnect-player', () => {
        console.log(`Player disconnected: ${socket.id}`);
        for (const roomName in rooms) {
          if (rooms[roomName][socket.id]) {
            delete rooms[roomName][socket.id];
            socket.to(roomName).emit('disconnect', socket.id);
          }
        }
      });
    });
  };
  