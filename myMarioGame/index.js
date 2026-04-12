const canvas = document.querySelector("canvas");
const c = canvas.getContext("2d");
c.imageSmoothingEnabled = false;
canvas.width = 762;
canvas.height = 720;

const gravity = 0.5;

class Player {
    constructor() {
        this.position = {
            x: 100,
            y: 527
        }
        this.scale = 2.5;
        this.width = 15.5 * this.scale;
        this.height = 16 * this.scale;
        this.velocity = {
            x: 0,
            y: 0
        };
        this.animations = {
            standRight: {
                image: stand_right,
                frameCount: 1,
                frameWidth: 12,
                frameHeight: 16,
                hold: 12
            },
            standLeft: {
                image: stand_left,
                frameCount: 1,
                frameWidth: 12,
                frameHeight: 16,
                hold: 12
            },
            runRight: {
                image: sh_run_right,
                frameCount: 3,
                frameWidth: 15,
                frameHeight: 16,
                hold: 8
            },
            runLeft: {
                image: sh_run_left,
                frameCount: 3,
                frameWidth: 15,
                frameHeight: 16,
                hold: 8
            }
        };
        this.currentAnimation = this.animations.standRight;
        this.currentAnimationName = "standRight";
        this.frame = 0;
        this.frameTick = 0;
        this.lastDirection = "right";
        this.isGrounded = false;
    }
    setAnimation(animationName) {
        if (this.currentAnimationName === animationName) return;
        this.currentAnimation = this.animations[animationName];
        this.currentAnimationName = animationName;
        this.frame = 0;
        this.frameTick = 0;
    }
    updateAnimationFrame() {
        this.frameTick += 1;
        if (this.frameTick % this.currentAnimation.hold !== 0) return;
        this.frame = (this.frame + 1) % this.currentAnimation.frameCount;
    }
    draw() {
        const sourceX = this.currentAnimation.frameWidth * this.frame;
        const destinationWidth = this.currentAnimation.frameWidth * this.scale;
        const destinationHeight = this.currentAnimation.frameHeight * this.scale;

        c.drawImage(
            this.currentAnimation.image,
            sourceX,
            0,
            this.currentAnimation.frameWidth,
            this.currentAnimation.frameHeight,
            this.position.x,
            this.position.y,
            destinationWidth,
            destinationHeight);

    }
    update() {
        this.updateAnimationFrame();
        this.draw();
        this.position.y += this.velocity.y;
        this.position.x += this.velocity.x;
        if (player.position.y + player.height + player.velocity.y <= canvas.height) {
            player.velocity.y += gravity;
        }
    }
}

class Platform {
    constructor({x, y, image}) {
        this.position = {
            x,
            y
        };
        this.image = image;
        this.width = image.width;
        this.height = image.height;
    }
    draw() {
        c.drawImage(this.image, this.position.x, this.position.y);
    }
}

class Pipe {
    constructor({x, y, image}) {
        this.position = {
            x,
            y
        };
        this.image = image;
        this.width = image.width;
        this.height = image.height;
    }
    draw() {
        c.drawImage(this.image, this.position.x, this.position.y);
    }
}

