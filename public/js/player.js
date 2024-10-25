function addPlayer(scene, playerInfo) {
  let player = scene.physics.add.image(playerInfo.x, playerInfo.y, 'ship')
  .setOrigin(0.5, 0.5)
  .setDisplaySize(53, 40);

    player.setDrag(50);
    player.setAngularDrag(90);
    player.setMaxVelocity(500);
    player.health = playerInfo.health;
    player.setCollideWorldBounds(true);

    // Make sure the camera follows the player
    scene.cameras.main.startFollow(player);
    
  
    return player;
  }
  
  function addOtherPlayers(scene, playerInfo) {
    const otherPlayer = scene.physics.add.sprite(playerInfo.x, playerInfo.y, 'ship')
      .setOrigin(0.5, 0.5)
      .setDisplaySize(53, 40);
    
    otherPlayer.playerId = playerInfo.playerId;
    otherPlayer.health = playerInfo.health;
    otherPlayer.setCollideWorldBounds(true);
  
    otherPlayers.add(otherPlayer);
  }
  

  function handlePlayerMovement(scene,roomName){
    if(player){
      // Handle player movement
      if (cursors.left.isDown) {
        player.setAngularVelocity(-150);
      } else if (cursors.right.isDown) {
        player.setAngularVelocity(150);
      } else {
        player.setAngularVelocity(0);
      }

      if (cursors.up.isDown) {
        scene.physics.velocityFromRotation(player.rotation, 200, player.body.acceleration);
      } else {
        player.setAcceleration(0);
      }

      // Emit player movement
      var x = player.x;
      var y = player.y;
      var r = player.rotation;
      if (player.oldPosition && (x !== player.oldPosition.x || y !== player.oldPosition.y || r !== player.oldPosition.rotation)) {
        socket.emit('playerMovement', { roomName, x: player.x, y: player.y, rotation: player.rotation });
      }

      // Store old position data
      player.oldPosition = {
        x: player.x,
        y: player.y,
        rotation: player.rotation
      };

    }
  }

  function checkPlayerInsideZone(delta){
    var distanceToCenter = Phaser.Math.Distance.Between(player.x, player.y, zoneCenter.x, zoneCenter.y);
    if (distanceToCenter > initialRadius) {
      // Player is outside the zone, reduce health
      player.health -= 5 * delta / 1000; // Damage over time
      healthText.setText('Health: ' + Math.max(0, player.health));
      if (player.health <= 0) {
        // Handle player death outside the zone
        socket.emit('playerDied', socket.id);
        player.destroy();
      }
    }
  }