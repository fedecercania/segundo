const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const startButton = document.getElementById('startButton');
const restartButton = document.getElementById('restartButton');
const scoreDisplay = document.getElementById('scoreDisplay');
const scoreElement = document.getElementById('score');
const finalScoreElement = document.getElementById('finalScore');
const healthElement = document.getElementById('health');
const touchControls = document.getElementById('touchControls');
const leftButton = document.getElementById('leftButton');
const rightButton = document.getElementById('rightButton');

// Detectar si es móvil
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || (window.innerWidth <= 768);

// Variables del juego
let gameState = 'start'; // 'start', 'playing', 'gameover'
let score = 0;
let gameSpeed = 2;
let playerHealth = 100;
let lastDamageTime = 0;
const damageCooldown = 500; // ms entre daños

// Sistema de sonidos
let audioContext = null;
let backgroundMusic = null;
let isMusicPlaying = false;

// Obtener elemento de audio cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    backgroundMusic = document.getElementById('backgroundMusic');
});

function initAudio() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
}

// Música de fondo - usar música real de internet
function startBackgroundMusic() {
    if (!backgroundMusic) {
        backgroundMusic = document.getElementById('backgroundMusic');
    }
    
    if (!backgroundMusic) {
        console.log('No se encontró el elemento de audio');
        return;
    }
    
    if (isMusicPlaying && !backgroundMusic.paused) {
        return;
    }
    
    try {
        // Cargar y reproducir música de fondo
        backgroundMusic.volume = 0.4; // Volumen moderado
        backgroundMusic.loop = true; // Reproducir en bucle
        
        const playPromise = backgroundMusic.play();
        
        if (playPromise !== undefined) {
            playPromise.then(() => {
                isMusicPlaying = true;
                console.log('Música de fondo iniciada');
            }).catch(error => {
                console.log('Error reproduciendo música:', error);
                // Intentar con música alternativa
                tryAlternativeMusic();
            });
        }
    } catch (e) {
        console.log('Error con música:', e);
        tryAlternativeMusic();
    }
}

// Intentar música alternativa si la primera falla
function tryAlternativeMusic() {
    // Música libre de derechos divertida y armoniosa
    const alternativeSources = [
        'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
        'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
        'https://cdn.pixabay.com/download/audio/2022/05/13/audio_1c49e5a0f5.mp3?filename=happy-children-background-music-146761.mp3'
    ];
    
    if (!backgroundMusic) return;
    
    let sourceIndex = 0;
    
    function tryNextSource() {
        if (sourceIndex >= alternativeSources.length) {
            console.log('No se pudo cargar ninguna música');
            return;
        }
        
        backgroundMusic.src = alternativeSources[sourceIndex];
        backgroundMusic.load();
        backgroundMusic.volume = 0.4;
        
        const playPromise = backgroundMusic.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                isMusicPlaying = true;
                console.log('Música alternativa iniciada');
            }).catch(() => {
                sourceIndex++;
                tryNextSource();
            });
        }
    }
    
    tryNextSource();
}

function stopBackgroundMusic() {
    if (backgroundMusic) {
        backgroundMusic.pause();
        backgroundMusic.currentTime = 0;
    }
    isMusicPlaying = false;
}

function playSound(frequency, duration, type = 'sine', volume = 0.3) {
    try {
        if (!audioContext) {
            initAudio();
        }
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
        
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = type;
        
        gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration);
    } catch (e) {
        // Silencioso si hay error
    }
}

// Sonidos específicos
function playHitSound() {
    // Sonido más feo y desagradable
    playSound(150, 0.2, 'sawtooth', 0.4);
    setTimeout(() => playSound(100, 0.2, 'square', 0.3), 50);
}

function playHealSound() {
    playSound(400, 0.2, 'sine', 0.3);
}

function playScoreSound() {
    playSound(600, 0.15, 'sine', 0.2);
}

function playGameOverSound() {
    playSound(150, 0.5, 'sawtooth', 0.4);
    setTimeout(() => playSound(100, 0.5, 'sawtooth', 0.4), 200);
}

function playRoosterSound() {
    playSound(300, 0.2, 'square', 0.25);
}

function playFireRoosterSound() {
    // Sonido característico del gallo de fuego
    playSound(250, 0.15, 'sawtooth', 0.35);
    setTimeout(() => playSound(300, 0.15, 'sawtooth', 0.3), 50);
    setTimeout(() => playSound(200, 0.2, 'square', 0.3), 100);
}