class Goomba {
    constructor({x, y, image, patrolDistance = 160}) {
        this.position = {
            x,
            y
        };
        this.spawnX = x;
        this.velocity = {
            x: -1,
            y: 0
        };
        this.image = image;
        this.frameWidth = 16;
        this.frameHeight = 16;
        this.scale = 2;
        this.width = this.frameWidth * this.scale;
        this.height = this.frameHeight * this.scale;
        this.walkFrames = [0, 1];
        this.stompFrame = 2;
        this.frameIndex = 0;
        this.frameTick = 0;
        this.frameHold = 12;
        this.isStomped = false;
        this.stompTimer = 0;
        this.patrolDistance = patrolDistance;
    }
    stomp() {
        this.isStomped = true;
        this.velocity.x = 0;
        this.velocity.y = 0;
        this.frameIndex = this.stompFrame;
        this.stompTimer = 45;
    }
    reverseDirection() {
        this.velocity.x *= -1;
    }
    updateAnimation() {
        if (this.isStomped) {
            this.frameIndex = this.stompFrame;
            return;
        }

        this.frameTick += 1;
        if (this.frameTick % this.frameHold !== 0) return;

        const currentWalkIndex = this.walkFrames.indexOf(this.frameIndex);
        const nextWalkIndex = (currentWalkIndex + 1) % this.walkFrames.length;
        this.frameIndex = this.walkFrames[nextWalkIndex];
    }
    draw() {
        c.drawImage(
            this.image,
            this.frameIndex * this.frameWidth,
            0,
            this.frameWidth,
            this.frameHeight,
            this.position.x,
            this.position.y,
            this.width,
            this.height
        );
    }
    update() {
        this.updateAnimation();

        if (this.isStomped) {
            if (this.stompTimer > 0) this.stompTimer -= 1;
            this.draw();
            return;
        }

        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;

        if (this.position.y + this.height + this.velocity.y <= canvas.height) {
            this.velocity.y += gravity;
        }

        const minX = this.spawnX - this.patrolDistance;
        const maxX = this.spawnX + this.patrolDistance;
        if (this.position.x <= minX || this.position.x + this.width >= maxX) {
            this.reverseDirection();
        }

        this.draw();
    }
}

class GenericObject {
    constructor({x, y, image}) {
        this.position = {
            x,
            y
        };
        this.image = image;
        this.width = image.width;
        this.height = image.height;
    }
    draw() {
        c.drawImage(this.image, this.position.x, this.position.y);
    }
}


function createImage(imageSrc) {
    const image = new Image();
    image.src = imageSrc;
    return image;
}

const imgunitplatform = createImage("./assets/world/unit_platform.png");
const imgPlatform = createImage("./assets/world/platform.png");
const imgunitblock = createImage("./assets/world/unit_block.png");
const imgbigblock = createImage("./assets/world/big_block.png");
const imgbg = createImage("./assets/world/bg.png");
const imghill = createImage("./assets/world/hill.png");
const imgcloud = createImage("./assets/world/cloud.png");
const imgbush = createImage("./assets/world/bushes.png");
const imgPipe1 = createImage("./assets/world/pipe1.png");
const imgPipe2 = createImage("./assets/world/pipe2.png");
const imgPipe3 = createImage("./assets/world/pipe3.png");
const stand_right = createImage("./assets/character/stand_right.png");
const stand_left = createImage("./assets/character/stand_left.png");
const sh_run_right = createImage("./assets/character/run_right_spritesheet.png");
const sh_run_left = createImage("./assets/character/run_left_spritesheet.png");
const goombaSpriteSheet = createImage("./assets/character/goomba_spritesheet.png");

const bgm = new Audio("./assets/music/aboveground_bgm.ogg");
bgm.loop = true;
bgm.volume = 0.35;

const jumpSfx = new Audio("./assets/music/jump-small.wav");
jumpSfx.volume = 0.5;

const stompSfx = new Audio("./assets/music/stomp.wav");
stompSfx.volume = 0.6;

const player = new Player();
let platforms = [];
let pipes = [];
let goombas = [];
let genericObjects = [];
const keys = {
    right: {
        pressed: false
    },
    left: {
        pressed: false
    }
};

let scrollOffset = 0;
let jumpBufferFrames = 0;
const JUMP_BUFFER_MAX = 8;
let audioUnlocked = false;

let loadedAssets = 0;
let gameStarted = false;
const requiredAssets = [
    
    imgunitplatform,
    imgPlatform,
    imgunitblock,
    imgbigblock,
    imgPipe1,
    imgPipe2,
    imgPipe3,
    imgbg,
    imghill,
    imgcloud,
    imgbush,
    stand_right,
    stand_left,
    sh_run_right,
    sh_run_left,
    goombaSpriteSheet
];

function playSfx(audio) {
    audio.currentTime = 0;
    audio.play().catch(() => {});
}

function unlockAudio() {
    if (audioUnlocked) return;
    audioUnlocked = true;
    bgm.play().catch(() => {
        audioUnlocked = false;
    });
}

