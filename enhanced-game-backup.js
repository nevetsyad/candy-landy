// Enhanced Candy Landy Game - Multiple Levels, Sound Effects, Power-ups, Enemies
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Canvas settings
canvas.width = 800;
canvas.height = 600;

// Game state
let gameState = 'start';
let score = 0;
let highScore = localStorage.getItem('candyLandyHighScore') || 0;
let currentLevel = 0;
let animationFrame = 0;

// Audio Context for sound effects
let audioContext = null;
let backgroundMusic = null;
let isMusicPlaying = false;

// Sound effects (Web Audio API)
const sounds = {
    jump: null,
    collect: null,
    powerup: null,
    hit: null,
    levelComplete: null,
    gameOver: null
};

// Initialize audio
function initAudio() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
}

// Play sound using Web Audio API
function playSound(type) {
    initAudio();

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Apply volume setting
    const volumeGain = SETTINGS.volume;

    switch(type) {
        case 'jump':
            oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.1);
            gainNode.gain.setValueAtTime(0.3 * volumeGain, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
            break;
        case 'collect':
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.1);
            gainNode.gain.setValueAtTime(0.2 * volumeGain, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.15);
            break;
        case 'powerup':
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(500, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(1000, audioContext.currentTime + 0.2);
            oscillator.frequency.exponentialRampToValueAtTime(500, audioContext.currentTime + 0.4);
            gainNode.gain.setValueAtTime(0.3 * volumeGain, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.4);
            break;
        case 'hit':
            oscillator.type = 'sawtooth';
            oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.2);
            gainNode.gain.setValueAtTime(0.4 * volumeGain, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.2);
            break;
        case 'levelComplete':
            oscillator.type = 'square';
            const notes = [523, 659, 784, 1047];
            notes.forEach((freq, i) => {
                const osc = audioContext.createOscillator();
                const gain = audioContext.createGain();
                osc.connect(gain);
                gain.connect(audioContext.destination);
                osc.frequency.setValueAtTime(freq, audioContext.currentTime + i * 0.15);
                gain.gain.setValueAtTime(0.2 * volumeGain, audioContext.currentTime + i * 0.15);
                gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + i * 0.15 + 0.15);
                osc.start(audioContext.currentTime + i * 0.15);
                osc.stop(audioContext.currentTime + i * 0.15 + 0.15);
            });
            break;
        case 'gameOver':
            oscillator.type = 'sawtooth';
            oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.5);
            gainNode.gain.setValueAtTime(0.3 * volumeGain, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
            break;
    }
}

// Background music (simple melody)
let musicInterval = null;
let musicNoteIndex = 0;
const melody = [262, 294, 330, 349, 392, 440, 494, 523];
const melodyDurations = [0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.6];

function startBackgroundMusic() {
    if (isMusicPlaying) return;
    initAudio();
    isMusicPlaying = true;

    function playNextNote() {
        if (!isMusicPlaying) return;

        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.connect(gain);
        gain.connect(audioContext.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(melody[musicNoteIndex], audioContext.currentTime);
        gain.gain.setValueAtTime(0.1 * SETTINGS.volume, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + melodyDurations[musicNoteIndex]);

        osc.start(audioContext.currentTime);
        osc.stop(audioContext.currentTime + melodyDurations[musicNoteIndex]);

        musicNoteIndex = (musicNoteIndex + 1) % melody.length;
        musicInterval = setTimeout(playNextNote, melodyDurations[musicNoteIndex] * 1000);
    }

    playNextNote();
}

function stopBackgroundMusic() {
    isMusicPlaying = false;
    if (musicInterval) {
        clearTimeout(musicInterval);
        musicInterval = null;
    }
}

// Player
let player = {
    x: 100,
    y: 400,
    width: 40,
    height: 60,
    vx: 0,
    vy: 0,
    speed: 5,
    jumpPower: -15,
    grounded: false,
    lives: 3,
    powerUp: null,
    powerUpTimer: 0,
    invincible: false,
    invincibleTimer: 0
};

// Combo and scoring system
let combo = 0;
let comboTimer = 0;
let comboMultiplier = 1;
let timeBonus = 0;

// Power-up types
const POWER_UPS = {
    SPEED: 'speed',
    JUMP: 'jump',
    SHIELD: 'shield',
    DOUBLE_POINTS: 'double'
};

// Particle system for effects
let particles = [];

function createParticles(x, y, color, count = 10) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            life: 1.0,
            color: color,
            size: Math.random() * 6 + 2
        });
    }
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.02;
        p.vy += 0.1; // gravity

        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

function drawParticles() {
    particles.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1.0;
}

// Game settings
const SETTINGS = {
    volume: 0.5,
    comboTimer: 60 // frames to maintain combo
};

