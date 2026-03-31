const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const CONFIG = {
  gravity: 0.7, jumpPower: 17, moveSpeed: 4,
  maxFallSpeed: 18, canvasWidth: 1150, canvasHeight: 770
};

const state = { won: false, currentLevelIndex: 0, gameFinished: false };

const LEVELS = [
  {

    spawn: { x: 90, y: 560 },
    worldWidth: 2500,
    platforms: [
      { x: 0, y: 700, width: 900, height: 70 },
      { x: 1000, y: 650, width: 400, height: 50 },
      { x: 1500, y: 550, width: 300, height: 20 },
      { x: 1900, y: 700, width: 600, height: 70 },
      { x: 400, y: 550, width: 200, height: 20 }
    ],
    obstacles: [
      { x: 600, y: 680, width: 80, height: 20, type: "fire", axis: "x", range: 100, speed: 0.04, phase: 0 },
      { x: 1600, y: 450, width: 46, height: 28, type: "drone", axis: "y", range: 80, speed: 0.05, phase: 0 }
    ],
    door: { x: 2300, y: 624, width: 64, height: 76 }
  },
  {
    spawn: { x: 50, y: 600 },
    worldWidth: 3000,
    platforms: [
      { x: 0, y: 700, width: 300, height: 70 },
      { x: 350, y: 580, width: 120, height: 20 }, 
      { x: 550, y: 450, width: 120, height: 20 }, 
      { x: 800, y: 550, width: 100, height: 20 }, 
      { x: 1050, y: 420, width: 120, height: 20 },
      { x: 1350, y: 550, width: 100, height: 20 },
      { x: 1650, y: 650, width: 400, height: 50 },
      { x: 2150, y: 700, width: 850, height: 70 }
    ],
    obstacles: [
      { x: 400, y: 400, width: 40, height: 40, type: "drone", axis: "y", range: 120, speed: 0.07, phase: 0 },
      { x: 900, y: 680, width: 600, height: 20, type: "fire", axis: "none" }, 
      { x: 1700, y: 630, width: 100, height: 20, type: "fire", axis: "x", range: 150, speed: 0.05, phase: 0 }
    ],
    door: { x: 2850, y: 624, width: 64, height: 76 }
  }
];

let currentLevel = null;
let world = { cameraX: 0 };
let input = { left: false, right: false, jump: false };
const player = { x: 0, y: 0, width: 56, height: 64, vx: 0, vy: 0, onGround: false, facing: 1, state: "idle" };


function loadLevel(index) {
  if (index >= LEVELS.length) { state.gameFinished = true; return; }
  state.currentLevelIndex = index;
  currentLevel = JSON.parse(JSON.stringify(LEVELS[index]));
  player.x = currentLevel.spawn.x; player.y = currentLevel.spawn.y;
  player.vx = 0; player.vy = 0; player.onGround = false;
  world.cameraX = 0; state.won = false;
}

function setupInput() {
  window.onkeydown = (e) => {
    if (e.code === "ArrowRight" || e.code === "KeyD") input.right = true;
    if (e.code === "ArrowLeft" || e.code === "KeyA") input.left = true;
    if ((e.code === "Space" || e.code === "ArrowUp") && player.onGround) player.vy = -CONFIG.jumpPower;
  };
  window.onkeyup = (e) => {
    if (e.code === "ArrowRight" || e.code === "KeyD") input.right = false;
    if (e.code === "ArrowLeft" || e.code === "KeyA") input.left = false;
  };
}

