var config = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  scene: {
    preload: preload,
    create: create,
    update: update
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  }
};

// global variables
var game = new Phaser.Game(config);

var player, otherPlayers, bullets, fireKey, socket, healthText, miniCam, playerIcon;
var mapKey; 
var miniMapExpanded = false; 

var zone, initialRadius, shrinkRate, minZoneRadius, zoneCenter;
var zoneGraphics;
// Declare background globally
var background;
var steroids;


var playerCountText, healthText;



function preload() {
  this.load.image('ship', 'assets/ship.png');
  this.load.image('bullet', 'assets/bullet.png');
  this.load.image('map', 'assets/space.jpg');
  this.load.image('playerIcon', 'assets/player-icon.png');
  this.load.image('otherPlayerIcon', 'assets/other-player-icon.png');
  this.load.image('steroid', 'assets/steroid.png');
}

function create() {
   // Create the shrinking zone as a mask
  zoneGraphics = this.add.graphics();

  // Initialize zone properties
  initialRadius = 1500;  // Initial size of the zone
  shrinkRate = 8;        // Rate at which the zone shrinks
  minZoneRadius = 100;    // Minimum zone radius
  zoneCenter = { x: 1600, y: 1600 }; // Zone center position

    // Add the background image (map) inside the zone and set its origin
  background = this.add.image(zoneCenter.x, zoneCenter.y, 'map').setOrigin(0.5, 0.5);

  // Scale the background image to be larger than the zone initially
  background.setScale(2); 

  // Draw the initial zone and apply the mask
  drawZone(this, background);

  // Create stars (particles) to simulate the space environment
  const starCount = 500; // Number of stars
  drawStars(this,starCount)

  // Create the black hole in the center
  drawBlackHole(this, zoneCenter.x, zoneCenter.y, 65, 8);

  // Add health text on the left side of the screen (top-left corner)
  healthText = this.add.text(20, 20, 'Health: 100', {
    fontSize: '32px',
    fill: '#fff',
  }).setScrollFactor(0).setDepth(10); // setScrollFactor(0) fixes it, setDepth ensures it's on top
  
 
  cursors = this.input.keyboard.createCursorKeys();
  fireKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

  // Ensure game setup is complete before starting logic
  this.time.delayedCall(100, () => {
    startGame(this);

    // Update world bounds
    this.physics.world.setBounds(0, 0, 3200, 3200); // Adjust based on map size
    this.cameras.main.setBounds(0, 0, 3200, 3200);

    miniCam = setupMiniMap(this);

    if (bullets && otherPlayers) {
      this.physics.add.overlap(bullets, otherPlayers, bulletHitPlayer, null, this);
    } else {
      console.error('Bullets or OtherPlayers are undefined.');
    }

  });
  
}

function startGame(scene) {
  const urlParams = new URLSearchParams(window.location.search);
  const roomName = urlParams.get('room');
  const playerName = urlParams.get('player');

  socket = io();
  otherPlayers = scene.physics.add.group();
  bullets = scene.physics.add.group({
    defaultKey: 'bullet',
    maxSize: 20 // Limit the number of bullets
  });

  socket.emit('joinRoom', { playerName, roomName });

  socket.on('currentPlayers', (players) => {
    Object.keys(players).forEach((id) => {
      if (players[id].playerId === socket.id) {
        player = addPlayer(scene, players[id]);
        miniCam.startFollow(player); 
      } else {
        addOtherPlayers(scene, players[id]);
      }
    });
  });

  socket.on('newPlayer', (playerInfo) => {
    addOtherPlayers(scene, playerInfo);
  });

  socket.on('disconnect', (playerId) => {
    otherPlayers.getChildren().forEach((otherPlayer) => {
      if (playerId === otherPlayer.playerId) {
        otherPlayer.destroy();
      }
    });
  });

  socket.on('playerMoved', (playerInfo) => {
    otherPlayers.getChildren().forEach((otherPlayer) => {
      if (playerInfo.playerId === otherPlayer.playerId) {
        otherPlayer.setRotation(playerInfo.rotation);
        otherPlayer.setPosition(playerInfo.x, playerInfo.y);
      }
    });
  });

  socket.on('currentBullets', (serverBullets) => {
    serverBullets.forEach((bullet) => {
      addBullet(scene, bullet);
    });
  });

  socket.on('newBullet', (bulletData) => {
    addBullet(scene, bulletData);
  });

  socket.on('updateHealth', (data) => {
    if (data.playerId === socket.id) {
      healthText.setText('Health: ' + data.health);
    } else {
      otherPlayers.getChildren().forEach((otherPlayer) => {
        if (data.playerId === otherPlayer.playerId) {
          otherPlayer.health = data.health;
        }
      });
    }
  });

  socket.on('playerDied', (playerId) => {
    if (playerId === socket.id) {
      if (player) {
        player.destroy();
        player = null;
      }
      healthText.setText('Health: 0');
    } else {
      otherPlayers.getChildren().forEach((otherPlayer) => {
        if (playerId === otherPlayer.playerId) {
          otherPlayer.destroy();
        }
      });
    }
  });
}


function update(time, delta) {
  if (player) {
    const urlParams = new URLSearchParams(window.location.search);
    const roomName = urlParams.get('room');
    
    // handle player movement and emit it for server
    handlePlayerMovement(this,roomName);

    // handle bullet shooting
    handleShooting(this);
    
    // Shrink the zone over time
    shrinkZoneOverTime(delta);
     
    // Check if the player is inside the zone
    checkPlayerInsideZone(delta);

    // Destroy stars outside the zone
    destroyStarsOutsideZone()
    
    // apply gravitationalPull towars blackhole
    applyGravitationalPull(player, zoneCenter);
    
    // Create colliders
    createColliders(this);
  
  }
}

function createColliders(scene) {
    // scene.physics.add.collider(steroids, steroids);
    // scene.physics.add.collider(steroids, player);
    // scene.physics.add.collider(steroids, bullets);
}