function setupLevel() {
    genericObjects = [
        new GenericObject({ x: 0, y: 0, image: imgbg }),
        new GenericObject({ x: 0, y: 528, image: imghill }),
        new GenericObject({ x: 300, y: 200, image: imgcloud }),
        new GenericObject({ x: 900, y: 150, image: imgcloud }),
        new GenericObject({ x: 1300, y: 200, image: imgcloud }),
        new GenericObject({ x: 2000, y: 100, image: imgcloud }),
        new GenericObject({ x: 2500, y: 150, image: imgcloud }),
        new GenericObject({ x: 600, y: 576, image: imgbush }),
        new GenericObject({ x: 2800, y: 576, image: imgbush })

    ];

    platforms = [
        new Platform({ x: 0, y: 624, image: imgPlatform }),
        new Platform({ x: imgPlatform.width, y: 624, image: imgPlatform }),
        new Platform({ x: imgPlatform.width * 2, y: 624, image: imgPlatform }),
        new Platform({ x: imgPlatform.width * 3 + imgunitplatform.width * 5, y: 624, image: imgunitplatform }),
        new Platform({ x: imgPlatform.width * 3 + imgunitplatform.width * 6, y: 624, image: imgunitplatform }),
        new Platform({ x: imgPlatform.width * 3 + imgunitplatform.width * 12, y: 624, image: imgunitplatform }),
        new Platform({ x: imgPlatform.width * 3 + imgunitplatform.width * 13, y: 624, image: imgunitplatform }),
        new Platform({ x: imgPlatform.width * 4, y: 624, image: imgPlatform }),
        new Platform({ x: imgPlatform.width * 5 - (imgPlatform.width - imgunitplatform.width * 7), y: 624, image: imgPlatform }),
        new Platform({ x: 4080 + 96 * 3 + 48, y: 624, image: imgPlatform })
    ];

    pipes = [
        new Pipe({
            x: 1344, //goal : 28 blocks 
            y: 624 - imgPipe1.height, 
            image: imgPipe1
        }),
        new Pipe({
            x: 1344 + 48 * 6, 
            y: 624 - imgPipe2.height, 
            image: imgPipe2
        }),
        new Pipe({
            x: 1344 + 48 * 12, 
            y: 624 - imgPipe3.height, 
            image: imgPipe3
        }),
        new Pipe({
            x: 1344 + 48 * 19, 
            y: 624 - imgPipe3.height, 
            image: imgPipe3
        }),
        new Pipe({
            x: 1344 + 48 * 26, 
            y: 624 - imgPipe3.height, 
            image: imgPipe3
        }),

        new Pipe({x: 1344 + 48 * 6 + imgPipe2.width, y: 576, image: imgunitblock}),
        new Pipe({x: 1344 + 48 * 14 + imgPipe2.width, y: 624 - imgPipe3.height - imgunitblock.height * 2, image: imgunitblock}),
        new Pipe({x: 1344 + 48 * 21 + imgPipe2.width, y: 624 - imgPipe3.height - imgunitblock.height * 2, image: imgunitblock}),


        new Pipe({x: 3216 - 48, y: 576, image: imgunitblock}),
        new Pipe({x: 3216, y: 528, image: imgbigblock}),
        new Pipe({x: 3216 + 96, y: 528, image: imgbigblock}),
        new Pipe({x: 3216 + 96 * 2, y: 528, image: imgbigblock}),
        new Pipe({x: 3216 + 96 * 3, y: 528, image: imgbigblock}),
        new Pipe({x: 3216 + 96 * 4, y: 528, image: imgbigblock}),


        new Pipe({x: 3216 + 48, y: 528 - imgunitblock.height, image: imgunitblock}),
        new Pipe({x: 3216 + 96, y: 528 - imgbigblock.height, image: imgbigblock}),
        new Pipe({x: 3216 + 96 * 2, y: 528 - imgbigblock.height, image: imgbigblock}),
        new Pipe({x: 3216 + 96 * 3, y: 528 - imgbigblock.height, image: imgbigblock}),
        new Pipe({x: 3216 + 96 * 4, y: 528 - imgbigblock.height, image: imgbigblock}),

        new Pipe({x: 3216 + 48 * 3, y: 528 - imgbigblock.height * 2 + imgunitblock.height, image: imgunitblock}),
        new Pipe({x: 3216 + 96 * 2, y: 528 - imgbigblock.height * 2, image: imgbigblock}),
        new Pipe({x: 3216 + 96 * 3, y: 528 - imgbigblock.height * 2, image: imgbigblock}),
        new Pipe({x: 3216 + 96 * 4, y: 528 - imgbigblock.height * 2, image: imgbigblock}),  
        
        new Pipe({x: 3216 + 48 * 5, y: 528 - imgbigblock.height * 3 + imgunitblock.height, image: imgunitblock}),
        new Pipe({x: 3216 + 96 * 3, y: 528 - imgbigblock.height * 3, image: imgbigblock}),
        new Pipe({x: 3216 + 96 * 4, y: 528 - imgbigblock.height * 3, image: imgbigblock}), 

        new Pipe({x: 3216 + 48 * 7, y: 528 - imgbigblock.height * 4 + imgunitblock.height, image: imgunitblock}),
        new Pipe({x: 3216 + 96 * 4, y: 528 - imgbigblock.height * 4, image: imgbigblock}),

        new Pipe({x: 3600 + 48 * 9, y: 576, image: imgbigblock}),
        new Pipe({x: 4080 + 96 * 2 + 48, y: 624, image: imgbigblock}),

        new Pipe({
            x: 4992, 
            y: 624 - imgPipe1.height, 
            image: imgPipe1
        })





    ];

    goombas = [
        new Goomba({ x: 920, y: 624 - 32, image: goombaSpriteSheet, patrolDistance: 120 }),
        new Goomba({ x: 750, y: 624 - 32, image: goombaSpriteSheet, patrolDistance: 120 }),
        new Goomba({ x: 700, y: 624 - 32, image: goombaSpriteSheet, patrolDistance: 120 }),
        new Goomba({ x: 500, y: 624 - 32, image: goombaSpriteSheet, patrolDistance: 120 }),
        new Goomba({ x: 375, y: 624 - 32, image: goombaSpriteSheet, patrolDistance: 120 }),
        new Goomba({ x: 1500, y: 624 - 32, image: goombaSpriteSheet, patrolDistance: 120 }),
        new Goomba({ x: 1520, y: 624 - 32, image: goombaSpriteSheet, patrolDistance: 150 }),
        new Goomba({ x: 1900, y: 624 - 32, image: goombaSpriteSheet, patrolDistance: 200 }),
        new Goomba({ x: 2700, y: 624 - 32, image: goombaSpriteSheet, patrolDistance: 300 })
    ];
}

