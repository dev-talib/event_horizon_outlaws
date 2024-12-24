// Configuring the Phaser game instance
var config = {
    type: Phaser.AUTO,  // Phaser will automatically decide the rendering context (WebGL or Canvas)
    width: window.innerWidth,  // Set the game width to the window's width
    height: window.innerHeight,  // Set the game height to the window's height
    scene: {
      preload: preload,  // Load game assets before starting the game
      create: create,    // Create game objects and initialize them
      update: update     // Update game objects during each frame
    },
    physics: {
      default: 'arcade',  // Use the Arcade Physics engine
      arcade: {
        gravity: { y: 0 },  // No gravity (space environment)
        debug: false         // Disables the debugging information in the console
      }
    }
};

// Create a new Phaser game with the above configuration
var game = new Phaser.Game(config);

// global variable
var player, otherPlayers; 
var zone, initialRadius, shrinkRate, minZoneRadius, zoneCenter;
var zoneGraphics;

var background;
var steroids;

var cursors, fireKey;

// Preload method: Used for loading game assets
function preload() {
  // Load game images (sprites, backgrounds, etc.)
  this.load.image('ship', 'assets/ship.png');  // Ship image
  this.load.image('bullet', 'assets/bullet.png');  // Bullet image
  this.load.image('map', 'assets/space.jpg');  // Background image (space)
  this.load.image('playerIcon', 'assets/player-icon.png');  // Icon for the player's ship
  this.load.image('otherPlayerIcon', 'assets/other-player-icon.png');  // Icon for other players' ships
  this.load.image('steroid', 'assets/steroid.png');  // Image for asteroids
}

// Create method: Used to initialize game objects and settings
function create(){
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

  // Create the black hole in the center
  drawBlackHole(this, zoneCenter.x, zoneCenter.y, 65, 8);

  
  cursors = this.input.keyboard.createCursorKeys();
  fireKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
  startGame(this);

  // Update world bounds
  this.physics.world.setBounds(0, 0, 3200, 3200); // Adjust based on map size
  this.cameras.main.setBounds(0, 0, 3200, 3200);


}

// Update method: Runs every frame to update game objects (like movement, collision detection, etc.)
function update(){
  const lobbyDetailsString = sessionStorage.getItem('lobbyDetails');
  const lobbyDetails = JSON.parse(lobbyDetailsString);
  // Access properties of the parsed object
  const roomName = lobbyDetails?.lobbyCode;
 
  // handle player movement and emit it for server
  handlePlayerMovement(this,roomName);

   
}


function startGame(scene) {
  // Retrieve and parse the lobbyDetails object from sessionStorage
  const lobbyDetailsString = sessionStorage.getItem('lobbyDetails');
  const lobbyDetails = JSON.parse(lobbyDetailsString);

  // Access properties of the parsed object
  const roomName = lobbyDetails?.lobbyCode;
  const playerName = lobbyDetails?.username;

  otherPlayers = scene.physics.add.group();

  socket.emit('spawnPlayer', { playerName, roomName });

  socket.on('loadCurrentPlayers', (players) => {
    Object.keys(players).forEach((id) => {
      if (players[id].playerId === socket.id) {
        player = createPlayerInstance(scene, players[id]);
      } else {
        createOtherPlayerInstance(scene, players[id]);
      }
    });
  });

  socket.on('spawnNewPlayerInstance', (playerInfo) => {
    createOtherPlayerInstance(scene, playerInfo);
  });


}




// methods: zone 
function drawZone(scene, background) {
  zoneGraphics.clear();

  // Draw the shrinking zone as a circular mask
  zoneGraphics.fillStyle(0xffffff, 1); // White for the visible zone
  zoneGraphics.beginPath();
  zoneGraphics.arc(zoneCenter.x, zoneCenter.y, initialRadius, 0, Math.PI * 2);
  zoneGraphics.closePath();
  zoneGraphics.fillPath();

  // Optionally, draw a red border around the zone
  zoneGraphics.lineStyle(4, 0xff0000, 1); // Red border
  zoneGraphics.strokeCircle(zoneCenter.x, zoneCenter.y, initialRadius);

  // Apply the zoneGraphics as a mask to the background
  background.setMask(zoneGraphics.createGeometryMask());
}





