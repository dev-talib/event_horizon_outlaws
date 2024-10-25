function addBullet(self, bulletData) {
    var bullet = bullets.get();
    if (!bullet) {
    //   bullet = bullets.create(bulletData.x, bulletData.y, 'bullet')
      bullet = self.physics.add.image(bulletData.x, bulletData.y, 'bullet')
        .setOrigin(0.5, 0.5)
        .setDisplaySize(5, 5);
      bullet.body.allowGravity = false; // Ensure no gravity
    } else {
      bullet.setPosition(bulletData.x, bulletData.y);
      bullet.setActive(true);
      bullet.setVisible(true);
      bullet.body.enable = true; // Enable the body
    }
    bullet.setRotation(bulletData.rotation);
    bullet.setScale(0.02); // Ensure consistent scaling
    bullet.ownerId = bulletData.ownerId; // Set ownerId
    self.physics.velocityFromRotation(bulletData.rotation, 500, bullet.body.velocity);
  }
  
  function bulletHitPlayer(bullet, player) {
    // Ensure bullets don't affect the player who fired them
    if (bullet.ownerId !== player.playerId && bullet.active && player.active) {
      bullet.destroy(); // Destroy bullet on hit
      const urlParams = new URLSearchParams(window.location.search);
      const roomName = urlParams.get('room');
      socket.emit('playerHit', { roomName, playerId: player.playerId }); // Emit hit event with room info
    }
  }
  

  function handleShooting(scene){
    // Handle shooting
    if (Phaser.Input.Keyboard.JustDown(fireKey)) {
      var bullet = bullets.get();
      if (bullet) {
        bullet.setActive(true);
        bullet.setVisible(true);
        bullet.setPosition(player.x, player.y);
        bullet.setRotation(player.rotation);
        bullet.setScale(0.02);
        bullet.ownerId = socket.id; // Set ownerId
        bullet.body.enable = true; // Enable the body
        scene.physics.velocityFromRotation(player.rotation, 500, bullet.body.velocity);
        bullet.setCollideWorldBounds(true);
        
        const urlParams = new URLSearchParams(window.location.search);
        const roomName = urlParams.get('room');
        
        socket.emit('shootBullet', { roomName, bulletData: { x: player.x, y: player.y, rotation: player.rotation, ownerId: socket.id } });
        console.log('Bullet shot emitted:', { roomName, bulletData: { x: player.x, y: player.y, rotation: player.rotation, ownerId: socket.id } });
      }

    }
  }
  