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

const diePopup = document.getElementById('diePopup');
const gameOverScreen = document.getElementById('gameOverScreen');
const winnerScreen = document.getElementById('winnerScreen');


// global variable
var player, otherPlayers, isDie, playerCount = 0; 

// Define radar parameters
var radarRadius = 100;
var radarX = window.innerWidth - radarRadius - 20; // Right side with some margin
var radarY = 100; // Top side with some margin
var radarScale = 0.5; // Scale factor to zoom in on the radar


var zone, initialRadius, shrinkRate, minZoneRadius, zoneCenter;
var zoneGraphics;
var stars;

var background;
var asteroids;
var mapWidth = 3200; // map width
var mapHeight = 3200; // map height
var asteroidCount = 15; // Number of asteroids to spawn

var cursors, fireKey, bullets;

// Preload method: Used for loading game assets
function preload() {
  // Load game images (sprites, backgrounds, etc.)
  this.load.image('ship', 'assets/ship.png');  // Ship image
  this.load.image('bullet', 'assets/bullet.png');  // Bullet image
  this.load.image('map', 'assets/space.jpg');  // Background image (space)
  this.load.image('playerIcon', 'assets/player-icon.png');  // Icon for the player's ship
  this.load.image('otherPlayerIcon', 'assets/other-player-icon.png');  // Icon for other players' ships
  this.load.image('asteroid', 'assets/steroid.png');  // Image for asteroids
}

// Create method: Used to initialize game objects and settings
function create(){
  // Create the shrinking zone as a mask
  zoneGraphics = this.add.graphics();

  // Initialize zone properties
  initialRadius = 1850;  // Initial size of the zone
  shrinkRate = 200;        // Rate at which the zone shrinks
  minZoneRadius = 20;    // Minimum zone radius
  zoneCenter = { x: 1600, y: 1600 }; // Zone center position

  // Add the background image (map) inside the zone and set its origin
  background = this.add.image(zoneCenter.x, zoneCenter.y, 'map').setOrigin(0.5, 0.5);
  // Scale the background image to be larger than the zone initially
  background.setScale(2); 
  drawZone(this, background);

  // Create the black hole in the center
  drawBlackHole(this, zoneCenter.x, zoneCenter.y, 65, 8);

  asteroids = this.physics.add.group();

  cursors = this.input.keyboard.createCursorKeys();
  fireKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
  startGame(this);

  // Update world bounds
  this.physics.world.setBounds(0, 0, 3200, 3200); // Adjust based on map size
  this.cameras.main.setBounds(0, 0, 3200, 3200);

  // Trigger a callback after 10 seconds
  this.time.addEvent({
    delay: 5000,  // 10 seconds
    callback: () => postDelay(this),  // Callback function to be executed
    callbackScope: this,  // The context of the callback
    loop: false  // Run the callback once, no loop
  });

  // Start a timer to shrink the zone smoothly at intervals
  this.time.addEvent({
    delay: 200, // Trigger shrinking every 10 seconds
    callback: () => shrinkZoneSmoothly(this),
    callbackScope: this,
    loop: true,
  });

  // Create a graphic for the radar itself and store it in the scene
  this.radarGraphics = this.add.graphics();
  this.radarGraphics.setScrollFactor(0);
  // Create the radar circle
  this.radarGraphics.lineStyle(2, 0x00ff00, 1); // Green border
  this.radarGraphics.beginPath();
  this.radarGraphics.arc(radarX, radarY, radarRadius, 0, Math.PI * 2); // Radar circle
  this.radarGraphics.closePath();
  this.radarGraphics.strokePath();

  // Add event listener to update the radar every frame
  this.events.on('update', function () {
    setTimeout(()=>{
      updateRadar(this);
    },3000)
   
  }, this);

}

// Update method: Runs every frame to update game objects (like movement, collision detection, etc.)
function update(time, delta){
  const lobbyDetailsString = sessionStorage.getItem('lobbyDetails');
  const lobbyDetails = JSON.parse(lobbyDetailsString);
  // Access properties of the parsed object
  const roomName = lobbyDetails?.lobbyCode;
  
  if(player){

    // handle player movement and emit it for server
    handlePlayerMovement(this,roomName);

    checkPlayerInsideZone(delta);
    // Destroy stars outside the zone
    // destroyStarsOutsideZone()

    destroyAsteroidsOutsideZone()

    // apply gravitationalPull towars blackhole
    applyGravitationalPull(player, zoneCenter);
  }

  if (Phaser.Input.Keyboard.JustDown(fireKey)) {
    const bulletId = `bullet-${Date.now()}-${socket.id}`;
    // fireBullet(this,roomName);
    socket.emit('fireBullet', {
      x: player.x,
      y: player.y,
      rotation: player.rotation,
      roomCode: roomName,
      ownerId: socket.id,
      bulletId: bulletId
    });

  }
  
  
  
}