// Personaje
const player = {
    x: 0,
    y: 0,
    width: isMobile ? 50 : 60,
    height: isMobile ? 50 : 60,
    speed: isMobile ? 10 : 8,
    color: '#FF6B6B'
};

// Generar perfil de montañas (variable global)
let mountainsProfile = null;

// Ajustar posición del personaje sobre el piso
function updatePlayerPosition() {
    const floorY = canvas.height - 80;
    player.y = floorY - player.height / 2 - 10;
}

// Configurar canvas a pantalla completa
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    updatePlayerPosition();
    player.x = Math.max(player.width / 2, Math.min(canvas.width - player.width / 2, player.x || canvas.width / 2));
    mountainsProfile = null; // Forzar regeneración de montañas
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Gallinas (quitan 1 de vida)
const chickens = [];
const chickenSpawnRate = 0.08;
const chickenSpeed = 5; // Más velocidad

// Gallos (quitan 5 de vida)
const roosters = [];
const roosterSpawnRate = 0.03;
const roosterSpeed = 6; // Más velocidad

// Gallos de fuego (quitan 10 de vida, caen constantemente)
const fireRoosters = [];
const fireRoosterSpawnRate = 0.015;
const fireRoosterSpeed = 7; // Más velocidad

// Nubes
const clouds = [];
const cloudSpawnRate = 0.015;
const cloudDuration = 3000; // Duración de 3 segundos
const cloudMaxCount = 2; // Máximo 2 nubes a la vez

// Comida en el piso
const foods = [];
const foodSpawnRate = 0.003; // Menos comida
const foodHealAmount = 20;

// Controles
const keys = {};
let touchLeft = false;
let touchRight = false;

document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Prevenir scroll en móvil
document.addEventListener('touchmove', (e) => {
    if (gameState === 'playing') {
        e.preventDefault();
    }
}, { passive: false });

document.addEventListener('touchstart', (e) => {
    if (gameState === 'playing') {
        e.preventDefault();
    }
}, { passive: false });

// Controles táctiles
if (leftButton && rightButton) {
    leftButton.addEventListener('touchstart', (e) => {
        e.preventDefault();
        touchLeft = true;
    });
    
    leftButton.addEventListener('touchend', (e) => {
        e.preventDefault();
        touchLeft = false;
    });
    
    leftButton.addEventListener('mousedown', (e) => {
        e.preventDefault();
        touchLeft = true;
    });
    
    leftButton.addEventListener('mouseup', (e) => {
        e.preventDefault();
        touchLeft = false;
    });
    
    rightButton.addEventListener('touchstart', (e) => {
        e.preventDefault();
        touchRight = true;
    });
    
    rightButton.addEventListener('touchend', (e) => {
        e.preventDefault();
        touchRight = false;
    });
    
    rightButton.addEventListener('mousedown', (e) => {
        e.preventDefault();
        touchRight = true;
    });
    
    rightButton.addEventListener('mouseup', (e) => {
        e.preventDefault();
        touchRight = false;
    });
}

// Generar perfil de montañas (solo una vez)
function generateMountainsProfile() {
    const horizonY = canvas.height * 0.6;
    mountainsProfile = {
        horizonY: horizonY,
        far: [],
        mid: [],
        near: []
    };
    
    // Montañas lejanas
    for (let i = 0; i <= canvas.width; i += 30) {
        mountainsProfile.far.push({
            x: i,
            y: horizonY - 70 - Math.sin(i / 100) * 30 - Math.cos(i / 150) * 20
        });
    }
    
    // Montañas medianas
    for (let i = -20; i <= canvas.width + 20; i += 35) {
        mountainsProfile.mid.push({
            x: i,
            y: horizonY - 50 - Math.sin(i / 80) * 40 - Math.cos(i / 120) * 25
        });
    }
    
    // Montañas cercanas
    for (let i = -40; i <= canvas.width + 40; i += 25) {
        mountainsProfile.near.push({
            x: i,
            y: horizonY - 30 - Math.sin(i / 60) * 50 - Math.cos(i / 90) * 30
        });
    }
}