// methods: blackhole
function drawBlackHole(scene, x, y, radius, numRings = 5) {
  // Create a container to hold all black hole components
  const blackHoleContainer = scene.add.container(x, y);
  console.log('Black hole container created.');

  // Create the black hole central graphics (black circle)
  const blackHoleGraphics = scene.add.graphics();
  blackHoleGraphics.fillStyle(0x000000, 1);  // Black color for the center
  blackHoleGraphics.beginPath();
  blackHoleGraphics.arc(0, 0, radius, 0, Math.PI * 2);  // Draw the center black circle
  blackHoleGraphics.closePath();
  blackHoleGraphics.fillPath();
  blackHoleContainer.add(blackHoleGraphics);
  console.log('Black hole central circle drawn with radius:', radius);

  // Add rotating spiral rings with a "light-sucking" color effect
  for (let i = 0; i < numRings; i++) {
    const ring = scene.add.graphics();
    
    // Define ring properties: dark purple, blue, and red hues with decreasing opacity
    const ringColors = [0x4B0082, 0x00008B, 0x8B0000];  // Indigo, dark blue, and dark red
    const ringColor = ringColors[i % ringColors.length];  // Cycle through colors
    const alpha = 0.15 - (i * 0.02);  // Fade opacity for each ring
    
    // Set the line style for the ring with reduced brightness
    ring.lineStyle(3, ringColor, alpha);
    
    // Draw a circular ring, increasing the radius for each ring
    const ringRadius = radius + (i * 10);  // Each ring is 10px larger than the last
    ring.strokeCircle(0, 0, ringRadius);  // Draw the ring
    blackHoleContainer.add(ring);

    console.log(`Ring ${i + 1} drawn with radius:`, ringRadius, 'and color:', ringColor);

    // Add a slow, eerie rotating animation for the rings
    scene.tweens.add({
      targets: ring,
      angle: i % 2 === 0 ? 360 : -360,  // Alternate between clockwise and counter-clockwise
      duration: 4000 + (i * 400),  // Slightly slower rotation for each ring
      repeat: -1,  // Infinite rotation
      ease: 'Linear',  // Linear easing for consistent motion
    });
  }


  return blackHoleContainer;
}



function applyGravitationalPull(object, blackHoleCenter) {
  const distance = Phaser.Math.Distance.Between(object.x, object.y, blackHoleCenter.x, blackHoleCenter.y);
  const gravityStrength = 5000;  // Adjust the gravity strength for desired effect
  const eventHorizonRadius = 50;
  if (distance < eventHorizonRadius) {
    console.log(`${object.texture.key} entered the black hole and is being destroyed.`);
    object.destroy();  // Destroy the object
    return;  
  }
  
  if (distance < 200) {
    const angle = Phaser.Math.Angle.Between(object.x, object.y, blackHoleCenter.x, blackHoleCenter.y);
    
    // Apply velocity towards the black hole
    object.body.velocity.x += Math.cos(angle) * gravityStrength / distance;
    object.body.velocity.y += Math.sin(angle) * gravityStrength / distance;
  }
}


// method: player
function createPlayerInstance(scene, playerInfo) {
  let player = scene.physics.add.image(playerInfo.x, playerInfo.y, 'ship')
  .setOrigin(0.5, 0.5)
  .setDisplaySize(53, 40);

  player.setDrag(50);
  player.setAngularDrag(90);
  player.setMaxVelocity(500);
  // player.health = playerInfo.health;
  player.setCollideWorldBounds(true);

  // Make sure the camera follows the player
  scene.cameras.main.startFollow(player);
  return player;
}


function createOtherPlayerInstance(scene, playerInfo) {
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


socket.on('syncPlayerMovement', (playerInfo) => {
  otherPlayers.getChildren().forEach((otherPlayer) => {
    if (playerInfo.playerId === otherPlayer.playerId) {
      otherPlayer.setRotation(playerInfo.rotation);
      otherPlayer.setPosition(playerInfo.x, playerInfo.y);
    }
  });
});