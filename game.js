const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const startButton = document.getElementById('startButton');
const restartButton = document.getElementById('restartButton');
const scoreDisplay = document.getElementById('scoreDisplay');
const scoreElement = document.getElementById('score');
const finalScoreElement = document.getElementById('finalScore');

// Configurar canvas a pantalla completa
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Variables del juego
let gameState = 'start'; // 'start', 'playing', 'gameover'
let score = 0;
let gameSpeed = 2;

// Personaje
const player = {
    x: canvas.width / 2,
    y: canvas.height - 100,
    width: 60,
    height: 60,
    speed: 8,
    color: '#FF6B6B'
};

// Gallinas
const chickens = [];
const chickenSpawnRate = 0.02;
const chickenSpeed = 3;

// Controles
const keys = {};

document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Dibujar personaje
function drawPlayer() {
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.arc(player.x + player.width / 2, player.y + player.height / 2, player.width / 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Ojos
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(player.x + player.width / 2 - 10, player.y + player.height / 2 - 5, 5, 0, Math.PI * 2);
    ctx.arc(player.x + player.width / 2 + 10, player.y + player.height / 2 - 5, 5, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(player.x + player.width / 2 - 10, player.y + player.height / 2 - 5, 3, 0, Math.PI * 2);
    ctx.arc(player.x + player.width / 2 + 10, player.y + player.height / 2 - 5, 3, 0, Math.PI * 2);
    ctx.fill();
}

// Dibujar gallina
function drawChicken(chicken) {
    // Cuerpo de la gallina
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(chicken.x, chicken.y, chicken.width / 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Cabeza
    ctx.fillStyle = '#FFA500';
    ctx.beginPath();
    ctx.arc(chicken.x - chicken.width / 3, chicken.y - chicken.width / 3, chicken.width / 3, 0, Math.PI * 2);
    ctx.fill();
    
    // Pico
    ctx.fillStyle = '#FF6347';
    ctx.beginPath();
    ctx.moveTo(chicken.x - chicken.width / 2, chicken.y - chicken.width / 3);
    ctx.lineTo(chicken.x - chicken.width / 1.5, chicken.y - chicken.width / 4);
    ctx.lineTo(chicken.x - chicken.width / 2, chicken.y - chicken.width / 5);
    ctx.closePath();
    ctx.fill();
    
    // Alas
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.ellipse(chicken.x - chicken.width / 4, chicken.y + chicken.width / 6, chicken.width / 4, chicken.width / 3, -0.5, 0, Math.PI * 2);
    ctx.ellipse(chicken.x + chicken.width / 4, chicken.y + chicken.width / 6, chicken.width / 4, chicken.width / 3, 0.5, 0, Math.PI * 2);
    ctx.fill();
    
    // Ojos
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(chicken.x - chicken.width / 2.5, chicken.y - chicken.width / 3, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(chicken.x - chicken.width / 2.5, chicken.y - chicken.width / 3, 2, 0, Math.PI * 2);
    ctx.fill();
}

// Crear nueva gallina
function spawnChicken() {
    if (Math.random() < chickenSpawnRate) {
        chickens.push({
            x: Math.random() * (canvas.width - 40) + 20,
            y: -40,
            width: 40,
            height: 40,
            speed: chickenSpeed + Math.random() * 2
        });
    }
}

// Actualizar posición del personaje
function updatePlayer() {
    if (keys['ArrowLeft'] || keys['a'] || keys['A']) {
        player.x -= player.speed;
    }
    if (keys['ArrowRight'] || keys['d'] || keys['D']) {
        player.x += player.speed;
    }
    
    // Limitar movimiento dentro del canvas
    player.x = Math.max(player.width / 2, Math.min(canvas.width - player.width / 2, player.x));
}

// Actualizar gallinas
function updateChickens() {
    for (let i = chickens.length - 1; i >= 0; i--) {
        chickens[i].y += chickens[i].speed + gameSpeed;
        
        // Eliminar gallinas que salieron de la pantalla
        if (chickens[i].y > canvas.height + 50) {
            chickens.splice(i, 1);
            score += 10;
            scoreElement.textContent = score;
        }
    }
}

// Detectar colisiones
function checkCollisions() {
    for (let chicken of chickens) {
        const dx = player.x + player.width / 2 - chicken.x;
        const dy = player.y + player.height / 2 - chicken.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < (player.width / 2 + chicken.width / 2)) {
            return true;
        }
    }
    return false;
}

// Bucle principal del juego
function gameLoop() {
    // Limpiar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (gameState === 'playing') {
        // Actualizar
        updatePlayer();
        spawnChicken();
        updateChickens();
        
        // Verificar colisiones
        if (checkCollisions()) {
            gameState = 'gameover';
            finalScoreElement.textContent = score;
            gameOverScreen.classList.remove('hidden');
            scoreDisplay.classList.add('hidden');
            return;
        }
        
        // Dibujar
        drawPlayer();
        chickens.forEach(drawChicken);
        
        // Aumentar dificultad gradualmente
        gameSpeed += 0.0005;
        
        requestAnimationFrame(gameLoop);
    }
}

// Iniciar juego
startButton.addEventListener('click', () => {
    gameState = 'playing';
    startScreen.classList.add('hidden');
    scoreDisplay.classList.remove('hidden');
    score = 0;
    scoreElement.textContent = score;
    gameSpeed = 2;
    player.x = canvas.width / 2;
    chickens.length = 0;
    gameLoop();
});

// Reiniciar juego
restartButton.addEventListener('click', () => {
    gameState = 'playing';
    gameOverScreen.classList.add('hidden');
    scoreDisplay.classList.remove('hidden');
    score = 0;
    scoreElement.textContent = score;
    gameSpeed = 2;
    player.x = canvas.width / 2;
    chickens.length = 0;
    gameLoop();
});

// Iniciar bucle cuando la página carga
requestAnimationFrame(gameLoop);