// Dibujar montañas de fondo
function drawMountains() {
    const horizonY = canvas.height * 0.6;
    
    // Regenerar perfil si cambió el tamaño del canvas
    if (!mountainsProfile || mountainsProfile.horizonY !== horizonY) {
        generateMountainsProfile();
    }
    
    // Montañas lejanas (más oscuras)
    ctx.fillStyle = '#5A5A5A';
    ctx.beginPath();
    ctx.moveTo(0, horizonY);
    mountainsProfile.far.forEach(point => {
        ctx.lineTo(point.x, point.y);
    });
    ctx.lineTo(canvas.width, horizonY);
    ctx.closePath();
    ctx.fill();
    
    // Montañas medianas
    ctx.fillStyle = '#6B6B6B';
    ctx.beginPath();
    ctx.moveTo(0, horizonY);
    mountainsProfile.mid.forEach(point => {
        ctx.lineTo(point.x, point.y);
    });
    ctx.lineTo(canvas.width, horizonY);
    ctx.closePath();
    ctx.fill();
    
    // Montañas cercanas (más claras)
    ctx.fillStyle = '#7A7A7A';
    ctx.beginPath();
    ctx.moveTo(0, horizonY);
    mountainsProfile.near.forEach(point => {
        ctx.lineTo(point.x, point.y);
    });
    ctx.lineTo(canvas.width, horizonY);
    ctx.closePath();
    ctx.fill();
}

// Dibujar piso
function drawFloor() {
    const floorY = canvas.height - 80;
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(0, floorY, canvas.width, 80);
    
    // Textura del piso
    ctx.fillStyle = '#654321';
    for (let i = 0; i < canvas.width; i += 40) {
        ctx.fillRect(i, floorY, 2, 80);
    }
}