function intersectsRect(a, b) {
    return (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
    );
}

function canScrollWorld(deltaX) {
    const projectedPlayer = {
        x: player.position.x,
        y: player.position.y,
        width: player.width,
        height: player.height
    };

    for (const pipe of pipes) {
        const projectedPipe = {
            x: pipe.position.x + deltaX,
            y: pipe.position.y,
            width: pipe.width,
            height: pipe.height
        };

        if (intersectsRect(projectedPlayer, projectedPipe)) {
            return false;
        }
    }

    return true;
}

function resolvePipeCollisions() {
    pipes.forEach(pipe => {
        const playerRect = {
            x: player.position.x,
            y: player.position.y,
            width: player.width,
            height: player.height
        };
        const pipeRect = {
            x: pipe.position.x,
            y: pipe.position.y,
            width: pipe.width,
            height: pipe.height
        };

        if (!intersectsRect(playerRect, pipeRect)) return;

        const prevBottom = player.position.y - player.velocity.y + player.height;
        const prevTop = player.position.y - player.velocity.y;
        const prevRight = player.position.x - player.velocity.x + player.width;
        const prevLeft = player.position.x - player.velocity.x;

        const pipeTop = pipe.position.y;
        const pipeBottom = pipe.position.y + pipe.height;
        const pipeLeft = pipe.position.x;
        const pipeRight = pipe.position.x + pipe.width;

        if (prevBottom <= pipeTop && player.position.y + player.height >= pipeTop) {
            player.position.y = pipeTop - player.height;
            player.velocity.y = 0;
            player.isGrounded = true;
            return;
        }

        if (prevTop >= pipeBottom && player.position.y <= pipeBottom) {
            player.position.y = pipeBottom;
            player.velocity.y = 0;
            return;
        }

        if (prevRight <= pipeLeft && player.position.x + player.width >= pipeLeft) {
            player.position.x = pipeLeft - player.width;
            player.velocity.x = 0;
            return;
        }

        if (prevLeft >= pipeRight && player.position.x <= pipeRight) {
            player.position.x = pipeRight;
            player.velocity.x = 0;
        }
    });
}