// Level definitions with increasing difficulty
const levels = [
    // Level 1: Introduction - Simple platforms
    {
        platforms: [
            { x: 0, y: 550, width: 800, height: 50 },
            { x: 200, y: 450, width: 150, height: 20 },
            { x: 450, y: 350, width: 150, height: 20 },
            { x: 650, y: 250, width: 150, height: 20 }
        ],
        candies: [
            { x: 250, y: 420, collected: false },
            { x: 500, y: 320, collected: false },
            { x: 700, y: 220, collected: false }
        ],
        powerUps: [],
        enemies: [],
        disappearingPlatforms: [],
        goal: { x: 750, y: 200, width: 50, height: 50 }
    },
    // Level 2: Moving elements and more candy
    {
        platforms: [
            { x: 0, y: 550, width: 800, height: 50 },
            { x: 150, y: 450, width: 120, height: 20, moving: true, range: 100, startX: 150 },
            { x: 400, y: 350, width: 120, height: 20, moving: true, range: 80, startX: 400 },
            { x: 600, y: 250, width: 120, height: 20, moving: true, range: 120, startX: 600 },
            { x: 100, y: 250, width: 100, height: 20 }
        ],
        candies: [
            { x: 200, y: 420, collected: false },
            { x: 450, y: 320, collected: false },
            { x: 650, y: 220, collected: false },
            { x: 140, y: 220, collected: false },
            { x: 350, y: 520, collected: false }
        ],
        powerUps: [
            { x: 280, y: 420, type: POWER_UPS.JUMP, collected: false }
        ],
        enemies: [
            { x: 450, y: 310, width: 30, height: 30, vx: 2, range: 100, startX: 450 }
        ],
        disappearingPlatforms: [
            { x: 300, y: 150, width: 100, height: 20, visible: true, timer: 0, cycleTime: 180 }
        ],
        goal: { x: 730, y: 200, width: 50, height: 50 }
    },
    // Level 3: Challenging with enemies and obstacles
    {
        platforms: [
            { x: 0, y: 550, width: 200, height: 50 },
            { x: 300, y: 500, width: 100, height: 20 },
            { x: 500, y: 450, width: 100, height: 20, moving: true, range: 150, startX: 500 },
            { x: 200, y: 350, width: 120, height: 20 },
            { x: 400, y: 300, width: 100, height: 20, moving: true, range: 100, startX: 400 },
            { x: 600, y: 250, width: 100, height: 20 },
            { x: 100, y: 200, width: 150, height: 20 },
            { x: 700, y: 150, width: 100, height: 20 }
        ],
        candies: [
            { x: 340, y: 470, collected: false },
            { x: 540, y: 420, collected: false },
            { x: 250, y: 320, collected: false },
            { x: 440, y: 270, collected: false },
            { x: 640, y: 220, collected: false },
            { x: 170, y: 170, collected: false },
            { x: 740, y: 120, collected: false },
            { x: 100, y: 520, collected: false }
        ],
        powerUps: [
            { x: 270, y: 320, type: POWER_UPS.SPEED, collected: false },
            { x: 750, y: 120, type: POWER_UPS.SHIELD, collected: false },
            { x: 350, y: 520, type: POWER_UPS.DOUBLE_POINTS, collected: false }
        ],
        enemies: [
            { x: 200, y: 320, width: 30, height: 30, vx: 3, range: 120, startX: 200 },
            { x: 600, y: 220, width: 30, height: 30, vx: -2, range: 80, startX: 600 },
            { x: 100, y: 170, width: 30, height: 30, vx: 4, range: 150, startX: 100 }
        ],
        disappearingPlatforms: [
            { x: 400, y: 200, width: 80, height: 20, visible: true, timer: 0, cycleTime: 120 },
            { x: 250, y: 420, width: 80, height: 20, visible: true, timer: 0, cycleTime: 150 },
            { x: 550, y: 350, width: 80, height: 20, visible: true, timer: 0, cycleTime: 90 }
        ],
        goal: { x: 730, y: 100, width: 50, height: 50 }
    }
];

let currentLevelData = null;
let enemies = [];
let powerUps = [];

// Input
let keys = {};