// Dibujar nube
function drawCloud(cloud) {
    const elapsed = Date.now() - cloud.createdAt;
    const remaining = Math.max(0, cloud.duration - elapsed);
    const fadeProgress = remaining / cloud.duration;
    const currentOpacity = cloud.opacity * fadeProgress;
    
    ctx.fillStyle = `rgba(150, 150, 150, ${currentOpacity})`;
    ctx.globalAlpha = currentOpacity;
    
    // Dibujar nube con forma más realista
    ctx.beginPath();
    ctx.arc(cloud.x, cloud.y, cloud.height / 2, 0, Math.PI * 2);
    ctx.arc(cloud.x + cloud.width * 0.3, cloud.y, cloud.height * 0.6, 0, Math.PI * 2);
    ctx.arc(cloud.x - cloud.width * 0.3, cloud.y, cloud.height * 0.6, 0, Math.PI * 2);
    ctx.arc(cloud.x + cloud.width * 0.15, cloud.y - cloud.height * 0.3, cloud.height * 0.5, 0, Math.PI * 2);
    ctx.arc(cloud.x - cloud.width * 0.15, cloud.y - cloud.height * 0.3, cloud.height * 0.5, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.globalAlpha = 1.0;
}

// Dibujar comida
function drawFood(food) {
    ctx.fillStyle = '#FF6347';
    ctx.beginPath();
    ctx.arc(food.x, food.y, food.size / 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Detalle de la comida
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(food.x, food.y, food.size / 3, 0, Math.PI * 2);
    ctx.fill();
}

// Dibujar gallo
function drawRooster(rooster) {
    // Cuerpo más grande que las gallinas
    ctx.fillStyle = '#8B4513';
    ctx.beginPath();
    ctx.arc(rooster.x, rooster.y, rooster.width / 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Cabeza
    ctx.fillStyle = '#FF4500';
    ctx.beginPath();
    ctx.arc(rooster.x - rooster.width / 3, rooster.y - rooster.width / 3, rooster.width / 3, 0, Math.PI * 2);
    ctx.fill();
    
    // Cresta
    ctx.fillStyle = '#FF0000';
    ctx.beginPath();
    ctx.moveTo(rooster.x - rooster.width / 2, rooster.y - rooster.width / 2);
    ctx.lineTo(rooster.x - rooster.width / 2.5, rooster.y - rooster.width / 1.5);
    ctx.lineTo(rooster.x - rooster.width / 3, rooster.y - rooster.width / 2);
    ctx.closePath();
    ctx.fill();
    
    // Pico
    ctx.fillStyle = '#FF6347';
    ctx.beginPath();
    ctx.moveTo(rooster.x - rooster.width / 2, rooster.y - rooster.width / 3);
    ctx.lineTo(rooster.x - rooster.width / 1.5, rooster.y - rooster.width / 4);
    ctx.lineTo(rooster.x - rooster.width / 2, rooster.y - rooster.width / 5);
    ctx.closePath();
    ctx.fill();
}

// Dibujar galo de fuego
function drawFireRooster(rooster) {
    // Efecto de fuego
    const gradient = ctx.createRadialGradient(rooster.x, rooster.y, 0, rooster.x, rooster.y, rooster.width);
    gradient.addColorStop(0, '#FF4500');
    gradient.addColorStop(0.5, '#FF6347');
    gradient.addColorStop(1, '#FFD700');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(rooster.x, rooster.y, rooster.width / 2 + 5, 0, Math.PI * 2);
    ctx.fill();
    
    // Cuerpo
    ctx.fillStyle = '#FF4500';
    ctx.beginPath();
    ctx.arc(rooster.x, rooster.y, rooster.width / 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Cabeza
    ctx.fillStyle = '#FF0000';
    ctx.beginPath();
    ctx.arc(rooster.x - rooster.width / 3, rooster.y - rooster.width / 3, rooster.width / 3, 0, Math.PI * 2);
    ctx.fill();
    
    // Cresta de fuego
    ctx.fillStyle = '#FF6347';
    ctx.beginPath();
    ctx.moveTo(rooster.x - rooster.width / 2, rooster.y - rooster.width / 2);
    ctx.lineTo(rooster.x - rooster.width / 2.5, rooster.y - rooster.width / 1.5);
    ctx.lineTo(rooster.x - rooster.width / 3, rooster.y - rooster.width / 2);
    ctx.closePath();
    ctx.fill();
}

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
        const size = isMobile ? 35 : 40;
        chickens.push({
            x: Math.random() * (canvas.width - size) + size / 2,
            y: -size,
            width: size,
            height: size,
            speed: chickenSpeed + Math.random() * 2
        });
    }
}

// Crear nuevo gallo
function spawnRooster() {
    if (Math.random() < roosterSpawnRate) {
        const size = isMobile ? 45 : 50;
        roosters.push({
            x: Math.random() * (canvas.width - size) + size / 2,
            y: -size,
            width: size,
            height: size,
            speed: roosterSpeed + Math.random() * 2
        });
    }
}

// Crear galo de fuego
function spawnFireRooster() {
    if (Math.random() < fireRoosterSpawnRate) {
        const size = isMobile ? 55 : 60;
        fireRoosters.push({
            x: Math.random() * (canvas.width - size) + size / 2,
            y: -size, // Aparece desde arriba
            width: size,
            height: size,
            speed: fireRoosterSpeed + Math.random() * 2, // Caen rápido
            chaseSpeed: 2 // Velocidad de persecución horizontal
        });
    }
}

// Crear nube
function spawnCloud() {
    if (Math.random() < cloudSpawnRate && clouds.length < cloudMaxCount) {
        clouds.push({
            x: Math.random() * (canvas.width - 200) + 100,
            y: 50 + Math.random() * (canvas.height / 2), // Aparece en la mitad superior
            width: 150 + Math.random() * 100,
            height: 80 + Math.random() * 60,
            opacity: 0.6,
            createdAt: Date.now(),
            duration: cloudDuration
        });
    }
}

// Crear comida
function spawnFood() {
    if (Math.random() < foodSpawnRate) {
        const floorY = canvas.height - 80;
        foods.push({
            x: Math.random() * (canvas.width - 30) + 15,
            y: floorY + 20,
            size: 20,
            collected: false
        });
    }
}

// Actualizar posición del personaje
function updatePlayer() {
    if (keys['ArrowLeft'] || keys['a'] || keys['A'] || touchLeft) {
        player.x -= player.speed;
    }
    if (keys['ArrowRight'] || keys['d'] || keys['D'] || touchRight) {
        player.x += player.speed;
    }
    
    // Limitar movimiento dentro del canvas
    player.x = Math.max(player.width / 2, Math.min(canvas.width - player.width / 2, player.x));
}

// Actualizar gallinas
function updateChickens() {
    const floorY = canvas.height - 80;
    for (let i = chickens.length - 1; i >= 0; i--) {
        chickens[i].y += chickens[i].speed + gameSpeed;
        
        // Eliminar gallinas cuando llegan al piso o salen de la pantalla
        if (chickens[i].y >= floorY || chickens[i].y > canvas.height + 50) {
            if (chickens[i].y < canvas.height && chickens[i].y >= floorY) {
                score += 10;
                scoreElement.textContent = score;
                // Sin sonido cuando llegan al suelo
            }
            chickens.splice(i, 1);
        }
    }
}

// Actualizar gallos
function updateRoosters() {
    const floorY = canvas.height - 80;
    for (let i = roosters.length - 1; i >= 0; i--) {
        roosters[i].y += roosters[i].speed + gameSpeed;
        
        // Eliminar gallos cuando llegan al piso o salen de la pantalla
        if (roosters[i].y >= floorY || roosters[i].y > canvas.height + 50) {
            if (roosters[i].y < canvas.height && roosters[i].y >= floorY) {
                score += 20;
                scoreElement.textContent = score;
                // Sin sonido cuando llegan al suelo
            }
            roosters.splice(i, 1);
        }
    }
}

// Actualizar gallos de fuego (persiguen al personaje horizontalmente)
function updateFireRoosters() {
    const floorY = canvas.height - 80;
    for (let i = fireRoosters.length - 1; i >= 0; i--) {
        const fireRooster = fireRoosters[i];
        
        // Caer hacia abajo
        fireRooster.y += fireRooster.speed + gameSpeed;
        
        // Perseguir al personaje horizontalmente
        const playerCenterX = player.x + player.width / 2;
        const fireRoosterCenterX = fireRooster.x;
        
        if (playerCenterX > fireRoosterCenterX) {
            // Personaje está a la derecha, moverse hacia la derecha
            fireRooster.x += fireRooster.chaseSpeed;
        } else if (playerCenterX < fireRoosterCenterX) {
            // Personaje está a la izquierda, moverse hacia la izquierda
            fireRooster.x -= fireRooster.chaseSpeed;
        }
        
        // Eliminar gallos de fuego cuando llegan al piso o salen de la pantalla
        if (fireRooster.y >= floorY || fireRooster.y > canvas.height + 50) {
            if (fireRooster.y < canvas.height && fireRooster.y >= floorY) {
                score += 30;
                scoreElement.textContent = score;
                // Sin sonido cuando llegan al suelo
            }
            fireRoosters.splice(i, 1);
        }
    }
}

// Actualizar nubes
function updateClouds() {
    for (let i = clouds.length - 1; i >= 0; i--) {
        const cloud = clouds[i];
        const elapsed = Date.now() - cloud.createdAt;
        
        // Eliminar nube si ha pasado su duración
        if (elapsed >= cloud.duration) {
            clouds.splice(i, 1);
        }
    }
}

// Detectar colisiones y aplicar daño
function checkCollisions() {
    const now = Date.now();
    
    // Colisión con gallinas (quitan 1 de vida)
    for (let chicken of chickens) {
        const dx = player.x + player.width / 2 - chicken.x;
        const dy = player.y + player.height / 2 - chicken.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < (player.width / 2 + chicken.width / 2) && now - lastDamageTime > damageCooldown) {
            playerHealth -= 1;
            lastDamageTime = now;
            healthElement.textContent = Math.max(0, playerHealth);
            playHitSound();
            // Eliminar la gallina después del daño
            const index = chickens.indexOf(chicken);
            if (index > -1) chickens.splice(index, 1);
        }
    }
    
    // Colisión con gallos (quitan 5 de vida)
    for (let rooster of roosters) {
        const dx = player.x + player.width / 2 - rooster.x;
        const dy = player.y + player.height / 2 - rooster.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < (player.width / 2 + rooster.width / 2) && now - lastDamageTime > damageCooldown) {
            playerHealth -= 5;
            lastDamageTime = now;
            healthElement.textContent = Math.max(0, playerHealth);
            playRoosterSound();
            const index = roosters.indexOf(rooster);
            if (index > -1) roosters.splice(index, 1);
        }
    }
    
    // Colisión con gallos de fuego (quitan 10 de vida)
    for (let fireRooster of fireRoosters) {
        const dx = player.x + player.width / 2 - fireRooster.x;
        const dy = player.y + player.height / 2 - fireRooster.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < (player.width / 2 + fireRooster.width / 2) && now - lastDamageTime > damageCooldown) {
            playerHealth -= 10;
            lastDamageTime = now;
            healthElement.textContent = Math.max(0, playerHealth);
            playFireRoosterSound();
            const index = fireRoosters.indexOf(fireRooster);
            if (index > -1) fireRoosters.splice(index, 1);
        }
    }
    
    // Colisión con comida (cura vida)
    for (let i = foods.length - 1; i >= 0; i--) {
        const food = foods[i];
        if (food.collected) continue;
        
        const dx = player.x + player.width / 2 - food.x;
        const dy = player.y + player.height / 2 - food.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < (player.width / 2 + food.size / 2)) {
            playerHealth = Math.min(100, playerHealth + foodHealAmount);
            healthElement.textContent = playerHealth;
            playHealSound();
            foods.splice(i, 1);
            score += 5;
            scoreElement.textContent = score;
        }
    }
    
    // Verificar si el jugador murió
    return playerHealth <= 0;
}