function update() {
  if (state.won || state.gameFinished) return;
  player.vx = (input.right - input.left) * CONFIG.moveSpeed;
  if (player.vx !== 0) player.facing = player.vx > 0 ? 1 : -1;
  player.vy += CONFIG.gravity;
  player.x += player.vx;
  currentLevel.platforms.forEach(p => {
    if (rectIntersect(player, p)) {
      if (player.vx > 0) player.x = p.x - player.width;
      if (player.vx < 0) player.x = p.x + p.width;
    }
  });
  player.y += player.vy;
  player.onGround = false;
  currentLevel.platforms.forEach(p => {
    if (rectIntersect(player, p)) {
      if (player.vy > 0) { player.y = p.y - player.height; player.vy = 0; player.onGround = true; }
      else if (player.vy < 0) { player.y = p.y + p.height; player.vy = 0; }
    }
  });
  if (player.y > CONFIG.canvasHeight) loadLevel(state.currentLevelIndex);
  currentLevel.obstacles.forEach(o => {
    let t = Date.now() * 0.01;
    if (o.axis === "x") o.x = (o.baseX || (o.baseX = o.x)) + Math.sin(t * o.speed + o.phase) * o.range;
    if (o.axis === "y") o.y = (o.baseY || (o.baseY = o.y)) + Math.sin(t * o.speed + o.phase) * o.range;
    if (rectIntersect(player, o)) loadLevel(state.currentLevelIndex);
  });
  world.cameraX = Math.max(0, Math.min(player.x - CONFIG.canvasWidth / 2, currentLevel.worldWidth - CONFIG.canvasWidth));
  if (rectIntersect(player, currentLevel.door)) {
    state.won = true;
    setTimeout(() => loadLevel(state.currentLevelIndex + 1), 1000);
  }
}

function draw() {
  ctx.clearRect(0, 0, CONFIG.canvasWidth, CONFIG.canvasHeight);
  const sky = ctx.createLinearGradient(0, 0, 0, CONFIG.canvasHeight);
  sky.addColorStop(0, "#74c3ff"); sky.addColorStop(1, "#c9efff");
  ctx.fillStyle = sky; ctx.fillRect(0, 0, CONFIG.canvasWidth, CONFIG.canvasHeight);
  ctx.save(); ctx.translate(-world.cameraX, 0);
  ctx.fillStyle = "#5da63e";
  currentLevel.platforms.forEach(p => {
      ctx.fillRect(p.x, p.y, p.width, p.height);
      ctx.fillStyle = "#3a6d29"; ctx.fillRect(p.x, p.y, p.width, 5); ctx.fillStyle = "#5da63e";
  });
  ctx.fillStyle = "#39a6ff"; ctx.fillRect(currentLevel.door.x, currentLevel.door.y, 64, 76);
  ctx.fillStyle = "#f2ff7a"; ctx.fillRect(currentLevel.door.x + 50, currentLevel.door.y + 35, 5, 5);
  currentLevel.obstacles.forEach(o => {
    ctx.fillStyle = o.type === "drone" ? "#3a455c" : "#ff4400";
    ctx.fillRect(o.x, o.y, o.width, o.height);
  });
  const { x, y, facing } = player;
  ctx.fillStyle = "#f39c3f"; ctx.fillRect(x + 8, y + 16, 40, 42); 
  ctx.fillStyle = "#f7b25d"; ctx.fillRect(x + 10, y + 6, 36, 18);
  ctx.fillStyle = "white"; ctx.beginPath(); ctx.arc(x+22, y+18, 4, 0, 7); ctx.arc(x+34, y+18, 4, 0, 7); ctx.fill();
  ctx.fillStyle = "#d87728"; if (facing > 0) ctx.fillRect(x - 12, y + 35, 12, 10); else ctx.fillRect(x + 56, y + 35, 12, 10);
  ctx.restore();

  if (state.won) {
    ctx.fillStyle = "rgba(0,255,0,0.3)"; ctx.fillRect(0,0,CONFIG.canvasWidth,CONFIG.canvasHeight);
    ctx.fillStyle = "black"; ctx.font = "bold 50px Arial"; ctx.textAlign = "center";
    ctx.fillText("LEVEL CLEAR!", CONFIG.canvasWidth/2, CONFIG.canvasHeight/2);
  }
  if (state.gameFinished) {
    ctx.fillStyle = "rgba(0,0,0,0.7)"; ctx.fillRect(0,0,CONFIG.canvasWidth,CONFIG.canvasHeight);
    ctx.fillStyle = "white"; ctx.font = "bold 60px Arial"; ctx.textAlign = "center";
    ctx.fillText("YOU ARE THE CHAMPION!", CONFIG.canvasWidth/2, CONFIG.canvasHeight/2);
  }
}

function rectIntersect(a, b) { return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y; }
function loop() { update(); draw(); requestAnimationFrame(loop); }
canvas.width = CONFIG.canvasWidth; canvas.height = CONFIG.canvasHeight;
setupInput(); loadLevel(0); loop();