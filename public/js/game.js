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

  // preload method 
  function preload() {
    this.load.image('ship', 'assets/ship.png');
    this.load.image('bullet', 'assets/bullet.png');
    this.load.image('map', 'assets/space.jpg');
    this.load.image('playerIcon', 'assets/player-icon.png');
    this.load.image('otherPlayerIcon', 'assets/other-player-icon.png');
    this.load.image('steroid', 'assets/steroid.png');
  }

  function create(){

  }

  function update(){
    
  }