function resolveGoombaTerrainCollisions() {
    goombas.forEach(goomba => {
        if (goomba.isStomped) return;

        platforms.forEach(platform => {
            if (goomba.position.y + goomba.height <= platform.position.y &&
                goomba.position.y + goomba.height + goomba.velocity.y >= platform.position.y &&
                goomba.position.x + goomba.width >= platform.position.x &&
                goomba.position.x <= platform.position.x + platform.width) {
                goomba.velocity.y = 0;
                goomba.position.y = platform.position.y - goomba.height;
            }
        });

        pipes.forEach(pipe => {
            const goombaRect = {
                x: goomba.position.x,
                y: goomba.position.y,
                width: goomba.width,
                height: goomba.height
            };
            const pipeRect = {
                x: pipe.position.x,
                y: pipe.position.y,
                width: pipe.width,
                height: pipe.height
            };

            if (!intersectsRect(goombaRect, pipeRect)) return;

            const prevBottom = goomba.position.y - goomba.velocity.y + goomba.height;
            const prevTop = goomba.position.y - goomba.velocity.y;
            const prevRight = goomba.position.x - goomba.velocity.x + goomba.width;
            const prevLeft = goomba.position.x - goomba.velocity.x;

            const pipeTop = pipe.position.y;
            const pipeBottom = pipe.position.y + pipe.height;
            const pipeLeft = pipe.position.x;
            const pipeRight = pipe.position.x + pipe.width;

            if (prevBottom <= pipeTop && goomba.position.y + goomba.height >= pipeTop) {
                goomba.position.y = pipeTop - goomba.height;
                goomba.velocity.y = 0;
                return;
            }

            if (prevTop >= pipeBottom && goomba.position.y <= pipeBottom) {
                goomba.position.y = pipeBottom;
                goomba.velocity.y = 0;
                return;
            }

            if (prevRight <= pipeLeft && goomba.position.x + goomba.width >= pipeLeft) {
                goomba.position.x = pipeLeft - goomba.width;
                goomba.reverseDirection();
                return;
            }

            if (prevLeft >= pipeRight && goomba.position.x <= pipeRight) {
                goomba.position.x = pipeRight;
                goomba.reverseDirection();
            }
        });
    });
}

function resolveGoombaPlayerCollisions() {
    goombas.forEach(goomba => {
        if (goomba.isStomped) return;

        const playerRect = {
            x: player.position.x,
            y: player.position.y,
            width: player.width,
            height: player.height
        };
        const goombaRect = {
            x: goomba.position.x,
            y: goomba.position.y,
            width: goomba.width,
            height: goomba.height
        };

        if (!intersectsRect(playerRect, goombaRect)) return;

        const prevBottom = player.position.y - player.velocity.y + player.height;
        const stompedFromTop = prevBottom <= goomba.position.y + 6 && player.velocity.y > 0;

        if (stompedFromTop) {
            goomba.stomp();
            player.velocity.y = -8;
            playSfx(stompSfx);
            return;
        }

        init();
    });

    goombas = goombas.filter(goomba => !goomba.isStomped || goomba.stompTimer > 0);
}

function tryStartGame() {
    loadedAssets += 1;
    if (loadedAssets < requiredAssets.length || gameStarted) return;

    setupLevel();
    init();
    gameStarted = true;
    animate();
}

