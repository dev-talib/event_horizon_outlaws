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
  
}

// Update method: Runs every frame to update game objects (like movement, collision detection, etc.)
function update(){
 
}
