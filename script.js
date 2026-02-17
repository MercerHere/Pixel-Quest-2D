const config = {
  type: Phaser.AUTO,
  width: 1570,
  height: 1913,
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 300 }, // player will fall down
      debug: false
    }
  },
  scene: {
    preload,
    create,
    update
  }
};


let player;
let ground;
let bg;
let cursors;
let obstacle;
let star;


function preload() {
  this.load.spritesheet("player", "assets/prototype_character.png", { frameWidth: 32, frameHeight: 32 });
  this.load.image("ground", "assets/ground.png");
  this.load.image("bg", "assets/bigger_bg.png");
  this.load.image("star", "assets/smallstar.png");
  this.load.image("obstacle", "assets/obstacle.png");
}

function create() {

  // add background
  const width = this.sys.game.config.width;
  const height = this.sys.game.config.height;
  this.add.image(width / 2, height / 2, "bg");

  // add the player sprite with physics enabled
  player = this.physics.add.sprite(200, 1600, "player").setScale(3).refreshBody();
  player.body.setSize(14, 14);

  // add a static group for ground and obstacles
  ground = this.physics.add.staticGroup();
  obstacle = this.physics.add.staticGroup();

  //create a wall of obstacles
  for(let i = 0 ; i <= 7 ; i++)
  {
    obstacle.create(250,900 - i*28, "obstacle").setScale(2).refreshBody();
  }


  // create ground platforms
  ground.create(500, 1800, "ground").setScale(2).refreshBody();
  ground.create(600,1625,"ground");
  ground.create(800,1475,"ground");
  ground.create(200,1325,"ground");
  ground.create(-30,1185,"ground");
  ground.create(-70,1045,"ground");
  ground.create(700,905,"ground");
  ground.create(1200,765,"ground");
  ground.create(1250,625,"ground");
  ground.create(600,485,"ground");
  ground.create(0,345,"ground");
  this.physics.add.collider(player,ground);
  this.physics.add.collider(player,obstacle);


  star=this.physics.add.sprite(125, 800, "star");
  star.body.setAllowGravity(false);
  this.physics.add.overlap(player, star, () => {
    star.disableBody(true, true);
    player.setVelocityY(-400);
  });

  //player.setCollideWorldBounds(true);
  cursors = this.input.keyboard.createCursorKeys();
  //this.cameras.main.startFollow(player);


  this.anims.create({
    key:"walk",
    frames: this.anims.generateFrameNumbers("player", {start:16, end:19}),
    frameRate: 10,
    repeat: -1
  });
  this.anims.create({
    key:"jumping",
    frames: this.anims.generateFrameNumbers("player", {start:25, end:25}),
    frameRate: 10,
    repeat: -1
  });
}

  function update() {
  if (cursors.up.isDown && player.body.touching.down) {
    player.anims.play("jumping", true);
    player.setVelocityY(-310);
  }
  else if (cursors.left.isDown)
  {
    player.setVelocityX(-160);
    player.anims.play("walk", true);
    player.flipX = true;
  }
  else if (cursors.right.isDown)
  {
    player.setVelocityX(160);
    player.anims.play("walk", true);
    player.flipX = false;
  }
  else
  {
    player.setVelocityX(0);
    player.anims.stop();
  }
}


new Phaser.Game(config);