function init() {
    player.position = {
        x: 100,
        y: 528
    }
    player.velocity = {
        x: 0,
        y: 0
    };
    player.lastDirection = "right";
    player.setAnimation("standRight");
    player.isGrounded = false;
    scrollOffset = 0;

    setupLevel();
}


function animate() {
    requestAnimationFrame(animate);

    if (jumpBufferFrames > 0) jumpBufferFrames -= 1;
    
    genericObjects.forEach(genericObject => {
        genericObject.draw();    
    })
    platforms.forEach(platform => {
        platform.draw();    
    })
    pipes.forEach(pipe => {
        pipe.draw();
    })
    goombas.forEach(goomba => {
        goomba.update();
    })

    if (keys.right.pressed && player.position.x < 400) {
        player.velocity.x = 5;
        player.lastDirection = "right";
    } else if ((keys.left.pressed && player.position.x > 100) || (keys.left.pressed && scrollOffset === 0 && player.position.x > 0)) {
        player.velocity.x = -5;
        player.lastDirection = "left";
    } else {
        player.velocity.x = 0;
        if (keys.right.pressed){
            if (canScrollWorld(-5)) {
                scrollOffset += 5;
                player.lastDirection = "right";
                platforms.forEach(platform => {
                platform.position.x -= 5;  
            })
                pipes.forEach(pipe => {
                    pipe.position.x -= 5;
                })
                goombas.forEach(goomba => {
                    goomba.position.x -= 5;
                    goomba.spawnX -= 5;
                })
                genericObjects.forEach(genericObject => {
                    genericObject.position.x -= 5;
                })
            }
        } else if (keys.left.pressed && scrollOffset > 0) {
            if (canScrollWorld(5)) {
                scrollOffset -= 5;
                player.lastDirection = "left";
                platforms.forEach(platform => {
                    platform.position.x += 5;     
                })
                pipes.forEach(pipe => {
                    pipe.position.x += 5;
                })
                goombas.forEach(goomba => {
                    goomba.position.x += 5;
                    goomba.spawnX += 5;
                })
                genericObjects.forEach(genericObject => {
                    genericObject.position.x += 5; 
                })
            }
        }
    }

    if (keys.right.pressed) {
        player.setAnimation("runRight");
    } else if (keys.left.pressed) {
        player.setAnimation("runLeft");
    } else if (player.lastDirection === "right") {
        player.setAnimation("standRight");
    } else {
        player.setAnimation("standLeft");
    }

    player.isGrounded = false;
    player.update();
    resolvePipeCollisions();
    resolveGoombaTerrainCollisions();
    resolveGoombaPlayerCollisions();

    platforms.forEach(platform => {   
    if (player.position.y + player.height <= platform.position.y &&
        player.position.y + player.height + player.velocity.y >= platform.position.y &&
        player.position.x + player.width >= platform.position.x &&
        player.position.x <= platform.position.x + platform.width) {
            player.velocity.y = 0;
            player.isGrounded = true;
    }})

    if (jumpBufferFrames > 0 && player.isGrounded) {
        player.velocity.y = -10;
        player.isGrounded = false;
        jumpBufferFrames = 0;
        playSfx(jumpSfx);
    }

    if (scrollOffset > 4600) {
        c.fillStyle = "black";
        c.font = "48px Arial";
        c.fillText("You Win!", canvas.width / 2 - 100, canvas.height / 2);
        return;
    }

    if (player.position.y > canvas.height) {
        init();
    }
}

requiredAssets.forEach(asset => {
    if (asset.complete) {
        tryStartGame();
    } else {
        asset.onload = tryStartGame;
    }
});


addEventListener("keydown", (event) => {
    unlockAudio();

    switch (event.key) {
        case "x":
            jumpBufferFrames = JUMP_BUFFER_MAX;
            break;
        case "ArrowLeft":
            keys.left.pressed = true;
            break;
        case "ArrowRight":
            keys.right.pressed = true;
            break;}
    });

addEventListener("keyup", (event) => {
    switch (event.key) {
        case "ArrowLeft":
            keys.left.pressed = false;
            break;
        case "ArrowRight":
            keys.right.pressed = false;
            break;}
    });