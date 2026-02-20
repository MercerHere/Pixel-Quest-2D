const config = {
  type: Phaser.AUTO,
  width: 1150,
  height: 770,
  parent: 'game-container',
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 600 },
      debug: false
    }
  },
  scene: {
    preload: preload,
    create: create,
    update: update
  }
};

let player;
let coins;
let coinscore = 0;
let doorOpened = false;

function preload() {
    // Load player spritesheets
  this.load.spritesheet("player_idle", "assets/characters/Idle.png", { frameWidth: 144, frameHeight: 144 });
  this.load.spritesheet("player_jump", "assets/characters/Jump.png", { frameWidth: 144, frameHeight: 144 });
  this.load.spritesheet("player_run", "assets/characters/Run.png", { frameWidth: 144, frameHeight: 144 });
  this.load.spritesheet("player_fall", "assets/characters/Fall.png", { frameWidth: 144, frameHeight: 144 });

  // Load environment assets
  this.load.tilemapTiledJSON("map", "map1.json");
  this.load.image("ground", "assets/world/ground.png");
  this.load.image("bg", "assets/world/bg.png");
  this.load.image("spikes", "assets/world/spikes.png");
  this.load.spritesheet("coins", "assets/world/coins.png", { frameWidth: 16, frameHeight: 16 });
  this.load.image("boots", "assets/world/boots.png");
  this.load.spritesheet("door", "assets/world/door.png", { frameWidth: 160, frameHeight: 160 });

  // Load audio assets
  this.load.audio("bg_music", "assets/sfx/Ancestry.m4a");
  this.load.audio("coin_sound", "assets/sfx/coin.wav");
}

function create() {
  // Add background and world layers
  const map = this.make.tilemap({ key: "map" });
  const tileset_ground = map.addTilesetImage("ground", "ground");
  const tileset_spikes = map.addTilesetImage("spikes", "spikes");
  const tileset_bg = map.addTilesetImage("bg", "bg");
  const bglayer = map.createLayer("bg", tileset_bg, 0, 0);
  const worldlayer = map.createLayer("ground", tileset_ground, 0, 0);
  const spikelayer = map.createLayer("spikes", tileset_spikes, 0, 0);
  coinlayer = map.getObjectLayer("coins")["objects"];
  worldlayer.setCollisionByProperty({ collides: true });
  spikelayer.setCollisionByProperty({ collides: true });

  // Play background music
  const music = this.sound.add("bg_music", { loop: true, volume: 0.5 });
  music.play();

  // Prepare player's spawn point
  const spawnPoint = map.findObject("spawn_points" , obj => obj.name === "player_spawn");
  
  // Create player
  player = this.physics.add.sprite(spawnPoint.x, spawnPoint.y, "player_idle").setScale(2).refreshBody();
  player.body.setSize(16, 16).setOffset(64,64);
  player.setDepth(10); // Ensure player is in front of the background
  // Set up collision between player and world
  this.physics.add.collider(player, worldlayer);

  // Add controls to movement
  cursors = this.input.keyboard.createCursorKeys();

 /* // Debug graphics
  this.input.keyboard.once("keydown-D", event => {
  this.physics.world.createDebugGraphic()});
  // faster testing : get all coins
  this.input.keyboard.once("keydown-C", event => {
    coinscore = coinlayer.length;});*/


  // Create animations
  this.anims.create({
    key:"idle",
    frames: this.anims.generateFrameNumbers("player_idle", {start:0, end:6}),
    frameRate: 10,
    repeat: -1
  });
  this.anims.create({
    key:"run",
    frames: this.anims.generateFrameNumbers("player_run", {start:0, end:7}),
    frameRate: 10,
    repeat: -1
  });
  this.anims.create({
    key:"jump",
    frames: this.anims.generateFrameNumbers("player_jump", {start:0, end:3}),
    frameRate: 10,
    repeat: -1
  });
  this.anims.create({
    key:"fall",
    frames: this.anims.generateFrameNumbers("player_fall", {start:0, end:3}),
    frameRate: 10,
    repeat: -1
  });
  this.anims.create({
    key:"coin_spin",
    frames: this.anims.generateFrameNumbers("coins", {start:0, end:4}),
    frameRate: 10,
    repeat: -1
  });
  this.anims.create({
    key:"door_closed",
    frames: this.anims.generateFrameNumbers("door", {start:0, end:3}),
    frameRate: 10,
    repeat: -1
  });
  this.anims.create({
    key:"door_opened",
    frames: this.anims.generateFrameNumbers("door", {start:4, end:7}),
    frameRate: 10,
    repeat: -1
  });

  // Set up collision between player and spikes
  this.physics.add.collider(player, spikelayer, function(player, spikelayer) {
    if (!doorOpened) {
    coins.clear(true, true); // clear coins
    coinlayer.forEach(object => {
      let obj = coins.create(object.x, object.y, "coins");
       obj.setScale(object.width/16, object.height/16); 
       obj.setOrigin(0); 
       obj.body.width = object.width; 
       obj.body.height = object.height; 
       obj.anims.play("coin_spin", true);
    });
    coinscore = 0; // reset the coin score
    text.setText(`Coins: ${coinscore}/${coinlayer.length}`);
    player.setPosition(spawnPoint.x, spawnPoint.y);
  }}, null, this);


  // Camera setup to follow the player and stay within the bounds of the map
  const camera = this.cameras.main;
  camera.startFollow(player);
  camera.setBounds(0, 0, map.widthInPixels, map.heightInPixels);


  // Set physics world bounds to match the map size
  this.physics.world.bounds.width = map.widthInPixels;
  this.physics.world.bounds.height = map.heightInPixels;
  player.setCollideWorldBounds(true);

  // implementing a simple fade-in effect at the start of the game
  this.cameras.main.fadeIn(1000, 0, 0, 0);

  // Create coins group and add coins from the tilemap
  coins = this.physics.add.staticGroup();
  coinlayer.forEach(object => {
    let obj = coins.create(object.x, object.y, "coins"); 
       obj.setScale(object.width/16, object.height/16); 
       obj.setOrigin(0); 
       obj.body.width = object.width; 
       obj.body.height = object.height; 
       obj.anims.play("coin_spin", true);
});
  this.physics.add.overlap(player, coins, collectCoin, null, this);

  // Score text
  text = this.add.text(16, 16, `Coins: ${coinscore}/${coinlayer.length}`, {
      fontSize: '16px',
      fill: '#ffd700',
      fontFamily: '"Press Start 2P", monospace',
      stroke: '#000000',
      strokeThickness: 3
    });
    text.setScrollFactor(0);

  boots = this.physics.add.sprite(27,288, "boots").setScale(2).refreshBody();
  boots.body.setAllowGravity(false);
  this.physics.add.overlap(player, boots, () => {
    boots.disableBody(true, true);
    player.setVelocityY(-600);
  });
  
  // Door setup
  const doorObject = map.findObject("door", obj => obj.name === "door");
  door = this.physics.add.sprite(doorObject.x, 600, "door");
  door.setOrigin(0);
  door.body.setAllowGravity(false);
  door.body.setImmovable(true);
  door.anims.play("door_closed", true);

}