document.addEventListener('keydown', (e) => {
    keys[e.key] = true;

    // Start game
    if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowUp') {
        if (gameState === 'start') {
            gameState = 'playing';
            startBackgroundMusic();
            loadLevel(0);
        }
    }

    // Pause
    if (e.key === 'Escape') {
        if (gameState === 'playing') {
            gameState = 'paused';
            stopBackgroundMusic();
        } else if (gameState === 'paused') {
            gameState = 'playing';
            startBackgroundMusic();
        }
    }

    // Restart
    if (e.key === 'r' || e.key === 'R') {
        if (gameState === 'gameover') {
            gameState = 'start';
            resetGame();
        }
    }

    // Volume control
    if (e.key >= '0' && e.key <= '5') {
        SETTINGS.volume = parseInt(e.key) / 5;
        if (gameState === 'playing') {
            startBackgroundMusic(); // Restart with new volume
        }
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Load level
function loadLevel(levelIndex) {
    if (levelIndex >= levels.length) {
        // Game complete!
        gameState = 'victory';
        stopBackgroundMusic();
        playSound('levelComplete');
        return;
    }

    currentLevel = levelIndex;
    currentLevelData = JSON.parse(JSON.stringify(levels[levelIndex]));

    // Reset player position
    player.x = 100;
    player.y = 400;
    player.vx = 0;
    player.vy = 0;
    player.powerUp = null;
    player.powerUpTimer = 0;
    player.invincible = false;
    player.invincibleTimer = 0;

    // Clear particles
    particles = [];

    // Reset combo system
    combo = 0;
    comboTimer = 0;
    comboMultiplier = 1;
    timeBonus = 0;

    // Initialize enemies
    enemies = currentLevelData.enemies.map(e => ({
        ...e,
        startX: e.startX || e.x
    }));

    // Copy power-ups
    powerUps = [...currentLevelData.powerUps];

    // Initialize disappearing platforms
    if (!currentLevelData.disappearingPlatforms) {
        currentLevelData.disappearingPlatforms = [];
    }
}

// Update functions
function updatePlayer() {
    if (gameState !== 'playing') return;

    // Power-up timer
    if (player.powerUp) {
        player.powerUpTimer--;
        if (player.powerUpTimer <= 0) {
            player.powerUp = null;
        }
    }

    // Invincibility timer
    if (player.invincible) {
        player.invincibleTimer--;
        if (player.invincibleTimer <= 0) {
            player.invincible = false;
        }
    }

    // Combo system update
    if (comboTimer > 0) {
        comboTimer--;
        if (comboTimer === 0) {
            combo = 0;
            comboMultiplier = 1;
        }
    }

    // Movement with power-up speed
    let currentSpeed = player.speed;
    if (player.powerUp === POWER_UPS.SPEED) {
        currentSpeed = 8;
    }

    if (keys['ArrowLeft']) {
        player.vx = -currentSpeed;
    } else if (keys['ArrowRight']) {
        player.vx = currentSpeed;
    } else {
        player.vx *= 0.8;
    }

    // Jump with power-up
    if ((keys[' '] || keys['Enter'] || keys['ArrowUp']) && player.grounded) {
        let jumpPower = player.jumpPower;
        if (player.powerUp === POWER_UPS.JUMP) {
            jumpPower = -20;
        }
        player.vy = jumpPower;
        player.grounded = false;
        playSound('jump');

        // Jump particles
        createParticles(player.x + player.width / 2, player.y + player.height, '#ff69b4', 5);
    }

    // Physics
    player.vy += 0.8;
    player.x += player.vx;
    player.y += player.vy;

    // Screen boundaries
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;

    // Platform collision
    player.grounded = false;
    currentLevelData.platforms.forEach(platform => {
        // Update moving platforms
        if (platform.moving) {
            platform.x = platform.startX + Math.sin(animationFrame * 0.02) * platform.range;
        }

        if (player.x < platform.x + platform.width &&
            player.x + player.width > platform.x &&
            player.y < platform.y + platform.height &&
            player.y + player.height > platform.y) {

            if (player.vy > 0 && player.y < platform.y) {
                player.y = platform.y - player.height;
                player.vy = 0;
                player.grounded = true;
            }
        }
    });

    // Disappearing platforms update and collision
    currentLevelData.disappearingPlatforms.forEach(platform => {
        // Update platform visibility
        platform.timer++;
        if (platform.timer >= platform.cycleTime) {
            platform.visible = !platform.visible;
            platform.timer = 0;
        }

        // Only check collision if platform is visible
        if (platform.visible &&
            player.x < platform.x + platform.width &&
            player.x + player.width > platform.x &&
            player.y < platform.y + platform.height &&
            player.y + player.height > platform.y) {

            if (player.vy > 0 && player.y < platform.y) {
                player.y = platform.y - player.height;
                player.vy = 0;
                player.grounded = true;
            }
        }
    });

    // Disappearing platforms
    if (currentLevelData.disappearingPlatforms) {
        currentLevelData.disappearingPlatforms.forEach(platform => {
            platform.timer++;
            if (platform.timer >= platform.cycleTime) {
                platform.visible = !platform.visible;
                platform.timer = 0;
            }

            if (platform.visible &&
                player.x < platform.x + platform.width &&
                player.x + player.width > platform.x &&
                player.y < platform.y + platform.height &&
                player.y + player.height > platform.y) {

                if (player.vy > 0 && player.y < platform.y) {
                    player.y = platform.y - player.height;
                    player.vy = 0;
                    player.grounded = true;
                }
            }
        });
    }

    // Collect candies
    currentLevelData.candies.forEach(candy => {
        if (!candy.collected &&
            player.x < candy.x + 20 &&
            player.x + player.width > candy.x &&
            player.y < candy.y + 20 &&
            player.y + player.height > candy.y) {

            candy.collected = true;

            // Combo system
            if (comboTimer > 0) {
                combo++;
                comboTimer = SETTINGS.comboTimer;
                comboMultiplier = Math.min(combo, 5); // Max 5x multiplier
            } else {
                combo = 1;
                comboTimer = SETTINGS.comboTimer;
                comboMultiplier = 1;
            }

            let points = 10 * comboMultiplier;
            if (player.powerUp === POWER_UPS.DOUBLE_POINTS) {
                points = 20 * comboMultiplier;
            }
            score += points;

            // Time bonus for quick collection
            if (combo >= 3) {
                timeBonus += combo * 5;
                score += timeBonus;
                createParticles(candy.x + 10, candy.y + 10, '#00ff00', 5);
            }

            playSound('collect');
            createParticles(candy.x + 10, candy.y + 10, '#ffd700', 8);
        }
    });

    // Collect power-ups
    powerUps.forEach((powerUp, index) => {
        if (!powerUp.collected &&
            player.x < powerUp.x + 20 &&
            player.x + player.width > powerUp.x &&
            player.y < powerUp.y + 20 &&
            player.y + player.height > powerUp.y) {

            powerUp.collected = true;
            player.powerUp = powerUp.type;
            player.powerUpTimer = 300; // 5 seconds at 60fps
            playSound('powerup');
            createParticles(powerUp.x + 10, powerUp.y + 10, '#00ff00', 12);
        }
    });

    // Update and check enemies
    enemies.forEach(enemy => {
        // Move enemy
        enemy.x += enemy.vx;

        // Reverse at range
        if (Math.abs(enemy.x - enemy.startX) > enemy.range) {
            enemy.vx *= -1;
        }

        // Check collision with player
        if (!player.invincible &&
            player.x < enemy.x + enemy.width &&
            player.x + player.width > enemy.x &&
            player.y < enemy.y + enemy.height &&
            player.y + player.height > enemy.y) {

            if (player.powerUp === POWER_UPS.SHIELD) {
                // Shield protects, but deactivates power-up
                player.powerUp = null;
                player.invincible = true;
                player.invincibleTimer = 60; // 1 second
                playSound('powerup');
            } else {
                // Take damage
                player.lives--;
                playSound('hit');
                createParticles(player.x + player.width / 2, player.y + player.height / 2, '#ff0000', 15);

                if (player.lives <= 0) {
                    gameState = 'gameover';
                    stopBackgroundMusic();
                    playSound('gameOver');

                    // Update high score
                    if (score > highScore) {
                        highScore = score;
                        localStorage.setItem('candyLandyHighScore', highScore);
                    }
                } else {
                    // Reset position
                    player.x = 100;
                    player.y = 400;
                    player.vx = 0;
                    player.vy = 0;
                    player.invincible = true;
                    player.invincibleTimer = 120; // 2 seconds
                }
            }
        }
    });

    // Check goal (level complete)
    const goal = currentLevelData.goal;
    if (player.x < goal.x + goal.width &&
        player.x + player.width > goal.x &&
        player.y < goal.y + goal.height &&
        player.y + player.height > goal.y) {

        // Check if all candies collected
        const allCollected = currentLevelData.candies.every(c => c.collected);

        if (allCollected) {
            playSound('levelComplete');
            loadLevel(currentLevel + 1);
        }
    }

    // Reset if fall off screen
    if (player.y > 600) {
        player.lives--;
        playSound('hit');

        if (player.lives <= 0) {
            gameState = 'gameover';
            stopBackgroundMusic();
            playSound('gameOver');

            if (score > highScore) {
                highScore = score;
                localStorage.setItem('candyLandyHighScore', highScore);
            }
        } else {
            player.x = 100;
            player.y = 400;
            player.vx = 0;
            player.vy = 0;
            player.invincible = true;
            player.invincibleTimer = 120;
        }
    }

    // Update particles
    updateParticles();
}

function resetGame() {
    player.x = 100;
    player.y = 400;
    player.vx = 0;
    player.vy = 0;
    player.lives = 3;
    player.powerUp = null;
    player.powerUpTimer = 0;
    player.invincible = false;
    player.invincibleTimer = 0;
    score = 0;
    currentLevel = 0;
    particles = [];
    combo = 0;
    comboTimer = 0;
    comboMultiplier = 1;
    timeBonus = 0;
    stopBackgroundMusic();
}

// Drawing functions
function drawStartScreen() {
    // Gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(1, '#E0F7FA');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Animated clouds
    const cloudOffset = Math.sin(animationFrame * 0.01) * 20;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    drawCloud(100 + cloudOffset, 80, 60);
    drawCloud(400 - cloudOffset, 120, 80);
    drawCloud(650 + cloudOffset, 60, 70);

    // Title with shadow
    ctx.fillStyle = '#ff1493';
    ctx.font = 'bold 56px Comic Sans MS';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#ff69b4';
    ctx.shadowBlur = 10;
    ctx.fillText('🍬 Candy Landy 🍬', canvas.width / 2, 150);
    ctx.shadowBlur = 0;

    // Subtitle
    ctx.fillStyle = '#ff69b4';
    ctx.font = '24px Comic Sans MS';
    ctx.fillText('Enhanced Edition!', canvas.width / 2, 190);

    // Instructions
    ctx.fillStyle = '#333';
    ctx.font = '22px Comic Sans MS';
    ctx.fillText('Press SPACE, ENTER, or UP ARROW to Start!', canvas.width / 2, 280);

    // Controls box
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillRect(200, 320, 400, 180);
    ctx.strokeStyle = '#ff69b4';
    ctx.lineWidth = 3;
    ctx.strokeRect(200, 320, 400, 180);

    ctx.fillStyle = '#333';
    ctx.font = '18px Comic Sans MS';
    ctx.textAlign = 'left';
    ctx.fillText('⬅️ ➡️ Arrow Keys - Move', 230, 355);
    ctx.fillText('⬆️ SPACE - Jump', 230, 385);
    ctx.fillText('🍬 Collect all candies to advance', 230, 415);
    ctx.fillText('⚠️ Avoid enemies and don\'t fall!', 230, 445);
    ctx.fillText('🔊 Keys 0-5 - Adjust volume', 230, 475);

    // High score
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff1493';
    ctx.font = '20px Comic Sans MS';
    ctx.fillText('🏆 High Score: ' + highScore, canvas.width / 2, 520);

    // Animated character
    const bounce = Math.sin(animationFrame * 0.1) * 10;
    drawCharacter(canvas.width / 2, 480 + bounce);
}

function drawCloud(x, y, size) {
    ctx.beginPath();
    ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
    ctx.arc(x + size * 0.4, y - size * 0.1, size * 0.4, 0, Math.PI * 2);
    ctx.arc(x + size * 0.8, y, size * 0.5, 0, Math.PI * 2);
    ctx.arc(x + size * 0.4, y + size * 0.2, size * 0.4, 0, Math.PI * 2);
    ctx.fill();
}

function drawCharacter(x, y) {
    // Body
    ctx.fillStyle = '#ff69b4';
    ctx.fillRect(x - 20, y, 40, 60);

    // Hat
    ctx.fillStyle = '#8b4513';
    ctx.fillRect(x - 25, y - 10, 50, 10);

    // Head with animation
    ctx.fillStyle = '#ffd699';
    ctx.beginPath();
    ctx.arc(x, y - 20, 18, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.arc(x - 6, y - 22, 4, 0, Math.PI * 2);
    ctx.arc(x + 6, y - 22, 4, 0, Math.PI * 2);
    ctx.fill();

    // Smile
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y - 18, 8, 0.1 * Math.PI, 0.9 * Math.PI);
    ctx.stroke();
}

function drawGame() {
    // Gradient sky background
    const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    skyGradient.addColorStop(0, '#87CEEB');
    skyGradient.addColorStop(1, '#E0F7FA');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Animated clouds
    const cloudOffset = Math.sin(animationFrame * 0.01) * 20;
    drawCloud(80 + cloudOffset, 50, 50);
    drawCloud(350 - cloudOffset, 80, 60);
    drawCloud(600 + cloudOffset, 40, 55);

    // Draw platforms with gradient
    currentLevelData.platforms.forEach(platform => {
        const platGradient = ctx.createLinearGradient(platform.x, platform.y, platform.x, platform.y + platform.height);
        platGradient.addColorStop(0, '#ff69b4');
        platGradient.addColorStop(1, '#ff1493');
        ctx.fillStyle = platGradient;
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);

        // Platform highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(platform.x, platform.y, platform.width, 5);

        // Platform shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.fillRect(platform.x, platform.y + platform.height - 3, platform.width, 3);
    });

    // Draw disappearing platforms
    currentLevelData.disappearingPlatforms.forEach(platform => {
        if (platform.visible) {
            // Calculate fade effect based on timer
            const fadeProgress = platform.timer / platform.cycleTime;
            const alpha = fadeProgress < 0.2 ? fadeProgress / 0.2 : (fadeProgress > 0.8 ? (1 - fadeProgress) / 0.2 : 1);

            const platGradient = ctx.createLinearGradient(platform.x, platform.y, platform.x, platform.y + platform.height);
            platGradient.addColorStop(0, `rgba(255, 100, 100, ${alpha})`);
            platGradient.addColorStop(1, `rgba(200, 50, 50, ${alpha})`);
            ctx.fillStyle = platGradient;
            ctx.fillRect(platform.x, platform.y, platform.width, platform.height);

            // Platform warning border
            if (fadeProgress > 0.7) {
                ctx.strokeStyle = `rgba(255, 0, 0, ${1 - fadeProgress})`;
                ctx.lineWidth = 3;
                ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
            }

            // Platform highlight
            ctx.fillStyle = `rgba(255, 255, 255, ${0.3 * alpha})`;
            ctx.fillRect(platform.x, platform.y, platform.width, 5);
        }
    });

    // Draw disappearing platforms
    if (currentLevelData.disappearingPlatforms) {
        currentLevelData.disappearingPlatforms.forEach(platform => {
            if (platform.visible) {
                const alpha = 1 - (platform.timer / platform.cycleTime) * 0.3;
                ctx.fillStyle = `rgba(255, 165, 0, ${alpha})`;
                ctx.fillRect(platform.x, platform.y, platform.width, platform.height);

                // Warning glow when about to disappear
                if (platform.timer > platform.cycleTime - 30) {
                    ctx.fillStyle = `rgba(255, 0, 0, ${0.3 + Math.sin(animationFrame * 0.5) * 0.3})`;
                    ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
                }

                // Platform highlight
                ctx.fillStyle = `rgba(255, 255, 255, ${0.3 * alpha})`;
                ctx.fillRect(platform.x, platform.y, platform.width, 5);

                // Platform shadow
                ctx.fillStyle = `rgba(0, 0, 0, ${0.1 * alpha})`;
                ctx.fillRect(platform.x, platform.y + platform.height - 3, platform.width, 3);
            }
        });
    }

    // Draw candies with animation
    currentLevelData.candies.forEach((candy, index) => {
        if (!candy.collected) {
            const bounce = Math.sin(animationFrame * 0.05 + index) * 3;

            // Candy glow
            ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
            ctx.beginPath();
            ctx.arc(candy.x + 10, candy.y + 10 + bounce, 15, 0, Math.PI * 2);
            ctx.fill();

            // Candy
            ctx.fillStyle = '#ffd700';
            ctx.beginPath();
            ctx.arc(candy.x + 10, candy.y + 10 + bounce, 10, 0, Math.PI * 2);
            ctx.fill();

            // Candy shine
            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.beginPath();
            ctx.arc(candy.x + 7, candy.y + 7 + bounce, 3, 0, Math.PI * 2);
            ctx.fill();

            // Candy wrapper
            ctx.strokeStyle = '#ff69b4';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(candy.x + 10, candy.y + 10 + bounce, 10, 0, Math.PI * 2);
            ctx.stroke();
        }
    });

    // Draw power-ups
    powerUps.forEach(powerUp => {
        if (!powerUp.collected) {
            const bounce = Math.sin(animationFrame * 0.08) * 5;

            // Power-up glow
            let glowColor;
            switch(powerUp.type) {
                case POWER_UPS.JUMP: glowColor = 'rgba(0, 255, 255, 0.3)'; break;
                case POWER_UPS.SPEED: glowColor = 'rgba(255, 255, 0, 0.3)'; break;
                case POWER_UPS.SHIELD: glowColor = 'rgba(0, 255, 0, 0.3)'; break;
                case POWER_UPS.DOUBLE_POINTS: glowColor = 'rgba(255, 0, 255, 0.3)'; break;
            }
            ctx.fillStyle = glowColor;
            ctx.beginPath();
            ctx.arc(powerUp.x + 10, powerUp.y + 10 + bounce, 18, 0, Math.PI * 2);
            ctx.fill();

            // Power-up icon
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(powerUp.x + 10, powerUp.y + 10 + bounce, 12, 0, Math.PI * 2);
            ctx.fill();

            // Power-up symbol
            ctx.fillStyle = '#333';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('⚡', powerUp.x + 10, powerUp.y + 15 + bounce);
        }
    });

    // Draw enemies
    enemies.forEach(enemy => {
        // Enemy body
        ctx.fillStyle = '#ff4444';
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);

        // Enemy eyes
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(enemy.x + 10, enemy.y + 10, 5, 0, Math.PI * 2);
        ctx.arc(enemy.x + 20, enemy.y + 10, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(enemy.x + 10, enemy.y + 10, 2, 0, Math.PI * 2);
        ctx.arc(enemy.x + 20, enemy.y + 10, 2, 0, Math.PI * 2);
        ctx.fill();

        // Enemy angry mouth
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(enemy.x + 15, enemy.y + 20, 6, 0, Math.PI);
        ctx.stroke();
    });

    // Draw goal
    const goal = currentLevelData.goal;
    const goalBounce = Math.sin(animationFrame * 0.03) * 5;

    // Goal glow
    ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
    ctx.fillRect(goal.x - 5, goal.y - 5 + goalBounce, goal.width + 10, goal.height + 10);

    // Goal box
    ctx.fillStyle = '#00ff00';
    ctx.fillRect(goal.x, goal.y + goalBounce, goal.width, goal.height);

    // Goal star
    ctx.fillStyle = '#ffff00';
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('⭐', goal.x + goal.width / 2, goal.y + 35 + goalBounce);

    // Draw particles
    drawParticles();

    // Draw player with power-up effects
    drawPlayer();

    // HUD
    drawHUD();
}

function drawPlayer() {
    let playerColor = '#ff69b4';
    let hasGlow = false;

    // Power-up visual effects
    if (player.powerUp === POWER_UPS.SPEED) {
        hasGlow = true;
        ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
        ctx.beginPath();
        ctx.arc(player.x + player.width / 2, player.y + player.height / 2, 40, 0, Math.PI * 2);
        ctx.fill();
    } else if (player.powerUp === POWER_UPS.JUMP) {
        hasGlow = true;
        ctx.fillStyle = 'rgba(0, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.arc(player.x + player.width / 2, player.y + player.height / 2, 40, 0, Math.PI * 2);
        ctx.fill();
    } else if (player.powerUp === POWER_UPS.SHIELD) {
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(player.x + player.width / 2, player.y + player.height / 2, 35, 0, Math.PI * 2);
        ctx.stroke();
    } else if (player.powerUp === POWER_UPS.DOUBLE_POINTS) {
        hasGlow = true;
        ctx.fillStyle = 'rgba(255, 0, 255, 0.3)';
        ctx.beginPath();
        ctx.arc(player.x + player.width / 2, player.y + player.height / 2, 40, 0, Math.PI * 2);
        ctx.fill();
    }

    // Invincibility blinking
    if (player.invincible && Math.floor(animationFrame / 5) % 2 === 0) {
        return; // Don't draw when blinking
    }

    // Pigtails animation (swaying)
    const pigtailSway = Math.sin(animationFrame * 0.15) * 5;

    // Left pigtail
    ctx.fillStyle = '#ffd699';
    ctx.beginPath();
    ctx.moveTo(player.x + 5, player.y - 5);
    ctx.lineTo(player.x - 5 - pigtailSway, player.y + 15);
    ctx.lineTo(player.x - 3 - pigtailSway, player.y + 15);
    ctx.lineTo(player.x + 8, player.y - 5);
    ctx.fill();

    // Right pigtail
    ctx.beginPath();
    ctx.moveTo(player.x + 35, player.y - 5);
    ctx.lineTo(player.x + 45 + pigtailSway, player.y + 15);
    ctx.lineTo(player.x + 43 + pigtailSway, player.y + 15);
    ctx.lineTo(player.x + 33, player.y - 5);
    ctx.fill();

    // Body
    const bodyGradient = ctx.createLinearGradient(player.x, player.y, player.x + player.width, player.y);
    bodyGradient.addColorStop(0, '#ff69b4');
    bodyGradient.addColorStop(1, '#ff1493');
    ctx.fillStyle = bodyGradient;
    ctx.fillRect(player.x, player.y, player.width, player.height);

    // Body highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(player.x, player.y, 10, player.height);

    // Legs animation (when moving)
    const legAnimation = Math.abs(player.vx) > 0.1 ? Math.sin(animationFrame * 0.3) * 3 : 0;

    // Left leg
    ctx.fillStyle = '#333';
    ctx.fillRect(player.x + 10, player.y + player.height - 5 + legAnimation, 8, 10);

    // Right leg
    ctx.fillRect(player.x + 22, player.y + player.height - 5 - legAnimation, 8, 10);

    // Arms animation (swing with movement)
    const armSwing = Math.abs(player.vx) > 0.1 ? Math.sin(animationFrame * 0.3) * 10 : 0;

    // Left arm
    ctx.fillStyle = '#ff69b4';
    ctx.fillRect(player.x - 5 + armSwing, player.y + 10, 8, 20);

    // Right arm
    ctx.fillRect(player.x + player.width - 3 - armSwing, player.y + 10, 8, 20);

    // Hat
    ctx.fillStyle = '#8b4513';
    ctx.fillRect(player.x - 5, player.y - 10, 50, 10);
    ctx.fillRect(player.x + 15, player.y - 25, 15, 20);

    // Head
    ctx.fillStyle = '#ffd699';
    ctx.beginPath();
    ctx.arc(player.x + 20, player.y - 15, 15, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.arc(player.x + 15, player.y - 17, 3, 0, Math.PI * 2);
    ctx.arc(player.x + 25, player.y - 17, 3, 0, Math.PI * 2);
    ctx.fill();

    // Smile
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(player.x + 20, player.y - 12, 6, 0.1 * Math.PI, 0.9 * Math.PI);
    ctx.stroke();
}

function drawHUD() {
    // HUD background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillRect(10, 10, 280, 130);
    ctx.strokeStyle = '#ff69b4';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, 280, 130);

    // Score
    ctx.fillStyle = '#ff1493';
    ctx.font = 'bold 20px Comic Sans MS';
    ctx.textAlign = 'left';
    ctx.fillText('🍬 Score: ' + score, 20, 40);

    // Lives
    ctx.fillText('❤️ Lives: ' + '❤️'.repeat(player.lives), 20, 65);

    // Level
    ctx.fillText('🎮 Level: ' + (currentLevel + 1) + '/' + levels.length, 20, 90);

    // Candies remaining
    const collected = currentLevelData.candies.filter(c => c.collected).length;
    const total = currentLevelData.candies.length;
    ctx.fillText('🍭 Candies: ' + collected + '/' + total, 20, 115);

    // Combo display
    if (combo > 1) {
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 18px Comic Sans MS';
        ctx.fillText('🔥 ' + combo + 'x COMBO!', 20, 140);
    }

    // Time bonus
    if (timeBonus > 0) {
        ctx.fillStyle = '#00ff00';
        ctx.font = '16px Comic Sans MS';
        ctx.fillText('⏱️ Bonus: +' + timeBonus, 20, 160);
    }

    // Power-up indicator
    if (player.powerUp) {
        ctx.fillStyle = 'rgba(0, 255, 0, 0.9)';
        ctx.fillRect(canvas.width - 120, 10, 110, 40);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px Comic Sans MS';
        ctx.textAlign = 'center';
        ctx.fillText('⚡ ' + player.powerUp.toUpperCase(), canvas.width - 65, 35);
    }

    // Volume indicator
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillRect(canvas.width - 120, 55, 110, 25);
    ctx.fillStyle = '#333';
    ctx.font = '12px Comic Sans MS';
    ctx.fillText('🔊 ' + Math.round(SETTINGS.volume * 100) + '% (0-5)', canvas.width - 65, 72);

    // High score
    ctx.fillStyle = '#ff1493';
    ctx.font = '16px Comic Sans MS';
    ctx.textAlign = 'right';
    ctx.fillText('🏆 Best: ' + highScore, canvas.width - 20, 590);
}

function drawPauseScreen() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 48px Comic Sans MS';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#ff69b4';
    ctx.shadowBlur = 20;
    ctx.fillText('⏸️ PAUSED', canvas.width / 2, canvas.height / 2);
    ctx.shadowBlur = 0;
    
    ctx.font = '24px Comic Sans MS';
    ctx.fillText('Press ESC to Resume', canvas.width / 2, canvas.height / 2 + 60);
    ctx.fillText('Keys 0-5 to Adjust Volume', canvas.width / 2, canvas.height / 2 + 90);
    
    // Volume indicator
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillRect(canvas.width - 120, 10, 110, 30);
    ctx.fillStyle = '#333';
    ctx.font = '14px Comic Sans MS';
    ctx.fillText('Volume: ' + Math.round(SETTINGS.volume * 100) + '%', canvas.width - 65, 30);
}

