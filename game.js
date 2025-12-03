const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startScreen = document.getElementById('startScreen');
const characterScreen = document.getElementById('characterScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const levelUpScreen = document.getElementById('levelUpScreen');
const lifeLostScreen = document.getElementById('lifeLostScreen');
const countdownText = document.getElementById('countdownText');
const startButton = document.getElementById('startButton');
const playButton = document.getElementById('playButton');
const restartButton = document.getElementById('restartButton');
const characterPreview = document.getElementById('characterPreview');
const colorSelect = document.getElementById('colorSelect');
const eyeColorSelect = document.getElementById('eyeColorSelect');
const mouthSelect = document.getElementById('mouthSelect');
const hatSelect = document.getElementById('hatSelect');
const levelUpNumber = document.getElementById('levelUpNumber');
const scoreDisplay = document.getElementById('scoreDisplay');
const scoreElement = document.getElementById('score');
const finalScoreElement = document.getElementById('finalScore');
const healthBar = document.getElementById('healthBar');
const livesElement = document.getElementById('lives');
const levelElement = document.getElementById('level');
const touchControls = document.getElementById('touchControls');
const leftButton = document.getElementById('leftButton');
const rightButton = document.getElementById('rightButton');

// Detectar si es móvil
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || (window.innerWidth <= 768);

// Variables del juego
let gameState = 'start'; // 'start', 'playing', 'gameover', 'lifelost'
let score = 0;
let gameSpeed = 0.3; // Velocidad inicial lenta
let playerLives = 5; // 5 vidas
let playerHealthBar = 0; // Barra de vida (0-100)
let lastDamageTime = 0;
const damageCooldown = 500; // ms entre daños
let currentLevel = 1;
let scoreForNextLevel = 100; // Puntos necesarios para subir de nivel

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

function playLifeLostSound() {
    // Sonido "tutun" - dos tonos bajos
    playSound(150, 0.3, 'sine', 0.4);
    setTimeout(() => playSound(120, 0.3, 'sine', 0.4), 200);
}

// Personaje
const player = {
    x: 0,
    y: 0,
    width: isMobile ? 50 : 60,
    height: isMobile ? 50 : 60,
    speed: isMobile ? 10 : 8,
    color: '#FF6B6B',
    eyeColor: '#000000',
    mouthType: 'happy',
    hatType: 'none'
};

// Período de adaptación al inicio de cada nivel
let adaptationTime = 0;
const adaptationDuration = 5000; // 5 segundos de adaptación
let levelStartTime = 0;

// Generar perfil de montañas (variable global)
let mountainsProfile = null;

// Variables de nubes (declaradas antes de resizeCanvas)
let cloudY = 300; // Posición Y de la nube (se inicializará en resizeCanvas)
let cloudHeight = 0; // Altura de la nube (40% del canvas, se ajustará dinámicamente)

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
    cloudHeight = canvas.height * 0.4; // 40% del alto de la pantalla
    cloudY = canvas.height * 0.15; // Posición más alta (15% desde arriba)
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Gallinas (quitan 1 de vida)
const chickens = [];
let chickenSpawnRate = 0.006; // Frecuencia balanceada
const chickenSpeed = 0.8; // Velocidad muy lenta

// Gallos (quitan 5 de vida) - 1 cada 10 gallinas
const roosters = [];
let roosterSpawnRate = 0.0006; // 10% de la frecuencia de gallinas (0.006 / 10)
const roosterSpeed = 1; // Velocidad lenta

// Gallos de fuego (quitan 10 de vida) - 1 cada 20 gallinas, al doble de velocidad
const fireRoosters = [];
let fireRoosterSpawnRate = 0.0003; // 5% de la frecuencia de gallinas (0.006 / 20)
const fireRoosterSpeed = 2.4; // Doble velocidad (1.2 * 2)

// Nubes
const clouds = [];
const cloudSpawnRate = 0.0003; // Aparece aproximadamente cada 1 minuto
const cloudDuration = 10000; // Duración de 10 segundos
const cloudMaxCount = 1; // Máximo 1 nube a la vez

// Comida flotante
const foods = [];
const foodSpawnRate = 0.002; // Mucho menos comida
const foodHealAmount = 2; // Muy poca vida
const foodLifetime = 8000; // Desaparecen después de 8 segundos

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
    const y = cloudY;
    const height = cloudHeight;
    const centerY = y + height / 2;
    
    // Nube ocupa todo el ancho de la pantalla
    const cloudWidth = canvas.width;
    const cloudX = 0;
    
    ctx.fillStyle = 'rgba(220, 220, 220, 0.85)';
    ctx.strokeStyle = 'rgba(200, 200, 200, 0.9)';
    ctx.lineWidth = 2;
    
    // Dibujar forma de nube usando múltiples círculos superpuestos
    const numCircles = 20; // Más círculos para nube más ancha
    const spacing = cloudWidth / (numCircles - 1);
    const baseRadius = height * 0.25;
    
    // Círculos de la fila principal (base de la nube)
    for (let i = 0; i < numCircles; i++) {
        const x = cloudX + i * spacing;
        ctx.beginPath();
        ctx.arc(x, centerY + height * 0.2, baseRadius, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Círculos superiores (segunda fila, más pequeños)
    for (let i = 1; i < numCircles - 1; i++) {
        const x = cloudX + i * spacing;
        ctx.beginPath();
        ctx.arc(x, centerY - height * 0.05, baseRadius * 0.8, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Círculos de la parte superior (tercera fila, aún más pequeños)
    for (let i = 2; i < numCircles - 2; i++) {
        const x = cloudX + i * spacing;
        ctx.beginPath();
        ctx.arc(x, centerY - height * 0.25, baseRadius * 0.6, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Agregar algunos círculos adicionales para suavizar
    for (let i = 3; i < numCircles - 3; i++) {
        const x = cloudX + i * spacing;
        ctx.beginPath();
        ctx.arc(x, centerY - height * 0.35, baseRadius * 0.4, 0, Math.PI * 2);
        ctx.fill();
    }
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
    const centerX = player.x + player.width / 2;
    const centerY = player.y + player.height / 2;
    const radius = player.width / 2;
    
    // Sombrero (si tiene)
    if (player.hatType === 'cap') {
        // Gorra
        ctx.fillStyle = '#1a1a2e';
        ctx.beginPath();
        ctx.arc(centerX, centerY - radius * 0.6, radius * 0.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(centerX - radius * 0.8, centerY - radius * 1.2, radius * 1.6, radius * 0.4);
    } else if (player.hatType === 'tophat') {
        // Sombrero de copa
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(centerX - radius * 0.6, centerY - radius * 1.4, radius * 1.2, radius * 0.3);
        ctx.fillRect(centerX - radius * 0.4, centerY - radius * 1.8, radius * 0.8, radius * 0.5);
    }
    
    // Cuerpo
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Ojos
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(centerX - radius * 0.25, centerY - radius * 0.15, radius * 0.15, 0, Math.PI * 2);
    ctx.arc(centerX + radius * 0.25, centerY - radius * 0.15, radius * 0.15, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = player.eyeColor;
    ctx.beginPath();
    ctx.arc(centerX - radius * 0.25, centerY - radius * 0.15, radius * 0.1, 0, Math.PI * 2);
    ctx.arc(centerX + radius * 0.25, centerY - radius * 0.15, radius * 0.1, 0, Math.PI * 2);
    ctx.fill();
    
    // Boca
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (player.mouthType === 'happy') {
        // Boca feliz
        ctx.arc(centerX, centerY + radius * 0.1, radius * 0.3, 0.2, Math.PI - 0.2);
    } else if (player.mouthType === 'surprised') {
        // Boca sorprendida (círculo)
        ctx.arc(centerX, centerY + radius * 0.2, radius * 0.15, 0, Math.PI * 2);
        ctx.fillStyle = '#000000';
        ctx.fill();
    } else {
        // Boca neutra (línea)
        ctx.moveTo(centerX - radius * 0.3, centerY + radius * 0.15);
        ctx.lineTo(centerX + radius * 0.3, centerY + radius * 0.15);
    }
    ctx.stroke();
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
            createdAt: Date.now(),
            duration: cloudDuration
        });
    }
}

// Crear comida
function spawnFood() {
    if (Math.random() < foodSpawnRate) {
        // Comida más abajo para que sea más fácil de comer
        const floorY = canvas.height - 80;
        foods.push({
            x: Math.random() * (canvas.width - 30) + 15,
            y: floorY - 30, // Más abajo, más cerca del piso
            size: 20,
            collected: false,
            createdAt: Date.now()
        });
    }
}

// Actualizar comida (desaparece después de un tiempo)
function updateFoods() {
    const now = Date.now();
    for (let i = foods.length - 1; i >= 0; i--) {
        const food = foods[i];
        if (food.collected) {
            foods.splice(i, 1);
            continue;
        }
        
        // Eliminar comida que ha pasado su tiempo de vida
        if (now - food.createdAt > foodLifetime) {
            foods.splice(i, 1);
        }
    }
}

// Función para actualizar barra de vida
function updateHealthBar() {
    if (healthBar) {
        const percentage = Math.max(0, Math.min(100, playerHealthBar));
        healthBar.style.width = percentage + '%';
        
        // Color verde para la barra
        healthBar.style.background = 'linear-gradient(to right, #4CAF50, #8BC34A)';
    }
    if (livesElement) {
        // Mostrar vidas como corazones
        livesElement.innerHTML = '❤️'.repeat(playerLives) + '🤍'.repeat(Math.max(0, 5 - playerLives));
    }
}

// Reiniciar nivel después de perder una vida
function resetLevelAfterLifeLost() {
    // Pausar el juego
    gameState = 'lifelost';
    
    // Limpiar todos los enemigos
    chickens.length = 0;
    roosters.length = 0;
    fireRoosters.length = 0;
    foods.length = 0;
    clouds.length = 0;
    
    // Reposicionar al jugador en el centro
    player.x = canvas.width / 2;
    updatePlayerPosition();
    
    // Mostrar pantalla de vida perdida y cuenta regresiva
    if (lifeLostScreen) {
        lifeLostScreen.classList.remove('hidden');
        scoreDisplay.classList.add('hidden');
        if (isMobile) {
            touchControls.classList.add('hidden');
        }
        
        // Cuenta regresiva 3-2-1
        let countdown = 3;
        if (countdownText) {
            countdownText.textContent = countdown;
        }
        
        const countdownInterval = setInterval(() => {
            countdown--;
            if (countdownText) {
                countdownText.textContent = countdown;
            }
            
            if (countdown <= 0) {
                clearInterval(countdownInterval);
                // Ocultar pantalla y continuar
                lifeLostScreen.classList.add('hidden');
                scoreDisplay.classList.remove('hidden');
                if (isMobile) {
                    touchControls.classList.remove('hidden');
                }
                gameState = 'playing';
            }
        }, 1000);
    }
}

// Dibujar preview del personaje
function drawCharacterPreview() {
    if (!characterPreview) return;
    const previewCtx = characterPreview.getContext('2d');
    previewCtx.clearRect(0, 0, characterPreview.width, characterPreview.height);
    
    const centerX = characterPreview.width / 2;
    const centerY = characterPreview.height / 2;
    const radius = 50;
    
    // Obtener valores actuales de los selects
    const color = colorSelect ? colorSelect.value : player.color;
    const eyeColor = eyeColorSelect ? eyeColorSelect.value : player.eyeColor;
    const mouthType = mouthSelect ? mouthSelect.value : player.mouthType;
    const hatType = hatSelect ? hatSelect.value : player.hatType;
    
    // Sombrero (si tiene)
    if (hatType === 'cap') {
        previewCtx.fillStyle = '#1a1a2e';
        previewCtx.beginPath();
        previewCtx.arc(centerX, centerY - radius * 0.6, radius * 0.8, 0, Math.PI * 2);
        previewCtx.fill();
        previewCtx.fillRect(centerX - radius * 0.8, centerY - radius * 1.2, radius * 1.6, radius * 0.4);
    } else if (hatType === 'tophat') {
        previewCtx.fillStyle = '#1a1a2e';
        previewCtx.fillRect(centerX - radius * 0.6, centerY - radius * 1.4, radius * 1.2, radius * 0.3);
        previewCtx.fillRect(centerX - radius * 0.4, centerY - radius * 1.8, radius * 0.8, radius * 0.5);
    }
    
    // Cuerpo
    previewCtx.fillStyle = color;
    previewCtx.beginPath();
    previewCtx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    previewCtx.fill();
    
    // Ojos
    previewCtx.fillStyle = 'white';
    previewCtx.beginPath();
    previewCtx.arc(centerX - radius * 0.25, centerY - radius * 0.15, radius * 0.15, 0, Math.PI * 2);
    previewCtx.arc(centerX + radius * 0.25, centerY - radius * 0.15, radius * 0.15, 0, Math.PI * 2);
    previewCtx.fill();
    
    previewCtx.fillStyle = eyeColor;
    previewCtx.beginPath();
    previewCtx.arc(centerX - radius * 0.25, centerY - radius * 0.15, radius * 0.1, 0, Math.PI * 2);
    previewCtx.arc(centerX + radius * 0.25, centerY - radius * 0.15, radius * 0.1, 0, Math.PI * 2);
    previewCtx.fill();
    
    // Boca
    previewCtx.strokeStyle = '#000000';
    previewCtx.lineWidth = 2;
    previewCtx.beginPath();
    if (mouthType === 'happy') {
        previewCtx.arc(centerX, centerY + radius * 0.1, radius * 0.3, 0.2, Math.PI - 0.2);
    } else if (mouthType === 'surprised') {
        previewCtx.arc(centerX, centerY + radius * 0.2, radius * 0.15, 0, Math.PI * 2);
        previewCtx.fillStyle = '#000000';
        previewCtx.fill();
    } else {
        previewCtx.moveTo(centerX - radius * 0.3, centerY + radius * 0.15);
        previewCtx.lineTo(centerX + radius * 0.3, centerY + radius * 0.15);
    }
    previewCtx.stroke();
}

// Sistema de niveles
let levelUpShown = false;
function checkLevelUp() {
    if (score >= scoreForNextLevel && !levelUpShown) {
        currentLevel++;
        scoreForNextLevel += 100 * currentLevel; // Cada nivel requiere más puntos
        
        // Aumentar velocidad solo 10% por nivel
        gameSpeed *= 1.1; // Aumento del 10%
        chickenSpawnRate *= 1.1; // Aumento del 10% de spawn
        roosterSpawnRate *= 1.1;
        fireRoosterSpawnRate *= 1.1;
        
        if (levelElement) {
            levelElement.textContent = currentLevel;
        }
        
        // Mostrar cartel de nivel
        if (levelUpScreen && levelUpNumber) {
            levelUpNumber.textContent = currentLevel;
            levelUpScreen.classList.remove('hidden');
            levelUpShown = true;
            
            // Ocultar después de 2 segundos
            setTimeout(() => {
                levelUpScreen.classList.add('hidden');
                levelUpShown = false;
            }, 2000);
        }
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

// Factor de adaptación desactivado - velocidad constante
function getAdaptationFactor() {
    return 1.0; // Velocidad normal siempre
}

// Actualizar gallinas
function updateChickens() {
    const floorY = canvas.height - 80;
    const adaptationFactor = getAdaptationFactor();
    
    for (let i = chickens.length - 1; i >= 0; i--) {
        const chicken = chickens[i];
        
        // Movimiento con factor de adaptación
        chicken.y += (chicken.speed + gameSpeed) * adaptationFactor;
        
        // Si hay nube activa y la gallina está en la zona de la nube, ocultarla visualmente
        if (cloudActive && clouds.length > 0) {
            if (chicken.y >= cloudY && chicken.y <= cloudY + cloudHeight) {
                chicken.hidden = true;
            } else {
                chicken.hidden = false;
            }
        } else {
            chicken.hidden = false;
        }
        
        // Eliminar gallinas cuando llegan al piso o salen de la pantalla
        if (chicken.y >= floorY || chicken.y > canvas.height + 50) {
            if (chicken.y < canvas.height && chicken.y >= floorY) {
                score += 10;
                scoreElement.textContent = score;
            }
            chickens.splice(i, 1);
        }
    }
}

// Actualizar gallos
function updateRoosters() {
    const floorY = canvas.height - 80;
    const adaptationFactor = getAdaptationFactor();
    
    for (let i = roosters.length - 1; i >= 0; i--) {
        const rooster = roosters[i];
        
        // Movimiento con factor de adaptación
        rooster.y += (rooster.speed + gameSpeed) * adaptationFactor;
        
        // Si hay nube activa y el gallo está en la zona de la nube, ocultarlo visualmente
        if (cloudActive && clouds.length > 0) {
            if (rooster.y >= cloudY && rooster.y <= cloudY + cloudHeight) {
                rooster.hidden = true;
            } else {
                rooster.hidden = false;
            }
        } else {
            rooster.hidden = false;
        }
        
        // Eliminar gallos cuando llegan al piso o salen de la pantalla
        if (rooster.y >= floorY || rooster.y > canvas.height + 50) {
            if (rooster.y < canvas.height && rooster.y >= floorY) {
                score += 20;
                scoreElement.textContent = score;
            }
            roosters.splice(i, 1);
        }
    }
}

// Actualizar gallos de fuego (persiguen al personaje horizontalmente)
function updateFireRoosters() {
    const floorY = canvas.height - 80;
    const adaptationFactor = getAdaptationFactor();
    
    for (let i = fireRoosters.length - 1; i >= 0; i--) {
        const fireRooster = fireRoosters[i];
        
        // Caer hacia abajo con factor de adaptación
        fireRooster.y += (fireRooster.speed + gameSpeed) * adaptationFactor;
        
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
let cloudActive = false;
function updateClouds() {
    cloudActive = clouds.length > 0;
    
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
    
    // Colisión con cualquier enemigo (quitan 1 vida)
    let hitEnemy = false;
    
    // Colisión con gallinas
    for (let chicken of chickens) {
        const dx = player.x + player.width / 2 - chicken.x;
        const dy = player.y + player.height / 2 - chicken.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < (player.width / 2 + chicken.width / 2) && now - lastDamageTime > damageCooldown) {
            playerLives -= 1;
            lastDamageTime = now;
            hitEnemy = true;
            playLifeLostSound(); // Sonido tutun al perder vida
            const index = chickens.indexOf(chicken);
            if (index > -1) chickens.splice(index, 1);
            break;
        }
    }
    
    // Colisión con gallos
    if (!hitEnemy) {
        for (let rooster of roosters) {
            const dx = player.x + player.width / 2 - rooster.x;
            const dy = player.y + player.height / 2 - rooster.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < (player.width / 2 + rooster.width / 2) && now - lastDamageTime > damageCooldown) {
                playerLives -= 1;
                lastDamageTime = now;
                hitEnemy = true;
                playLifeLostSound(); // Sonido tutun al perder vida
                const index = roosters.indexOf(rooster);
                if (index > -1) roosters.splice(index, 1);
                break;
            }
        }
    }
    
    // Colisión con gallos de fuego
    if (!hitEnemy) {
        for (let fireRooster of fireRoosters) {
            const dx = player.x + player.width / 2 - fireRooster.x;
            const dy = player.y + player.height / 2 - fireRooster.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < (player.width / 2 + fireRooster.width / 2) && now - lastDamageTime > damageCooldown) {
                playerLives -= 1;
                lastDamageTime = now;
                hitEnemy = true;
                playLifeLostSound(); // Sonido tutun al perder vida
                const index = fireRoosters.indexOf(fireRooster);
                if (index > -1) fireRoosters.splice(index, 1);
                break;
            }
        }
    }
    
    if (hitEnemy) {
        updateHealthBar();
        // Si todavía tiene vidas, reiniciar el nivel
        if (playerLives > 0) {
            resetLevelAfterLifeLost();
        }
    }
    
    // Colisión con comida (llena la barra de vida)
    for (let i = foods.length - 1; i >= 0; i--) {
        const food = foods[i];
        if (food.collected) continue;
        
        const dx = player.x + player.width / 2 - food.x;
        const dy = player.y + player.height / 2 - food.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < (player.width / 2 + food.size / 2)) {
            playerHealthBar += foodHealAmount;
            
            // Si la barra llega a 100, gana una vida extra
            if (playerHealthBar >= 100) {
                playerLives += 1;
                playerHealthBar = 0; // Resetear la barra
            }
            
            updateHealthBar();
            playHealSound();
            foods.splice(i, 1);
            score += 5;
            scoreElement.textContent = score;
        }
    }
    
    // Verificar si el jugador murió (sin vidas)
    return playerLives <= 0;
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
        updateFoods();
        
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
        
        // Dibujar gallinas (solo las que no están ocultas por la nube)
        chickens.forEach(chicken => {
            if (!chicken.hidden) {
                drawChicken(chicken);
            }
        });
        
        // Dibujar gallos (solo los que no están ocultos por la nube)
        roosters.forEach(rooster => {
            if (!rooster.hidden) {
                drawRooster(rooster);
            }
        });
        
        // Dibujar gallos de fuego (siempre visibles, no se ocultan)
        fireRoosters.forEach(drawFireRooster);
        
        // Dibujar nubes (solo cubren parte inferior)
        clouds.forEach(drawCloud);
        
        // Dibujar personaje (siempre visible)
        drawPlayer();
        
        // Verificar si sube de nivel
        checkLevelUp();
        
        // Actualizar barra de vida
        updateHealthBar();
        
        // La velocidad NO cambia durante el mismo nivel, solo cuando sube de nivel
    } else if (gameState === 'lifelost') {
        // Durante la cuenta regresiva, solo dibujar el fondo y el personaje
        drawMountains();
        drawFloor();
        drawPlayer();
    }
    
    requestAnimationFrame(gameLoop);
}

// Mostrar pantalla de personalización
startButton.addEventListener('click', () => {
    startScreen.classList.add('hidden');
    characterScreen.classList.remove('hidden');
    // Dibujar preview inicial
    drawCharacterPreview();
});

// Actualizar preview cuando cambian las opciones
if (colorSelect) {
    colorSelect.addEventListener('change', drawCharacterPreview);
}
if (eyeColorSelect) {
    eyeColorSelect.addEventListener('change', drawCharacterPreview);
}
if (mouthSelect) {
    mouthSelect.addEventListener('change', drawCharacterPreview);
}
if (hatSelect) {
    hatSelect.addEventListener('change', drawCharacterPreview);
}

// Iniciar juego con personaje personalizado
if (playButton) {
    playButton.addEventListener('click', async () => {
        // Guardar características del personaje
        if (colorSelect) player.color = colorSelect.value;
        if (eyeColorSelect) player.eyeColor = eyeColorSelect.value;
        if (mouthSelect) player.mouthType = mouthSelect.value;
        if (hatSelect) player.hatType = hatSelect.value;
        
        initAudio(); // Inicializar audio al empezar
        // Asegurar que el audio esté activo antes de empezar la música
        if (audioContext && audioContext.state === 'suspended') {
            await audioContext.resume();
        }
        startBackgroundMusic(); // Iniciar música de fondo
        gameState = 'playing';
        characterScreen.classList.add('hidden');
        scoreDisplay.classList.remove('hidden');
        if (isMobile) {
            touchControls.classList.remove('hidden');
        }
        score = 0;
        playerHealth = 100;
        playerLives = 5; // Resetear vidas a 5
        playerHealthBar = 0; // Resetear barra de vida
        gameSpeed = 0.3; // Velocidad inicial lenta
        currentLevel = 1;
        scoreForNextLevel = 100;
        // Período de adaptación desactivado
        chickenSpawnRate = 0.006; // Frecuencia balanceada
        roosterSpawnRate = 0.0006; // 10% de la frecuencia de gallinas
        fireRoosterSpawnRate = 0.0003; // 5% de la frecuencia de gallinas
        player.x = canvas.width / 2;
        chickens.length = 0;
        roosters.length = 0;
        fireRoosters.length = 0;
        clouds.length = 0;
        foods.length = 0;
        lastDamageTime = 0;
        scoreElement.textContent = score;
        updateHealthBar();
        if (levelElement) levelElement.textContent = currentLevel;
        gameLoop();
    });
}

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
    playerLives = 5; // Resetear vidas a 5
    playerHealthBar = 0; // Resetear barra de vida
    gameSpeed = 0.2; // Velocidad inicial extremadamente reducida
    currentLevel = 1;
    scoreForNextLevel = 100;
    chickenSpawnRate = 0.006; // Frecuencia balanceada
    roosterSpawnRate = 0.0001; // Muy pocos gallos
    fireRoosterSpawnRate = 0.00005; // Muy pocos gallos de fuego
    // Iniciar período de adaptación al reiniciar
    levelStartTime = Date.now();
    adaptationTime = adaptationDuration;
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
    updateHealthBar();
    if (levelElement) levelElement.textContent = currentLevel;
    gameLoop();
});

// Iniciar bucle cuando la página carga
requestAnimationFrame(gameLoop);