// Bucle principal del juego
function gameLoop() {
    // Limpiar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (gameState === 'playing') {
        // Dibujar montañas de fondo primero
        drawMountains();
        
        // Dibujar piso
        drawFloor();
        
        // Actualizar
        updatePlayer();
        spawnChicken();
        spawnRooster();
        spawnFireRooster();
        spawnCloud();
        spawnFood();
        
        updateChickens();
        updateRoosters();
        updateFireRoosters();
        updateClouds();
        
        // Verificar colisiones
        if (checkCollisions()) {
            stopBackgroundMusic(); // Detener música al perder
            gameState = 'gameover';
            playGameOverSound();
            finalScoreElement.textContent = score;
            gameOverScreen.classList.remove('hidden');
            scoreDisplay.classList.add('hidden');
            if (isMobile) {
                touchControls.classList.add('hidden');
            }
            touchLeft = false;
            touchRight = false;
            return;
        }
        
        // Dibujar comida
        foods.forEach(drawFood);
        
        // Dibujar gallinas, gallos y gallos de fuego
        chickens.forEach(drawChicken);
        roosters.forEach(drawRooster);
        fireRoosters.forEach(drawFireRooster);
        
        // Dibujar nubes encima (ocultan parcialmente lo que está debajo)
        clouds.forEach(drawCloud);
        
        // Dibujar personaje
        drawPlayer();
        
        // Aumentar dificultad gradualmente
        gameSpeed += 0.0005;
        
        requestAnimationFrame(gameLoop);
    }
}