function startGame(scene) {
  // Retrieve and parse the lobbyDetails object from sessionStorage
  const lobbyDetailsString = sessionStorage.getItem('lobbyDetails');
  const lobbyDetails = JSON.parse(lobbyDetailsString);

  // Access properties of the parsed object
  const roomName = lobbyDetails?.lobbyCode;
  const playerName = lobbyDetails?.username;

  otherPlayers = scene.physics.add.group();

  bullets = scene.physics.add.group({
    defaultKey: 'bullet',
    maxSize: 100 // Limit the number of bullets
  });

  sendAsteroidDataToServer(asteroidCount, mapWidth,mapHeight, roomName)
  socket.emit('spawnPlayer', { playerName, roomName });

  socket.on('loadCurrentPlayers', (players) => {
    playerCount = players.players.length
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

  socket.on('spawnAsteroids', (asteroidData) => {
    spawnAllAsteroids(asteroidData); // Call a function to render the asteroids
  });

  socket.on('bulletFired', (data) => {
    bulletFired(scene, data)
  });

  socket.on('playerHitUpdate', (data) => {
    if (data.bulletId) {
      bullets.getChildren().forEach((bullet) => {
        if (bullet.id === data.bulletId) {
          bullet.destroy(); 
        }
      });
    }

    if (data.playerId === socket.id) {
       updateHealth(scene, data.health);
    }
  });

  socket.on('playerDied', (data) => {
    playerCount = data.playerCount;
    scene.playerCountText.setText(`playerCount: ${playerCount}`);
    if(data.player.playerId === socket.id){
        isDie = true;
        player.destroy();
        showDiePopup();
    }else{
      otherPlayers.getChildren().forEach((otherPlayer) => {
        if (data.player.playerId === otherPlayer.playerId) {
           otherPlayer.destroy();
        }
      });
    }
  });

  socket.on('playerHealthChanged', (data) => {
    if (data.playerId === socket.id) {
      updateHealth(scene, data.health);
    }
  });

  socket.on('declareWinner',(data)=>{
    console.log("declareWinner===",data)
    setTimeout(()=>{
        showWinnerScreen(data.player)
    },1000)
  })
  
}

function postDelay(scene){
    // Enable collisions between bullets and other players
    scene.physics.add.overlap(bullets, otherPlayers, bulletHitPlayer, null, this);
    // Collision detection: player and asteroids
    scene.physics.add.collider(player, asteroids, handlePlayerAsteroidCollision, null, this);
    // Collision detection: other players and asteroids (if needed)
    scene.physics.add.collider(otherPlayers, asteroids, handleOtherPlayerAsteroidCollision, null, this);

    scene.physics.add.collider(player, otherPlayers, handlePlayerCollision, null, this);
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

function shrinkZoneSmoothly(scene) {
  const currentRadius = initialRadius;
  const targetRadius = Math.max(minZoneRadius, currentRadius - shrinkRate);

  scene.tweens.add({
    targets: { radius: currentRadius }, 
    radius: targetRadius, // Target radius
    duration: 5000, // Shrink duration (in milliseconds)
    ease: 'Linear', // Easing function for smooth animation
    onUpdate: function (tween) {
      const newRadius = tween.getValue();
      initialRadius = newRadius;
      drawZone(scene, background);
    },
    onComplete: function () {
      if (initialRadius <= minZoneRadius && playerCount > 1) {
        showGameOverScreen();
      }
    },
  });
}

// methods: blackhole
function drawBlackHole(scene, x, y, radius, numRings = 5) {
  // Create a container to hold all black hole components
  const blackHoleContainer = scene.add.container(x, y);

  // Create the black hole central graphics (black circle)
  const blackHoleGraphics = scene.add.graphics();
  blackHoleGraphics.fillStyle(0x000000, 1);  // Black color for the center
  blackHoleGraphics.beginPath();
  blackHoleGraphics.arc(0, 0, radius, 0, Math.PI * 2);  // Draw the center black circle
  blackHoleGraphics.closePath();
  blackHoleGraphics.fillPath();
  blackHoleContainer.add(blackHoleGraphics);

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

  }


  return blackHoleContainer;
}

function applyGravitationalPull(object, blackHoleCenter) {
  const distance = Phaser.Math.Distance.Between(object.x, object.y, blackHoleCenter.x, blackHoleCenter.y);
  const gravityStrength = 800;  // Adjust the gravity strength for desired effect
  const eventHorizonRadius = 50;
  if (distance < eventHorizonRadius) {
    object.destroy();  // Destroy the object
    return;  
  }

  if (distance < 300) {
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

  player.setDrag(80);
  player.setAngularDrag(150);
  player.setMaxVelocity(350);
  player.health = playerInfo.health // Set initial health
  player.setCollideWorldBounds(true);
  
  createHealthText(scene, playerInfo.health)

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

function createHealthText(scene, health) {
  // Create a text object for displaying health
  const healthText = scene.add.text(10, 10, `Health: ${health}`, {
    font: '32px Arial',
    fill: '#fff',  // White color for the text
    stroke: '#000',  // Black stroke for visibility
    strokeThickness: 3,
  });

  const playerCountText = scene.add.text(10, 50, `playerCount: ${playerCount}`, {
    font: '32px Arial',
    fill: '#fff',  // White color for the text
    stroke: '#000',  // Black stroke for visibility
    strokeThickness: 3,
  });

  // Ensure the text stays fixed relative to the camera
  healthText.setScrollFactor(0);  // Makes the text fixed on the screen
  playerCountText.setScrollFactor(0); 
  scene.healthText = healthText;  // Store the health text in the scene for later updates
  scene.playerCountText = playerCountText
}

function updateHealth(scene, health) {
  // Update the health text
  scene.healthText.setText(`Health: ${health}`);
  // Change the color based on health value
  if (health <= 30) {
    scene.healthText.setStyle({ fill: '#ff0000' });  // Red for low health
  } else if (health <= 60) {
    scene.healthText.setStyle({ fill: '#ffff00' });  // Yellow for medium health
  } else {
    scene.healthText.setStyle({ fill: '#00ff00' });  // Green for healthy
  }
}

function handlePlayerMovement(scene, roomName) {
  const angularSpeed = 150; // Speed of rotation
  const movementSpeed = 200; // Forward movement speed
  const drag = 120; // Reduced drag value for smoother movement
  const accelerationDecay = 0.5; // Deceleration factor, between 0 and 1

  if (player && isDie !== true) {
    // Set reduced drag on the player
    player.body.drag.set(drag);

    // Handle player movement
    if (cursors.left.isDown) {
      player.setAngularVelocity(-angularSpeed); // Use angularSpeed variable
    } else if (cursors.right.isDown) {
      player.setAngularVelocity(angularSpeed); // Use angularSpeed variable
    } else {
      player.setAngularVelocity(0);
    }

    // Handle forward movement and smooth deceleration
    if (cursors.up.isDown) {
      scene.physics.velocityFromRotation(player.rotation, movementSpeed, player.body.acceleration); // Move forward
    } else {
      // Gradually decrease acceleration to slow down
      player.body.acceleration.x *= accelerationDecay;
      player.body.acceleration.y *= accelerationDecay;
    }

    if (cursors.up.isDown) {
      scene.physics.velocityFromRotation(player.rotation, movementSpeed, player.body.acceleration); // Use movementSpeed variable
    } else {
      player.setAcceleration(0);
    }

    // Emit player movement
    var x = player.x;
    var y = player.y;
    var r = player.rotation;
    if (
      player.oldPosition &&
      (x !== player.oldPosition.x || y !== player.oldPosition.y || r !== player.oldPosition.rotation)
    ) {
      socket.emit('playerMovement', { roomName, x: player.x, y: player.y, rotation: player.rotation });
    }

    // Store old position data
    player.oldPosition = {
      x: player.x,
      y: player.y,
      rotation: player.rotation,
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

socket.on('gameWinner',()=>{
  showWinnerScreen();
})

function bulletFired(scene, data){
  const { x, y, rotation, ownerId, bulletId } = data;

  // Create a new bullet and position it
  const bullet = bullets.get();

  if (bullet) {
    bullet.setPosition(x, y);
    bullet.setRotation(rotation);
    bullet.ownerId = ownerId;
    bullet.id = bulletId;
    // Apply velocity to the bullet
    if (bullet.body) {
       scene.physics.velocityFromRotation(rotation, 500, bullet.body.velocity);  // Adjust speed as needed
    }

    // Scale the bullet down to make it smaller
    bullet.setScale(0.02);  // Adjust the scale as desired
    bullet.lifespan = scene.time.addEvent({
      delay: 800, // Bullet lifespan
      callback: () => bullets.killAndHide(bullet),
    });

    // Make the bullet active and visible
    bullet.setActive(true);
    bullet.setVisible(true);
  }
}

function bulletHitPlayer(bullet, player) {
  if (bullet.ownerId !== player.playerId && bullet.active && player.active) {
    // bullet.destroy(); // Destroy bullet on hit
    const lobbyDetailsString = sessionStorage.getItem('lobbyDetails');
    const lobbyDetails = JSON.parse(lobbyDetailsString);

    // Access properties of the parsed object
    const roomCode = lobbyDetails?.lobbyCode;
    socket.emit('playerHit', { roomCode, playerId: player.playerId, bulletId: bullet.id }); // Emit hit event with room info
  }
}

function generateRandomAsteroids(count, mapWidth, mapHeight) {
  const asteroidsData = [];

  for (let i = 0; i < count; i++) {
    const x = Math.random() * mapWidth; // Random X position across the entire map width
    const y = Math.random() * mapHeight; // Random Y position across the entire map height
    const scale = Math.random() * 0.5 + 0.1; // Random size between 0.1 and 0.6

    asteroidsData.push({ x, y, scale });
  }

  return asteroidsData;
}

function sendAsteroidDataToServer(asteroidCount, mapWidth,mapHeight, roomCode) {
  const asteroidData = generateRandomAsteroids(asteroidCount, mapWidth, mapHeight); // Generate asteroids
  socket.emit('generateAsteroids', {asteroidData, roomCode}); // Emit the asteroid data to the server
}

function spawnAllAsteroids(asteroidData) {
  asteroidData.forEach((data) => {
    const asteroid = asteroids.create(
      data.x,
      data.y,
      'asteroid' 
    );
    asteroid.setScale(data.scale);
    asteroid.body.setDrag(1000);
  });
}

function handlePlayerAsteroidCollision(player,asteroid){
  const lobbyDetailsString = sessionStorage.getItem('lobbyDetails');
  const lobbyDetails = JSON.parse(lobbyDetailsString);
  const roomCode = lobbyDetails?.lobbyCode;
  player.health -= 1;
  socket.emit('changePlayerHealth', { roomCode, playerId: socket.id, health: player.health});
}

function handleOtherPlayerAsteroidCollision(player, asteroid){
  const lobbyDetailsString = sessionStorage.getItem('lobbyDetails');
  const lobbyDetails = JSON.parse(lobbyDetailsString);
  const roomCode = lobbyDetails?.lobbyCode;
  player.health -= 1;
  socket.emit('changePlayerHealth', { roomCode, playerId: socket.id, health: player.health});
}

function handlePlayerCollision(player1, player2) {
  stopPlayerMovement(player1);
  stopPlayerMovement(player2);
}
// Function to stop player movement after collision
function stopPlayerMovement(player) {
  player.setVelocity(0, 0);  
  player.body.stop();     
}

// Update method (called every frame)
function updateRadar(scene) {
  // Clear previous radar markers (before each update)
  scene.radarGraphics.clear();

  // Draw radar circle again
  scene.radarGraphics.lineStyle(2, 0x00ff00, 1);  // Green border for radar
  scene.radarGraphics.beginPath();
  scene.radarGraphics.arc(radarX, radarY, radarRadius, 0, Math.PI * 2);  // Draw radar circle
  scene.radarGraphics.closePath();
  scene.radarGraphics.strokePath();

  // Calculate the radar display area based on scale
  var radarAreaWidth = radarRadius * 2 * radarScale;
  var radarAreaHeight = radarRadius * 2 * radarScale;

  // Get the player's scaled position on the radar
  var playerXOnRadar = (player.x / mapWidth) * radarAreaWidth + radarX - radarAreaWidth / 2;
  var playerYOnRadar = (player.y / mapHeight) * radarAreaHeight + radarY - radarAreaHeight / 2;

  // Draw player's position on the radar
  scene.radarGraphics.fillStyle(0x00ff00, 1); // Green for player
  scene.radarGraphics.fillCircle(playerXOnRadar, playerYOnRadar, 5); // Player marker

  // Draw other players on the radar (looping through only valid players)
  otherPlayers.getChildren().forEach(function(otherPlayer) {
    // Ensure the otherPlayer is valid and not the current player
    if (otherPlayer && otherPlayer !== player) {
      var otherPlayerXOnRadar = (otherPlayer.x / mapWidth) * radarAreaWidth + radarX - radarAreaWidth / 2;
      var otherPlayerYOnRadar = (otherPlayer.y / mapHeight) * radarAreaHeight + radarY - radarAreaHeight / 2;
      0xff0000
      scene.radarGraphics.fillStyle(0xff0000, 1); // Red for other players
      scene.radarGraphics.fillCircle(otherPlayerXOnRadar, otherPlayerYOnRadar, 5); // Other player markers
    }
  });

  // Optional: Draw other important objects (like asteroids) with minimal overhead
  asteroids.getChildren().forEach(function(asteroid) {
    var asteroidXOnRadar = (asteroid.x / mapWidth) * radarAreaWidth + radarX - radarAreaWidth / 2;
    var asteroidYOnRadar = (asteroid.y / mapHeight) * radarAreaHeight + radarY - radarAreaHeight / 2;

    scene.radarGraphics.fillStyle(0x0000ff, 1); // Blue for asteroids
    scene.radarGraphics.fillCircle(asteroidXOnRadar, asteroidYOnRadar, 4); // Asteroid markers
  });
}

// method draw: stars
function drawStars(scene, starCount){
  stars = scene.add.group();

  for (let i = 0; i < starCount; i++) {
    const x = Phaser.Math.Between(zoneCenter.x - initialRadius, zoneCenter.x + initialRadius);
    const y = Phaser.Math.Between(zoneCenter.y - initialRadius, zoneCenter.y + initialRadius);
    const distanceToCenter = Phaser.Math.Distance.Between(x, y, zoneCenter.x, zoneCenter.y);
    
    // Only create stars within the zone
    if (distanceToCenter <= initialRadius) {
      const star = scene.add.circle(x, y, 1, 0xffffff, 0.5); // Dimmer white stars
      stars.add(star);
    }
  }

  for (let i = 0; i < starCount; i++) {
    const x = Phaser.Math.Between(zoneCenter.x - initialRadius, zoneCenter.x + initialRadius);
    const y = Phaser.Math.Between(zoneCenter.y - initialRadius, zoneCenter.y + initialRadius);
    const distanceToCenter = Phaser.Math.Distance.Between(x, y, zoneCenter.x, zoneCenter.y);
    
    // Only create stars within the zone
    if (distanceToCenter <= initialRadius) {
      const star = scene.add.circle(x, y, 1, 0xffffff, 0.5); // Dimmer white stars
      stars.add(star);
    }
  }

}

function fadeOutAndDestroy(object) {
  // Tween to reduce the alpha (opacity) of the object over time
  object.scene.tweens.add({
    targets: object,
    alpha: 0, // Fade to fully transparent
    duration: 15000, // Time in milliseconds
    onComplete: () => {
      object.destroy(); // Destroy the object after the tween completes
    }
  });
}

function checkPlayerInsideZone(delta){
  var distanceToCenter = Phaser.Math.Distance.Between(player.x, player.y, zoneCenter.x, zoneCenter.y);
  if (distanceToCenter > initialRadius) {
    // Player is outside the zone, reduce health
    const lobbyDetailsString = sessionStorage.getItem('lobbyDetails');
    const lobbyDetails = JSON.parse(lobbyDetailsString);
    const roomCode = lobbyDetails?.lobbyCode;
    player.health -= 5 * delta / 1000; // Damage over time
    socket.emit('changePlayerHealth', { roomCode, playerId: socket.id, health: player.health});
  }
}


function destroyStarsOutsideZone(){
  stars.getChildren().forEach((star) => {
      var distanceToCenter = Phaser.Math.Distance.Between(star.x, star.y, zoneCenter.x, zoneCenter.y);
      if (distanceToCenter > initialRadius) {
        fadeOutAndDestroy(star);
      }
  });
}


function destroyAsteroidsOutsideZone(){
  asteroids.getChildren().forEach((asteroid) => {
      var distanceToCenter = Phaser.Math.Distance.Between(asteroid.x, asteroid.y, zoneCenter.x, zoneCenter.y);
      if (distanceToCenter > initialRadius) {
        fadeOutAndDestroy(asteroid);
      }
  });
}

function showDiePopup() {
  console.log("showDiePopup");
  diePopup.style.display = 'block'; 
}

function showWinnerScreen(info) {
  let winnerInfo = document.getElementById('winnerScreen-info');
  winnerInfo.textContent = `The last man standing is : ${info.playerName}`;
  winnerScreen.style.display = 'block'; 
}

function showGameOverScreen(){
  gameOverScreen.style.display = 'block';
}
