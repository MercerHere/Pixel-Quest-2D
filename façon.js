// Variables du jeu
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('highScore');
const snakeFaceElement = document.getElementById('snakeFace');
const startBtn = document.getElementById('startBtn');
const colorBtn = document.getElementById('colorBtn');
const resetBtn = document.getElementById('resetBtn');

// Paramètres
const gridSize = 20;
const tileCount = canvas.width / gridSize;

// Couleurs disponibles pour le serpent
const snakeColors = [
    { body: '#00ff00', head: '#00cc00' },
    { body: '#ff0000', head: '#cc0000' },
    { body: '#0000ff', head: '#0000cc' },
    { body: '#ffff00', head: '#cccc00' },
    { body: '#ff00ff', head: '#cc00cc' },
    { body: '#00ffff', head: '#00cccc' },
    { body: '#ff6600', head: '#cc5200' },
    { body: '#66ff66', head: '#52cc52' },
    { body: '#ff1493', head: '#cc1077' },
    { body: '#00ced1', head: '#00a8a9' }
];

// Visages/émojis disponibles
const snakeFaces = ['🐍', '🐲', '🦎', '🐛', '🐞', '🦋', '🐝', '🐜'];

let currentColorIndex = 0;
let currentFaceIndex = 0;
let snake = [];
let food = {};
let direction = { x: 1, y: 0 };
let nextDirection = { x: 1, y: 0 };
let score = 0;
let highScore = localStorage.getItem('snakeHighScore') || 0;
let gameLoop = null;
let gameRunning = false;

// Initialisation
highScoreElement.textContent = highScore;

// Initialiser le serpent
function initSnake() {
    snake = [
        { x: 10, y: 10 },
        { x: 9, y: 10 },
        { x: 8, y: 10 }
    ];
    direction = { x: 1, y: 0 };
    nextDirection = { x: 1, y: 0 };
}

// Générer la nourriture
function generateFood() {
    food = {
        x: Math.floor(Math.random() * tileCount),
        y: Math.floor(Math.random() * tileCount)
    };
    
    // Vérifier que la nourriture n'est pas sur le serpent
    for (let segment of snake) {
        if (segment.x === food.x && segment.y === food.y) {
            generateFood();
            break;
        }
    }
}

// Dessiner le jeu
function draw() {
    // Fond
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grille
    ctx.strokeStyle = '#1a1a1a';
    for (let i = 0; i < tileCount; i++) {
        ctx.beginPath();
        ctx.moveTo(i * gridSize, 0);
        ctx.lineTo(i * gridSize, canvas.height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * gridSize);
        ctx.lineTo(canvas.width, i * gridSize);
        ctx.stroke();
    }

    // Nourriture
    ctx.fillStyle = '#ff0000';
    ctx.beginPath();
    ctx.arc(
        food.x * gridSize + gridSize/2,
        food.y * gridSize + gridSize/2,
        gridSize/2 - 2,
        0,
        Math.PI * 2
    );
    ctx.fill();

    // Serpent
    const colors = snakeColors[currentColorIndex];
    snake.forEach((segment, index) => {
        if (index === 0) {
            ctx.fillStyle = colors.head;
        } else {
            ctx.fillStyle = colors.body;
        }
        
        ctx.fillRect(
            segment.x * gridSize + 1,
            segment.y * gridSize + 1,
            gridSize - 2,
            gridSize - 2
        );
        
        // Yeux pour la tête
        if (index === 0) {
            ctx.fillStyle = '#fff';
            ctx.fillRect(
                segment.x * gridSize + 4,
                segment.y * gridSize + 4,
                4,
                4
            );
            ctx.fillRect(
                segment.x * gridSize + 12,
                segment.y * gridSize + 4,
                4,
                4
            );
        }
    });
}

// Mettre à jour le jeu
function update() {
    direction = nextDirection;
    
    const head = {
        x: snake[0].x + direction.x,
        y: snake[0].y + direction.y
    };

    // 🔄 TRAVERSÉE DES MURS - Le serpent apparaît du côté opposé
    if (head.x < 0) {
        head.x = tileCount - 1;
    } else if (head.x >= tileCount) {
        head.x = 0;
    }
    
    if (head.y < 0) {
        head.y = tileCount - 1;
    } else if (head.y >= tileCount) {
        head.y = 0;
    }

    // Vérifier les collisions avec le serpent (pas avec les murs)
    for (let segment of snake) {
        if (head.x === segment.x && head.y === segment.y) {
            gameOver();
            return;
        }
    }

    snake.unshift(head);

    // Vérifier si le serpent mange la nourriture
    if (head.x === food.x && head.y === food.y) {
        score += 10;
        scoreElement.textContent = score;
        generateFood();
    } else {
        snake.pop();
    }
}

// Game Over
function gameOver() {
    gameRunning = false;
    clearInterval(gameLoop);
    
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('snakeHighScore', highScore);
        highScoreElement.textContent = highScore;
    }
    
    startBtn.textContent = '▶️ Rejouer';
    
    // Afficher message Game Over
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 40px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width/2, canvas.height/2);
    ctx.font = '20px Arial';
    ctx.fillText(`Score: ${score}`, canvas.width/2, canvas.height/2 + 40);
}

// Démarrer le jeu
function startGame() {
    if (gameRunning) return;
    
    initSnake();
    generateFood();
    score = 0;
    scoreElement.textContent = score;
    gameRunning = true;
    startBtn.textContent = '⏸️ En cours';
    
    gameLoop = setInterval(() => {
        update();
        draw();
    }, 100);
}

// Changer la couleur et le visage
function changeColor() {
    currentColorIndex = (currentColorIndex + 1) % snakeColors.length;
    currentFaceIndex = (currentFaceIndex + 1) % snakeFaces.length;
    snakeFaceElement.textContent = snakeFaces[currentFaceIndex];
    
    // Effet visuel
    colorBtn.style.transform = 'scale(0.95)';
    setTimeout(() => {
        colorBtn.style.transform = 'scale(1)';
    }, 100);
    
    // Mettre à jour l'affichage si le jeu est en pause
    if (!gameRunning) {
        draw();
    }
}

// Réinitialiser
function resetGame() {
    gameRunning = false;
    clearInterval(gameLoop);
    initSnake();
    score = 0;
    scoreElement.textContent = score;
    startBtn.textContent = '▶️ Démarrer';
    draw();
}

// Contrôles clavier
document.addEventListener('keydown', (e) => {
    if (!gameRunning) return;
    
    switch(e.key) {
        case 'ArrowUp':
            if (direction.y !== 1) nextDirection = { x: 0, y: -1 };
            break;
        case 'ArrowDown':
            if (direction.y !== -1) nextDirection = { x: 0, y: 1 };
            break;
        case 'ArrowLeft':
            if (direction.x !== 1) nextDirection = { x: -1, y: 0 };
            break;
        case 'ArrowRight':
            if (direction.x !== -1) nextDirection = { x: 1, y: 0 };
            break;
    }
});

// Événements boutons
startBtn.addEventListener('click', startGame);
colorBtn.addEventListener('click', changeColor);
resetBtn.addEventListener('click', resetGame);

// Dessin initial
initSnake();
generateFood();
draw();

console.log('✅ Jeu Snake chargé avec traversée de murs !');