// Iniciar juego
startButton.addEventListener('click', async () => {
    initAudio(); // Inicializar audio al empezar
    // Asegurar que el audio esté activo antes de empezar la música
    if (audioContext && audioContext.state === 'suspended') {
        await audioContext.resume();
    }
    startBackgroundMusic(); // Iniciar música de fondo
    gameState = 'playing';
    startScreen.classList.add('hidden');
    scoreDisplay.classList.remove('hidden');
    if (isMobile) {
        touchControls.classList.remove('hidden');
    }
    score = 0;
    playerHealth = 100;
    gameSpeed = 2;
    player.x = canvas.width / 2;
    chickens.length = 0;
    roosters.length = 0;
    fireRoosters.length = 0;
    clouds.length = 0;
    foods.length = 0;
    lastDamageTime = 0;
    scoreElement.textContent = score;
    healthElement.textContent = playerHealth;
    gameLoop();
});

// Reiniciar juego
restartButton.addEventListener('click', async () => {
    // Asegurar que el audio esté activo
    if (audioContext && audioContext.state === 'suspended') {
        await audioContext.resume();
    }
    isMusicPlaying = false; // Resetear flag para permitir que la música vuelva a empezar
    startBackgroundMusic(); // Reiniciar música
    gameState = 'playing';
    gameOverScreen.classList.add('hidden');
    scoreDisplay.classList.remove('hidden');
    if (isMobile) {
        touchControls.classList.remove('hidden');
    }
    score = 0;
    playerHealth = 100;
    gameSpeed = 2;
    player.x = canvas.width / 2;
    chickens.length = 0;
    roosters.length = 0;
    fireRoosters.length = 0;
    clouds.length = 0;
    foods.length = 0;
    lastDamageTime = 0;
    touchLeft = false;
    touchRight = false;
    scoreElement.textContent = score;
    healthElement.textContent = playerHealth;
    gameLoop();
});

// Iniciar bucle cuando la página carga
requestAnimationFrame(gameLoop);

