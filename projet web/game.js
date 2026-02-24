const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const UI = {
  coinCounter: document.getElementById("coinCounter"),
  winOverlay: document.getElementById("winOverlay")
};

const CONFIG = {
  gravity: 0.7,
  jumpPower: 17,
  moveSpeed: 5,
  maxFallSpeed: 18,
  canvasWidth: 1150,
  canvasHeight: 770
};

const world = {
  width: 3000,
  height: CONFIG.canvasHeight,
  cameraX: 0
};

const input = {
  left: false,
  right: false,
  jumpPressed: false
};

const state = {
  won: false,
  coinScore: 0
};

const spawnPoint = { x: 90, y: 560 };

const player = {
  x: spawnPoint.x,
  y: spawnPoint.y,
  width: 56,
  height: 64,
  vx: 0,
  vy: 0,
  onGround: false,
  facing: 1,
  state: "idle"
};

const platforms = [
  { x: 0, y: 700, width: 900, height: 70 },
  { x: 980, y: 700, width: 520, height: 70 },
  { x: 1600, y: 700, width: 460, height: 70 },
  { x: 2140, y: 700, width: 860, height: 70 },
  { x: 330, y: 560, width: 220, height: 20 },
  { x: 660, y: 490, width: 210, height: 20 },
  { x: 980, y: 430, width: 220, height: 20 },
  { x: 1340, y: 520, width: 210, height: 20 },
  { x: 1720, y: 470, width: 220, height: 20 },
  { x: 2060, y: 410, width: 230, height: 20 }
];

const coinBlueprint = [
  { x: 380, y: 515, size: 20 },
  { x: 730, y: 445, size: 20 },
  { x: 1060, y: 385, size: 20 },
  { x: 1410, y: 475, size: 20 },
  { x: 1780, y: 425, size: 20 },
  { x: 2140, y: 365, size: 20 },
  { x: 2460, y: 650, size: 20 },
  { x: 2820, y: 650, size: 20 }
];

let coins = [];
let coinPickupEffects = [];
let floatingTexts = [];

const door = {
  x: 2880,
  y: 624,
  width: 64,
  height: 76,
  open: false
};

const obstacles = [
  { x: 560, y: 680, width: 80, height: 20 },
  { x: 1210, y: 680, width: 90, height: 20 },
  { x: 1950, y: 680, width: 90, height: 20 },
  { x: 2320, y: 680, width: 90, height: 20 }
];

function setup() {
  canvas.width = CONFIG.canvasWidth;
  canvas.height = CONFIG.canvasHeight;
  setupInput();
  resetLevel();
}

function setupInput() {
  document.addEventListener("keydown", (event) => {
    if (event.code === "ArrowRight" || event.code === "KeyD") input.right = true;
    if (event.code === "ArrowLeft" || event.code === "KeyA") input.left = true;
    if (event.code === "ArrowUp" || event.code === "Space" || event.code === "KeyW") {
      input.jumpPressed = true;
    }
  });

  document.addEventListener("keyup", (event) => {
    if (event.code === "ArrowRight" || event.code === "KeyD") input.right = false;
    if (event.code === "ArrowLeft" || event.code === "KeyA") input.left = false;
  });

  canvas.addEventListener("click", (event) => {
    if (!door.open || state.won) return;
    const rect = canvas.getBoundingClientRect();
    const worldX = event.clientX - rect.left + world.cameraX;
    const worldY = event.clientY - rect.top;
    if (pointInRect(worldX, worldY, door)) {
      triggerWin();
    }
  });
}

function resetLevel() {
  player.x = spawnPoint.x;
  player.y = spawnPoint.y;
  player.vx = 0;
  player.vy = 0;
  player.onGround = false;
  player.state = "idle";

  coins = coinBlueprint.map((coin) => ({
    ...coin,
    width: coin.size,
    height: coin.size,
    collected: false
  }));
  coinPickupEffects = [];
  floatingTexts = [];
  state.won = false;
  state.coinScore = 0;
  door.open = false;
  if (UI.winOverlay) UI.winOverlay.classList.remove("show");
  updateCoinCounter();
}

function respawnAfterHit() {
  resetLevel();
  world.cameraX = 0;
}

function update() {
  if (state.won) return;

  player.vx = 0;
  if (input.left) {
    player.vx = -CONFIG.moveSpeed;
    player.facing = -1;
  }
  if (input.right) {
    player.vx = CONFIG.moveSpeed;
    player.facing = 1;
  }

  if (input.jumpPressed && player.onGround) {
    player.vy = -CONFIG.jumpPower;
    player.onGround = false;
  }
  input.jumpPressed = false;

  player.vy += CONFIG.gravity;
  if (player.vy > CONFIG.maxFallSpeed) player.vy = CONFIG.maxFallSpeed;

  moveAndCollide();
  updatePlayerState();
  collectCoins();
  updateCoinAnimations();
  updateDoorState();
  checkHazards();
  checkWin();
  updateCamera();
}