function collectCoin(player, coin) {
  coin.destroy(coin.x, coin.y); // destroy the coin
  coinscore ++; // increment the score
  text.setText(`Coins: ${coinscore}/${coinlayer.length}`); // set the text to show the current score
  this.sound.add("coin_sound", { volume: 0.5 }).play(); // play coin collection sound
  if (coinscore >= coinlayer.length) {
    door.anims.play("door_opened", true);
    doorOpened = true;
    text.setText(`Somewhere, a door has opened...`); // update text to indicate the door has opened
    this.physics.add.overlap(player, door, winLevel, null, this); // set up overlap to win the level
  }
  return false;
}





function winLevel(player, door) {
  this.physics.pause(); // pause the game
  player.setVelocity(0, 0); // stop player movement
  
  // Create black rectangle overlay
  const blackScreen = this.add.rectangle(
    this.cameras.main.centerX,
    this.cameras.main.centerY,
    this.cameras.main.width,
    this.cameras.main.height,
    0x000000
  );
  blackScreen.setAlpha(0);
  blackScreen.setScrollFactor(0);
  blackScreen.setDepth(1000);
  
  // Create win text (hidden initially)
  const winText = this.add.text(
    this.cameras.main.centerX,
    this.cameras.main.centerY,
    'You win!\nThanks for playing\nthis prototype!',
    {
      fontSize: '32px',
      fill: '#ffffff',
      fontFamily: '"Press Start 2P", monospace',
      align: 'center',
      stroke: '#000000',
      strokeThickness: 4
    }
  );
  winText.setOrigin(0.5);
  winText.setScrollFactor(0);
  winText.setDepth(1001);
  winText.setAlpha(0);
  
  // Fade black screen in
  this.tweens.add({
    targets: blackScreen,
    alpha: 1,
    duration: 1000,
    onComplete: () => {
      // Fade text in after black screen
      this.tweens.add({
        targets: winText,
        alpha: 1,
        duration: 500
      });
    }
  });
  
  return false;
}






function update() {
  // Handle player movement
  player.setVelocityX(0);
  if (cursors.right.isDown)
  {
    player.setVelocityX(160);
  }
  if (cursors.left.isDown)
  {
    player.setVelocityX(-160);
  }
  if (cursors.up.isDown && player.body.blocked.down) {
    player.setVelocityY(-300);
  }

  
  // Handle animations based on movement
  if (player.body.velocity.x > 0 && player.body.velocity.y === 0)
  {
    player.anims.play("run", true);
    player.flipX = false;
  }
  if (player.body.velocity.x < 0 && player.body.velocity.y === 0)
  {
    player.anims.play("run", true);
    player.flipX = true;
  }
  if (player.body.velocity.x === 0 && player.body.velocity.y === 0)
  {
    player.anims.play("idle", true);
  }
  if (player.body.velocity.x > 0 && player.body.velocity.y > 0)
  {
    player.anims.play("fall", true);
    player.flipX = false;
  }
  if (player.body.velocity.x < 0 && player.body.velocity.y > 0)
  {
    player.anims.play("fall", true);
    player.flipX = true;
  }
  if (player.body.velocity.x === 0 && player.body.velocity.y > 0)
  {
    player.anims.play("fall", true);
  }
  if (player.body.velocity.x > 0 && player.body.velocity.y < 0)
  {
    player.anims.play("jump", true);
    player.flipX = false;
  }
  if (player.body.velocity.x < 0 && player.body.velocity.y < 0)
  {
    player.anims.play("jump", true);
    player.flipX = true;
  }
  if (player.body.velocity.x === 0 && player.body.velocity.y < 0)
  {
    player.anims.play("jump", true);
  }

}

const game = new Phaser.Game(config);