function drawGameOverScreen() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#ff4444';
    ctx.font = 'bold 56px Comic Sans MS';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur = 20;
    ctx.fillText('💀 GAME OVER', canvas.width / 2, 200);
    ctx.shadowBlur = 0;

    // Final score
    ctx.fillStyle = '#fff';
    ctx.font = '32px Comic Sans MS';
    ctx.fillText('Score: ' + score, canvas.width / 2, 280);

    // Combo stats
    ctx.fillStyle = '#ffd700';
    ctx.font = '24px Comic Sans MS';
    ctx.fillText('🔥 Max Combo: ' + combo + 'x', canvas.width / 2, 320);

    if (timeBonus > 0) {
        ctx.fillText('⏱️ Time Bonus: ' + timeBonus, canvas.width / 2, 350);
    }

    // High score message
    if (score >= highScore) {
        ctx.fillStyle = '#ffd700';
        ctx.fillText('🎉 NEW HIGH SCORE! 🎉', canvas.width / 2, 400);
    }

    // Restart instruction
    ctx.fillStyle = '#fff';
    ctx.font = '24px Comic Sans MS';
    ctx.fillText('Press R to Restart', canvas.width / 2, 460);

    // Volume indicator
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillRect(canvas.width - 120, 10, 110, 30);
    ctx.fillStyle = '#333';
    ctx.font = '14px Comic Sans MS';
    ctx.fillText('Volume: ' + Math.round(SETTINGS.volume * 100) + '%', canvas.width - 65, 30);
}