function moveAndCollide() {
  player.x += player.vx;
  resolveHorizontalCollisions();

  player.y += player.vy;
  resolveVerticalCollisions();

  if (player.x < 0) player.x = 0;
  if (player.x + player.width > world.width) player.x = world.width - player.width;

  if (player.y > world.height + 300) respawnAfterHit();
}

function resolveHorizontalCollisions() {
  for (const p of platforms) {
    if (!rectIntersect(player, p)) continue;
    if (player.vx > 0) player.x = p.x - player.width;
    if (player.vx < 0) player.x = p.x + p.width;
  }
}

function resolveVerticalCollisions() {
  player.onGround = false;
  for (const p of platforms) {
    if (!rectIntersect(player, p)) continue;
    if (player.vy > 0) {
      player.y = p.y - player.height;
      player.vy = 0;
      player.onGround = true;
    } else if (player.vy < 0) {
      player.y = p.y + p.height;
      player.vy = 0;
    }
  }
}

function updatePlayerState() {
  if (!player.onGround && player.vy > 0.3) {
    player.state = "fall";
    return;
  }
  if (!player.onGround && player.vy < -0.3) {
    player.state = "jump";
    return;
  }
  if (Math.abs(player.vx) > 0.1) {
    player.state = "run";
    return;
  }
  player.state = "idle";
}

function collectCoins() {
  for (const coin of coins) {
    if (coin.collected) continue;
    if (rectIntersect(player, coin)) {
      coin.collected = true;
      state.coinScore += 1;
      createCoinPickupEffects(coin);
      updateCoinCounter();
    }
  }
}

function updateDoorState() {
  door.open = state.coinScore === coins.length;
}

function checkHazards() {
  for (const obstacle of obstacles) {
    if (rectIntersect(player, obstacle)) {
      respawnAfterHit();
      return;
    }
  }
}

function checkWin() {
  if (door.open && rectIntersect(player, door)) {
    triggerWin();
  }
}

function updateCamera() {
  const targetX = player.x + player.width * 0.5 - canvas.width * 0.5;
  world.cameraX = clamp(targetX, 0, world.width - canvas.width);
}

function draw() {
  drawBackground();
  ctx.save();
  ctx.translate(-world.cameraX, 0);

  drawPlatforms();
  drawCoins();
  drawCoinPickupEffects();
  drawFloatingTexts();
  drawObstacles();
  drawDoor();
  drawPlayer();

  ctx.restore();
  if (state.won) drawVictoryMessage();
}

function drawBackground() {
  const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
  sky.addColorStop(0, "#74c3ff");
  sky.addColorStop(1, "#c9efff");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.fillRect(120, 80, 140, 26);
  ctx.fillRect(480, 120, 180, 30);
  ctx.fillRect(820, 65, 150, 24);
}

function drawPlatforms() {
  for (const p of platforms) {
    ctx.fillStyle = p.y > 650 ? "#4d8f3a" : "#5da63e";
    ctx.fillRect(p.x, p.y, p.width, p.height);
    ctx.fillStyle = "#3a6d29";
    ctx.fillRect(p.x, p.y, p.width, 6);
  }
}

