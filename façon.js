
        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');

        const gridSize = 20;
        const tileCount = canvas.width / gridSize;

        let snake = [];
        let food = {};
        let obstacles = [];
        let direction = { x: 1, y: 0 };
        let nextDirection = { x: 1, y: 0 };
        let score = 0;
        let level = 1;
        let highScore = localStorage.getItem('snakeHighScore') || 0;
        let gameRunning = false;
        let gamePaused = false;
        let gameLoop = null;

        const characters = ['🐍', '🐲', '🦎', '🐛', '🐞', '🦋', '🐝', '🐜', '🐢', '🦗'];
        let currentCharacterIndex = 0;

        const snakeColors = [
            { body: '#00ff00', head: '#00dd00' },
            { body: '#F6630B', head: '#BAD80A' },
            { body: '#E4F577', head: '#2A8310' },
            { body: '#F03A17', head: '#ff8800' },
            { body: '#E33817', head: '#E33817' },
            { body: '#7C4728', head: '#626262' },
            { body: '#AA801E', head: '#E5E5E5' },
            { body: '#F7630C', head: '#55dddd' },
            { body: '#00ff00', head: '#BAD80A' },
            { body: '#99ff00', head: '#77dd00' }
        ];
        let currentColorIndex = 0;

        document.getElementById('highScore').textContent = highScore;
        document.getElementById('characterEmoji').textContent = characters[0];

        function initSnake() {
            snake = [
                { x: Math.floor(tileCount / 2), y: Math.floor(tileCount / 2) },
                { x: Math.floor(tileCount / 2) - 1, y: Math.floor(tileCount / 2) },
                { x: Math.floor(tileCount / 2) - 2, y: Math.floor(tileCount / 2) }
            ];
            direction = { x: 1, y: 0 };
            nextDirection = { x: 1, y: 0 };
        }

        function generateFood() {
            food = {
                x: Math.floor(Math.random() * tileCount),
                y: Math.floor(Math.random() * tileCount)
            };

            for (let segment of snake) {
                if (segment.x === food.x && segment.y === food.y) {
                    generateFood();
                    return;
                }
            }
        }

        function generateObstacles() {
            obstacles = [];
            const obstacleCount = Math.min(1 + Math.floor(level / 2), 4);

            for (let i = 0; i < obstacleCount; i++) {
                obstacles.push({
                    x: Math.floor(Math.random() * tileCount),
                    y: -5 - i * 8,
                    width: 2,
                    height: 2,
                    speed: 0.5 + (level * 0.1)
                });
            }
        }

        function draw() {
            ctx.fillStyle = '#1a1a2e';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.strokeStyle = 'rgba(0, 212, 255, 0.1)';
            ctx.lineWidth = 1;
            for (let i = 0; i <= tileCount; i++) {
                ctx.beginPath();
                ctx.moveTo(i * gridSize, 0);
                ctx.lineTo(i * gridSize, canvas.height);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(0, i * gridSize);
                ctx.lineTo(canvas.width, i * gridSize);
                ctx.stroke();
            }

            ctx.fillStyle = '#ff4444';
            ctx.beginPath();
            ctx.arc(
                food.x * gridSize + gridSize / 2,
                food.y * gridSize + gridSize / 2,
                gridSize / 2 - 2,
                0,
                Math.PI * 2
            );
            ctx.fill();

            const colors = snakeColors[currentColorIndex];
            snake.forEach((segment, index) => {
                if (index === 0) {
                    ctx.fillStyle = colors.head;
                    ctx.shadowColor = colors.head;
                    ctx.shadowBlur = 10;
                } else {
                    ctx.fillStyle = colors.body;
                    ctx.shadowColor = 'rgba(0, 0, 0, 0)';
                }

                ctx.fillRect(
                    segment.x * gridSize + 1,
                    segment.y * gridSize + 1,
                    gridSize - 2,
                    gridSize - 2
                );

                if (index === 0) {
                    ctx.fillStyle = '#fff';
                    ctx.fillRect(segment.x * gridSize + 4, segment.y * gridSize + 4, 4, 4);
                    ctx.fillRect(segment.x * gridSize + 12, segment.y * gridSize + 4, 4, 4);
                }
            });

            ctx.fillStyle = '#ffdd00';
            ctx.shadowColor = '#ffdd00';
            ctx.shadowBlur = 8;
            obstacles.forEach(obs => {
                ctx.fillRect(
                    obs.x * gridSize,
                    obs.y * gridSize,
                    obs.width * gridSize,
                    obs.height * gridSize
                );
            });
            ctx.shadowBlur = 0;
        }

        function update() {
            if (gamePaused) return;

            direction = nextDirection;

            const head = {
                x: snake[0].x + direction.x,
                y: snake[0].y + direction.y
            };

            if (head.x < 0) head.x = tileCount - 1;
            else if (head.x >= tileCount) head.x = 0;
            if (head.y < 0) head.y = tileCount - 1;
            else if (head.y >= tileCount) head.y = 0;

            for (let segment of snake) {
                if (head.x === segment.x && head.y === segment.y) {
                    endGame();
                    return;
                }
            }

            for (let obs of obstacles) {
                if (head.x === Math.floor(obs.x) && head.y === Math.floor(obs.y)) {
                    endGame();
                    return;
                }
            }

            snake.unshift(head);

            if (head.x === food.x && head.y === food.y) {
                score += 10 * level;
                document.getElementById('score').textContent = score;

                if (score % 100 === 0 && score > 0) {
                    level++;
                    document.getElementById('level').textContent = level;
                    generateObstacles();
                }

                generateFood();
            } else {
                snake.pop();
            }

            obstacles.forEach(obs => {
                obs.y += obs.speed;
                if (obs.y > tileCount) {
                    obs.y = -5;
                    obs.x = Math.floor(Math.random() * tileCount);
                }
            });
        }

        function endGame() {
            gameRunning = false;
            clearInterval(gameLoop);

            if (score > highScore) {
                highScore = score;
                localStorage.setItem('snakeHighScore', highScore);
                document.getElementById('highScore').textContent = highScore;
            }

            document.getElementById('finalScore').textContent = score;
            document.getElementById('bestScore').textContent = highScore;
            document.getElementById('levelReached').textContent = level;

            const modal = document.getElementById('gameOverModal');
            const content = document.getElementById('modalContent');

            if (score > highScore * 0.8) {
                content.classList.remove('lose');
                document.getElementById('modalTitle').textContent = 'YOU WIN!';
            } else {
                content.classList.add('lose');
                document.getElementById('modalTitle').textContent = 'GAME OVER';
            }

            modal.classList.add('active');
        }

        function startGame() {
            if (gameRunning) return;

            initSnake();
            generateFood();
            generateObstacles();
            score = 0;
            level = 1;
            document.getElementById('score').textContent = score;
            document.getElementById('level').textContent = level;
            document.getElementById('gameStatus').textContent = 'Game Running';
            gameRunning = true;
            gamePaused = false;
            document.getElementById('startBtn').textContent = 'RESUME';
            document.getElementById('pauseBtn').textContent = 'PAUSE';

            gameLoop = setInterval(() => {
                update();
                draw();
            }, 100 - (level * 5));
        }

        function pauseGame() {
            if (!gameRunning) return;
            gamePaused = !gamePaused;
            document.getElementById('gameStatus').textContent = gamePaused ? 'Paused' : 'Game Running';
            document.getElementById('pauseBtn').textContent = gamePaused ? 'RESUME' : 'PAUSE';
        }

        function resetGame() {
            gameRunning = false;
            gamePaused = false;
            clearInterval(gameLoop);
            initSnake();
            score = 0;
            level = 1;
            document.getElementById('score').textContent = score;
            document.getElementById('level').textContent = level;
            document.getElementById('gameStatus').textContent = 'Ready to Start';
            document.getElementById('startBtn').textContent = 'START GAME';
            document.getElementById('pauseBtn').textContent = 'PAUSE';
            obstacles = [];
            generateFood();
            draw();
        }

        function changeCharacter() {
            currentCharacterIndex = (currentCharacterIndex + 1) % characters.length;
            currentColorIndex = (currentColorIndex + 1) % snakeColors.length;
            document.getElementById('characterEmoji').textContent = characters[currentCharacterIndex];

            if (!gameRunning) {
                draw();
            }
        }

        document.addEventListener('keydown', (e) => {
            if (!gameRunning) return;

            switch (e.key.toLowerCase()) {
                case 'arrowup':
                case 'w':
                    if (direction.y !== 1) {
                        nextDirection = { x: 0, y: -1 };
                        e.preventDefault();
                    }
                    break;
                case 'arrowdown':
                case 's':
                    if (direction.y !== -1) {
                        nextDirection = { x: 0, y: 1 };
                        e.preventDefault();
                    }
                    break;
                case 'arrowleft':
                case 'a':
                    if (direction.x !== 1) {
                        nextDirection = { x: -1, y: 0 };
                        e.preventDefault();
                    }
                    break;
                case 'arrowright':
                case 'd':
                    if (direction.x !== -1) {
                        nextDirection = { x: 1, y: 0 };
                        e.preventDefault();
                    }
                    break;
                case ' ':
                    pauseGame();
                    e.preventDefault();
                    break;
            }
        });

        document.getElementById('startBtn').addEventListener('click', startGame);
        document.getElementById('pauseBtn').addEventListener('click', pauseGame);
        document.getElementById('resetBtn').addEventListener('click', resetGame);
        document.getElementById('changeCharacterBtn').addEventListener('click', changeCharacter);
        document.getElementById('playAgainBtn').addEventListener('click', () => {
            document.getElementById('gameOverModal').classList.remove('active');
            startGame();
        });
        document.getElementById('closeModalBtn').addEventListener('click', () => {
            document.getElementById('gameOverModal').classList.remove('active');
        });

        initSnake();
        generateFood();
        generateObstacles();
        draw();