function drawVictoryScreen() {
    // Enhanced confetti particles
    if (animationFrame % 3 === 0) {
        const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ff69b4', '#ffd700'];
        for (let i = 0; i < 5; i++) {
            createParticles(
                Math.random() * canvas.width,
                -10,
                colors[Math.floor(Math.random() * colors.length)],
                Math.floor(Math.random() * 3) + 2
            );
        }
    }
    updateParticles();
    drawParticles();

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Victory glow effect
    const glowSize = 50 + Math.sin(animationFrame * 0.05) * 10;
    const glowGradient = ctx.createRadialGradient(canvas.width / 2, 150, 0, canvas.width / 2, 150, glowSize);
    glowGradient.addColorStop(0, 'rgba(255, 215, 0, 0.8)');
    glowGradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
    ctx.fillStyle = glowGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 56px Comic Sans MS';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#ffff00';
    ctx.shadowBlur = 20;
    ctx.fillText('🎊 YOU WIN! 🎊', canvas.width / 2, 200);
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#fff';
    ctx.font = '28px Comic Sans MS';
    ctx.fillText('Final Score: ' + score, canvas.width / 2, 280);

    // Show combo stats if achieved
    if (combo > 0) {
        ctx.fillStyle = '#00ff00';
        ctx.font = '24px Comic Sans MS';
        ctx.fillText('Best Combo: ' + combo + 'x', canvas.width / 2, 320);
    }

    if (score >= highScore) {
        ctx.fillStyle = '#ffd700';
        ctx.fillText('🏆 NEW HIGH SCORE! 🏆', canvas.width / 2, 360);
    }

    ctx.fillStyle = '#fff';
    ctx.font = '24px Comic Sans MS';
    ctx.fillText('Press R to Play Again', canvas.width / 2, 420);

    // Volume indicator
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillRect(canvas.width - 120, 10, 110, 30);
    ctx.fillStyle = '#333';
    ctx.font = '14px Comic Sans MS';
    ctx.textAlign = 'center';
    ctx.fillText('Volume: ' + Math.round(SETTINGS.volume * 100) + '%', canvas.width - 65, 30);
}

// Game loop
function gameLoop() {
    animationFrame++;

    if (gameState === 'start') {
        drawStartScreen();
    } else if (gameState === 'playing') {
        updatePlayer();
        drawGame();
    } else if (gameState === 'paused') {
        drawGame();
        drawPauseScreen();
    } else if (gameState === 'gameover') {
        drawGame();
        drawGameOverScreen();
    } else if (gameState === 'victory') {
        drawGame();
        drawVictoryScreen();
    }

    requestAnimationFrame(gameLoop);
}

// Start the game
gameLoop();