function drawCoins() {
  for (const coin of coins) {
    if (coin.collected) continue;
    const cx = coin.x + coin.size * 0.5;
    const cy = coin.y + coin.size * 0.5;
    const r = coin.size * 0.5;
    ctx.beginPath();
    ctx.fillStyle = "#ffd84d";
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.fillStyle = "#ffef9c";
    ctx.arc(cx - 3, cy - 3, r * 0.35, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawDoor() {
  if (door.open) {
    const pulse = 0.5 + Math.sin(Date.now() * 0.01) * 0.5;
    ctx.fillStyle = `rgba(57,166,255,${0.25 + pulse * 0.25})`;
    ctx.fillRect(door.x - 6, door.y - 6, door.width + 12, door.height + 12);
  }

  ctx.fillStyle = door.open ? "#39a6ff" : "#7b5b36";
  ctx.fillRect(door.x, door.y, door.width, door.height);
  ctx.fillStyle = door.open ? "#d9f3ff" : "#9a7a4d";
  ctx.fillRect(door.x + 8, door.y + 10, door.width - 16, door.height - 14);

  if (door.open) {
    ctx.fillStyle = "#1f5f94";
    ctx.fillRect(door.x + 20, door.y + 12, 10, door.height - 24);
  }

  ctx.fillStyle = door.open ? "#f2ff7a" : "#3b2b1a";
  ctx.fillRect(door.x + door.width - 14, door.y + door.height * 0.5, 5, 5);
}

function drawObstacles() {
  for (const spike of obstacles) {
    const steps = Math.floor(spike.width / 20);
    for (let i = 0; i < steps; i += 1) {
      const x = spike.x + i * 20;
      ctx.beginPath();
      ctx.moveTo(x, spike.y + spike.height);
      ctx.lineTo(x + 10, spike.y);
      ctx.lineTo(x + 20, spike.y + spike.height);
      ctx.closePath();
      ctx.fillStyle = "#b81f1f";
      ctx.fill();
      ctx.strokeStyle = "#7f0f0f";
      ctx.stroke();
    }
  }
}

function drawPlayer() {
  const x = player.x;
  const y = player.y;

  const bodyColor = player.state === "fall" ? "#ef8f35" : "#f39c3f";
  ctx.fillStyle = bodyColor;
  ctx.fillRect(x + 8, y + 16, 40, 42);

  ctx.fillStyle = "#f7b25d";
  ctx.fillRect(x + 10, y + 6, 36, 18);

  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(x + 22, y + 18, 4, 0, Math.PI * 2);
  ctx.arc(x + 34, y + 18, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#111111";
  ctx.beginPath();
  ctx.arc(x + 22, y + 18, 1.5, 0, Math.PI * 2);
  ctx.arc(x + 34, y + 18, 1.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.moveTo(x + 20, y + 28);
  ctx.lineTo(x + 28, y + 24);
  ctx.lineTo(x + 36, y + 28);
  ctx.closePath();
  ctx.fill();

  const tailY = y + 30 + (player.state === "run" ? Math.sin(Date.now() * 0.02) * 3 : 0);
  ctx.fillStyle = "#d87728";
  if (player.facing > 0) {
    ctx.fillRect(x - 12, tailY, 12, 10);
  } else {
    ctx.fillRect(x + player.width, tailY, 12, 10);
  }
}

function updateCoinCounter() {
  if (UI.coinCounter) {
    UI.coinCounter.textContent = `Coins: ${state.coinScore} / ${coins.length}`;
  }
}

function gameLoop() {
  update();
  draw();
  if (state.won) return;
  requestAnimationFrame(gameLoop);
}

function createCoinPickupEffects(coin) {
  const centerX = coin.x + coin.size * 0.5;
  const centerY = coin.y + coin.size * 0.5;

  coinPickupEffects.push({
    x: centerX,
    y: centerY,
    startSize: coin.size,
    life: 18,
    maxLife: 18
  });

  floatingTexts.push({
    x: centerX,
    y: coin.y,
    vy: -1.2,
    text: "+1",
    life: 36,
    maxLife: 36
  });
}

function updateCoinAnimations() {
  for (let i = coinPickupEffects.length - 1; i >= 0; i -= 1) {
    coinPickupEffects[i].life -= 1;
    if (coinPickupEffects[i].life <= 0) {
      coinPickupEffects.splice(i, 1);
    }
  }

  for (let i = floatingTexts.length - 1; i >= 0; i -= 1) {
    const textFx = floatingTexts[i];
    textFx.y += textFx.vy;
    textFx.life -= 1;
    if (textFx.life <= 0) {
      floatingTexts.splice(i, 1);
    }
  }
}

function drawCoinPickupEffects() {
  for (const fx of coinPickupEffects) {
    const t = 1 - fx.life / fx.maxLife;
    const scale = 1 - t * 0.75;
    const alpha = 1 - t;
    const size = fx.startSize * scale;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "#ffd84d";
    ctx.beginPath();
    ctx.arc(fx.x, fx.y, size * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawFloatingTexts() {
  for (const fx of floatingTexts) {
    const alpha = Math.max(0, fx.life / fx.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "#fff2a8";
    ctx.font = "bold 18px Segoe UI";
    ctx.textAlign = "center";
    ctx.fillText(fx.text, fx.x, fx.y);
    ctx.restore();
  }
}

function drawVictoryMessage() {
  ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 62px Segoe UI";
  ctx.textAlign = "center";
  ctx.fillText("You Win!", canvas.width * 0.5, canvas.height * 0.5);
}

function triggerWin() {
  state.won = true;
  if (UI.winOverlay) UI.winOverlay.classList.add("show");
}

function rectIntersect(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function pointInRect(x, y, rect) {
  return x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height;
}

setup();
requestAnimationFrame(gameLoop);
