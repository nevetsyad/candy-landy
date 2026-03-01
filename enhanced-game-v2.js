// Enhanced Candy Landy Game v2.0 - Performance Optimized
// Features: AudioManager, Object Pooling, Delta Time, Better Physics

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Canvas settings
canvas.width = 800;
canvas.height = 600;

// Focus handling - make canvas focusable
canvas.setAttribute('tabindex', '0');
canvas.setAttribute('autofocus', 'true');

// Track focus state for visual feedback
let canvasHasFocus = false;
let showFocusMessage = false;

// Update focus state
function updateFocusState() {
    canvasHasFocus = document.activeElement === canvas;
    showFocusMessage = !canvasHasFocus && (gameState === 'playing' || gameState === 'paused');
}

// Focus canvas on page load
window.addEventListener('load', () => {
    setTimeout(() => {
        canvas.focus();
        updateFocusState();
        console.log('Candy Landy canvas focused. Press SPACE, ENTER, or UP ARROW to start!');
    }, 100);
});

// Click handler to ensure canvas gets focus
canvas.addEventListener('click', (e) => {
    if (!canvasHasFocus) {
        canvas.focus();
        updateFocusState();
    }
});

// Track focus changes
canvas.addEventListener('focus', () => {
    canvasHasFocus = true;
    showFocusMessage = false;
});

canvas.addEventListener('blur', () => {
    updateFocusState();
    // Auto-refocus during gameplay
    if (gameState === 'playing' || gameState === 'paused') {
        setTimeout(() => {
            if (gameState === 'playing' || gameState === 'paused') {
                canvas.focus();
            }
        }, 100);
    }
});

// Handle keyboard events even if canvas isn't focused
document.addEventListener('keydown', (e) => {
    // Prevent default for game keys
    if ([' ', 'Enter', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
    }
    
    // Handle start/gameover/victory states
    if (gameState === 'start' || gameState === 'gameover' || gameState === 'victory') {
        if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowUp') {
            if (gameState === 'start') {
                gameState = 'playing';
                audioManager.startBackgroundMusic();
                loadLevel(0);
            } else if (gameState === 'gameover' || gameState === 'victory') {
                gameState = 'start';
                resetGame();
            }
        }
    }
});

// ============================================================================
// AUDIO MANAGER CLASS
// ============================================================================
class AudioManager {
    constructor() {
        this.context = null;
        this.masterVolume = 0.5;
        this.sfxVolume = 1.0;
        this.musicVolume = 0.3;
        this.isMusicPlaying = false;
        this.musicInterval = null;
        this.musicNoteIndex = 0;
        this.initialized = false;
        
        // Note frequencies for music
        this.melody = [262, 294, 330, 349, 392, 440, 494, 523, 587, 659, 698, 784, 880, 988, 1047];
        this.melodyDurations = [0.25, 0.25, 0.25, 0.25, 0.3, 0.3, 0.3, 0.4, 0.3, 0.3, 0.25, 0.25, 0.3, 0.3, 0.5];
        this.chordProgression = [
            [262, 330, 392], // C major
            [294, 369, 440], // D minor
            [330, 415, 494], // E minor
            [349, 440, 523], // F major
            [392, 494, 588], // G major
            [440, 554, 659], // A minor
            [494, 622, 740], // B diminished
            [523, 659, 784]  // C major
        ];
    }

    init() {
        if (!this.initialized) {
            try {
                this.context = new (window.AudioContext || window.webkitAudioContext)();
                this.initialized = true;
            } catch (e) {
                console.warn('Web Audio API not supported');
            }
        }
        return this.initialized;
    }

    resume() {
        if (this.context && this.context.state === 'suspended') {
            this.context.resume();
        }
    }

    setVolume(level) {
        this.masterVolume = Math.max(0, Math.min(1, level));
    }

    playSound(type) {
        if (!this.init()) return;
        this.resume();

        const oscillator = this.context.createOscillator();
        const gainNode = this.context.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.context.destination);

        const volume = this.masterVolume * this.sfxVolume;

        switch(type) {
            case 'jump':
                oscillator.frequency.setValueAtTime(400, this.context.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(600, this.context.currentTime + 0.1);
                gainNode.gain.setValueAtTime(0.3 * volume, this.context.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.1);
                oscillator.start(this.context.currentTime);
                oscillator.stop(this.context.currentTime + 0.1);
                break;
            case 'collect':
                oscillator.frequency.setValueAtTime(800, this.context.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(1200, this.context.currentTime + 0.1);
                gainNode.gain.setValueAtTime(0.2 * volume, this.context.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.15);
                oscillator.start(this.context.currentTime);
                oscillator.stop(this.context.currentTime + 0.15);
                break;
            case 'powerup':
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(500, this.context.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(1000, this.context.currentTime + 0.2);
                oscillator.frequency.exponentialRampToValueAtTime(500, this.context.currentTime + 0.4);
                gainNode.gain.setValueAtTime(0.3 * volume, this.context.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.4);
                oscillator.start(this.context.currentTime);
                oscillator.stop(this.context.currentTime + 0.4);
                break;
            case 'hit':
                oscillator.type = 'sawtooth';
                oscillator.frequency.setValueAtTime(200, this.context.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(100, this.context.currentTime + 0.2);
                gainNode.gain.setValueAtTime(0.4 * volume, this.context.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.2);
                oscillator.start(this.context.currentTime);
                oscillator.stop(this.context.currentTime + 0.2);
                break;
            case 'levelComplete':
                oscillator.type = 'square';
                const notes = [523, 659, 784, 1047];
                notes.forEach((freq, i) => {
                    const osc = this.context.createOscillator();
                    const gain = this.context.createGain();
                    osc.connect(gain);
                    gain.connect(this.context.destination);
                    osc.frequency.setValueAtTime(freq, this.context.currentTime + i * 0.15);
                    gain.gain.setValueAtTime(0.2 * volume, this.context.currentTime + i * 0.15);
                    gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + i * 0.15 + 0.15);
                    osc.start(this.context.currentTime + i * 0.15);
                    osc.stop(this.context.currentTime + i * 0.15 + 0.15);
                });
                break;
            case 'gameOver':
                oscillator.type = 'sawtooth';
                oscillator.frequency.setValueAtTime(400, this.context.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(100, this.context.currentTime + 0.5);
                gainNode.gain.setValueAtTime(0.3 * volume, this.context.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.5);
                oscillator.start(this.context.currentTime);
                oscillator.stop(this.context.currentTime + 0.5);
                break;
            case 'combo':
                const comboNotes = [523, 659, 784, 1047, 1319];
                comboNotes.forEach((freq, i) => {
                    const osc = this.context.createOscillator();
                    const gain = this.context.createGain();
                    osc.connect(gain);
                    gain.connect(this.context.destination);
                    osc.frequency.setValueAtTime(freq, this.context.currentTime + i * 0.1);
                    gain.gain.setValueAtTime(0.15 * volume, this.context.currentTime + i * 0.1);
                    gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + i * 0.1 + 0.1);
                    osc.start(this.context.currentTime + i * 0.1);
                    osc.stop(this.context.currentTime + i * 0.1 + 0.1);
                });
                break;
            case 'shield':
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(800, this.context.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(400, this.context.currentTime + 0.3);
                gainNode.gain.setValueAtTime(0.4 * volume, this.context.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.3);
                oscillator.start(this.context.currentTime);
                oscillator.stop(this.context.currentTime + 0.3);
                break;
            case 'enemyHit':
                oscillator.type = 'triangle';
                oscillator.frequency.setValueAtTime(300, this.context.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(150, this.context.currentTime + 0.2);
                gainNode.gain.setValueAtTime(0.5 * volume, this.context.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.2);
                oscillator.start(this.context.currentTime);
                oscillator.stop(this.context.currentTime + 0.2);
                break;
        }
    }

    startBackgroundMusic() {
        if (this.isMusicPlaying || !this.init()) return;
        this.resume();
        this.isMusicPlaying = true;

        const playNextNote = () => {
            if (!this.isMusicPlaying) return;

            const chordIndex = Math.floor(this.musicNoteIndex / 2) % this.chordProgression.length;
            const chord = this.chordProgression[chordIndex];

            chord.forEach((freq, i) => {
                const osc = this.context.createOscillator();
                const gain = this.context.createGain();
                osc.connect(gain);
                gain.connect(this.context.destination);

                osc.type = 'sine';
                const noteDelay = i * 0.02;
                osc.frequency.setValueAtTime(freq, this.context.currentTime + noteDelay);
                gain.gain.setValueAtTime(0.08 * this.masterVolume * this.musicVolume, this.context.currentTime + noteDelay);
                gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + this.melodyDurations[this.musicNoteIndex]);

                osc.start(this.context.currentTime + noteDelay);
                osc.stop(this.context.currentTime + this.melodyDurations[this.musicNoteIndex] + noteDelay);
            });

            if (this.musicNoteIndex % 4 === 0) {
                const bassOsc = this.context.createOscillator();
                const bassGain = this.context.createGain();
                bassOsc.connect(bassGain);
                bassGain.connect(this.context.destination);

                bassOsc.type = 'sine';
                const bassFreq = chord[0] / 2;
                bassOsc.frequency.setValueAtTime(bassFreq, this.context.currentTime);
                bassGain.gain.setValueAtTime(0.05 * this.masterVolume * this.musicVolume, this.context.currentTime);
                bassGain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.5);

                bassOsc.start(this.context.currentTime);
                bassOsc.stop(this.context.currentTime + 0.5);
            }

            this.musicNoteIndex = (this.musicNoteIndex + 1) % this.melody.length;
            this.musicInterval = setTimeout(playNextNote, this.melodyDurations[this.musicNoteIndex] * 1000);
        };

        playNextNote();
    }

    stopBackgroundMusic() {
        this.isMusicPlaying = false;
        if (this.musicInterval) {
            clearTimeout(this.musicInterval);
            this.musicInterval = null;
        }
    }
}

// ============================================================================
// PARTICLE POOL CLASS - Object Pooling for Performance
// ============================================================================
class ParticlePool {
    constructor(size = 200) {
        this.pool = [];
        this.activeParticles = [];
        
        // Pre-allocate particles
        for (let i = 0; i < size; i++) {
            this.pool.push(this.createParticle());
        }
    }

    createParticle() {
        return {
            x: 0, y: 0,
            vx: 0, vy: 0,
            life: 0, maxLife: 1,
            color: '#fff',
            size: 4,
            gravity: 0.1,
            fade: 0.02,
            shape: 'circle',
            rotation: 0,
            rotationSpeed: 0,
            active: false
        };
    }

    get() {
        // Get from pool or create new
        let particle = this.pool.pop();
        if (!particle) {
            particle = this.createParticle();
        }
        particle.active = true;
        this.activeParticles.push(particle);
        return particle;
    }

    release(particle) {
        particle.active = false;
        const index = this.activeParticles.indexOf(particle);
        if (index > -1) {
            this.activeParticles.splice(index, 1);
            this.pool.push(particle);
        }
    }

    update(dt = 1) {
        for (let i = this.activeParticles.length - 1; i >= 0; i--) {
            const p = this.activeParticles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += p.gravity * dt;
            p.life -= p.fade * dt;
            
            if (p.rotation !== undefined) {
                p.rotation += p.rotationSpeed * dt;
            }

            if (p.life <= 0) {
                this.release(p);
            }
        }
    }

    draw(ctx) {
        this.activeParticles.forEach(p => {
            ctx.globalAlpha = p.life / p.maxLife;
            ctx.fillStyle = p.color;

            ctx.save();
            ctx.translate(p.x, p.y);

            if (p.rotation !== undefined) {
                ctx.rotate(p.rotation);
            }

            switch (p.shape) {
                case 'circle':
                    ctx.beginPath();
                    ctx.arc(0, 0, p.size, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                case 'square':
                    ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size);
                    break;
                case 'star':
                    this.drawStar(ctx, 0, 0, p.size, p.size/2, 5);
                    break;
                default:
                    ctx.beginPath();
                    ctx.arc(0, 0, p.size, 0, Math.PI * 2);
                    ctx.fill();
            }

            ctx.restore();
        });
        ctx.globalAlpha = 1.0;
    }

    drawStar(ctx, cx, cy, outerRadius, innerRadius, points) {
        ctx.beginPath();
        for (let i = 0; i < points * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (i * Math.PI) / points;
            const x = cx + Math.cos(angle) * radius;
            const y = cy + Math.sin(angle) * radius;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.closePath();
        ctx.fill();
    }

    spawn(x, y, color, count = 10, options = {}) {
        const defaultOptions = {
            spread: 8,
            gravity: 0.1,
            life: 1.0,
            size: { min: 2, max: 8 },
            fade: 0.02,
            shape: 'circle'
        };
        
        const config = { ...defaultOptions, ...options };
        
        for (let i = 0; i < count; i++) {
            const particle = this.get();
            const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
            const speed = Math.random() * config.spread + 2;
            
            particle.x = x;
            particle.y = y;
            particle.vx = Math.cos(angle) * speed;
            particle.vy = Math.sin(angle) * speed;
            particle.life = config.life;
            particle.maxLife = config.life;
            particle.color = color;
            particle.size = Math.random() * (config.size.max - config.size.min) + config.size.min;
            particle.gravity = config.gravity;
            particle.fade = config.fade;
            particle.shape = config.shape;
            particle.rotation = Math.random() * Math.PI * 2;
            particle.rotationSpeed = (Math.random() - 0.5) * 0.2;
        }
    }

    spawnExplosion(x, y, color, count = 30) {
        for (let i = 0; i < count; i++) {
            const particle = this.get();
            const angle = (Math.PI * 2 * i) / count;
            const speed = Math.random() * 10 + 5;
            
            particle.x = x;
            particle.y = y;
            particle.vx = Math.cos(angle) * speed;
            particle.vy = Math.sin(angle) * speed;
            particle.life = 1.0;
            particle.maxLife = 1.0;
            particle.color = color;
            particle.size = Math.random() * 8 + 4;
            particle.gravity = 0.2;
            particle.fade = 0.025;
            particle.shape = 'circle';
            particle.rotation = 0;
            particle.rotationSpeed = 0;
        }
    }

    spawnConfetti(x, y, count = 20) {
        const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ff69b4', '#ffd700', '#ff4500', '#9370db'];
        
        for (let i = 0; i < count; i++) {
            const color = colors[Math.floor(Math.random() * colors.length)];
            this.spawn(x, y, color, 1, {
                spread: 15,
                gravity: 0.05,
                life: 3.0,
                size: { min: 8, max: 12 },
                fade: 0.005,
                shape: 'square'
            });
        }
    }

    clear() {
        while (this.activeParticles.length > 0) {
            this.release(this.activeParticles[0]);
        }
    }
}

// ============================================================================
// PHYSICS CONSTANTS
// ============================================================================
const PHYSICS = {
    GRAVITY: 0.8,
    MAX_FALL_SPEED: 20,
    FRICTION: 0.8,
    ACCELERATION: 0.5
};

// ============================================================================
// GAME SETTINGS
// ============================================================================
const SETTINGS = {
    volume: 0.5,
    comboTimer: 60,
    screenShakeIntensity: 5,
    particleIntensity: 1.0
};

// ============================================================================
// GAME STATE
// ============================================================================
let gameState = 'start';
let score = 0;
let highScore = localStorage.getItem('candyLandyHighScore') || 0;
let currentLevel = 0;
let animationFrame = 0;

// Delta time for consistent physics
let lastTime = 0;
let deltaTime = 0;
const TARGET_FPS = 60;
const FRAME_TIME = 1000 / TARGET_FPS;

// Performance monitoring
let fps = 60;
let frameCount = 0;
let lastFpsUpdate = 0;

// Initialize systems
const audioManager = new AudioManager();
const particlePool = new ParticlePool(300);

// Screen shake system
let screenShake = {
    x: 0,
    y: 0,
    intensity: 0,
    decay: 0.9
};

// Player trail system
let playerTrail = [];

// ============================================================================
// PLAYER OBJECT
// ============================================================================
let player = {
    x: 100,
    y: 400,
    width: 40,
    height: 60,
    vx: 0,
    vy: 0,
    speed: 5,
    jumpPower: -16,
    grounded: false,
    lives: 3,
    powerUp: null,
    powerUpTimer: 0,
    invincible: false,
    invincibleTimer: 0,
    jumpState: 'grounded',
    jumpCount: 0,
    legAnimation: 0,
    armAnimation: 0,
    bodyBounce: 0,
    jumpAnimationFrame: 0,
    currentPlatform: null,
    previousPlatformX: 0,
    coyoteTime: 0,
    jumpBuffer: 0,
    canDoubleJump: true
};

// Combo and scoring
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

// ============================================================================
// LEVEL DEFINITIONS
// ============================================================================
const levels = [
    // Level 1: Test Level
    {
        platforms: [
            { x: 0, y: 550, width: 800, height: 50 },
            { x: 200, y: 450, width: 120, height: 20 },
            { x: 400, y: 350, width: 120, height: 20 },
            { x: 600, y: 250, width: 120, height: 20 }
        ],
        candies: [
            { x: 250, y: 420, collected: false },
            { x: 450, y: 320, collected: false },
            { x: 650, y: 220, collected: false }
        ],
        powerUps: [],
        enemies: [
            { x: 240, y: 420, width: 30, height: 30, vx: 2, range: 80, startX: 240 },
            { x: 440, y: 320, width: 30, height: 30, vx: -1, range: 60, startX: 440 },
            { x: 640, y: 220, width: 30, height: 30, vx: 3, range: 100, startX: 640 }
        ],
        disappearingPlatforms: [],
        goal: { x: 750, y: 200, width: 50, height: 50 }
    },
    // Level 2
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
    // Level 3
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

// ============================================================================
// INPUT HANDLING
// ============================================================================
let keys = {};

document.addEventListener('keydown', (e) => {
    keys[e.key] = true;

    if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowUp') {
        if (gameState === 'start') {
            gameState = 'playing';
            audioManager.startBackgroundMusic();
            loadLevel(0);
        }
    }

    if (e.key === 'Escape') {
        if (gameState === 'playing') {
            gameState = 'paused';
            audioManager.stopBackgroundMusic();
        } else if (gameState === 'paused') {
            gameState = 'playing';
            audioManager.startBackgroundMusic();
        }
    }

    if (e.key === 'r' || e.key === 'R') {
        if (gameState === 'gameover' || gameState === 'victory') {
            gameState = 'start';
            resetGame();
        }
    }

    if (e.key >= '0' && e.key <= '5') {
        SETTINGS.volume = parseInt(e.key) / 5;
        audioManager.setVolume(SETTINGS.volume);
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// ============================================================================
// SCREEN SHAKE
// ============================================================================
function triggerScreenShake(intensity = SETTINGS.screenShakeIntensity) {
    screenShake.intensity = Math.max(screenShake.intensity, intensity);
    screenShake.x = (Math.random() - 0.5) * intensity;
    screenShake.y = (Math.random() - 0.5) * intensity;
}

function updateScreenShake() {
    if (screenShake.intensity > 0.1) {
        screenShake.x *= screenShake.decay;
        screenShake.y *= screenShake.decay;
        screenShake.intensity *= screenShake.decay;
    } else {
        screenShake.x = 0;
        screenShake.y = 0;
        screenShake.intensity = 0;
    }
}

// ============================================================================
// LEVEL MANAGEMENT
// ============================================================================
function loadLevel(levelIndex) {
    if (levelIndex >= levels.length) {
        gameState = 'victory';
        audioManager.stopBackgroundMusic();
        audioManager.playSound('levelComplete');
        triggerScreenShake(10);
        particlePool.spawnConfetti(canvas.width / 2, canvas.height / 2, 50);
        return;
    }

    currentLevel = levelIndex;
    currentLevelData = JSON.parse(JSON.stringify(levels[levelIndex]));

    player.x = 100;
    player.y = 400;
    player.vx = 0;
    player.vy = 0;
    player.powerUp = null;
    player.powerUpTimer = 0;
    player.invincible = false;
    player.invincibleTimer = 0;

    particlePool.clear();
    playerTrail = [];

    combo = 0;
    comboTimer = 0;
    comboMultiplier = 1;
    timeBonus = 0;

    enemies = currentLevelData.enemies.map(e => ({
        ...e,
        startX: e.startX || e.x
    }));

    powerUps = [...currentLevelData.powerUps];

    if (!currentLevelData.disappearingPlatforms) {
        currentLevelData.disappearingPlatforms = [];
    }
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
    particlePool.clear();
    playerTrail = [];
    combo = 0;
    comboTimer = 0;
    comboMultiplier = 1;
    timeBonus = 0;
    audioManager.stopBackgroundMusic();
}

// ============================================================================
// PLAYER UPDATE
// ============================================================================
function updatePlayer(dt = 1) {
    if (gameState !== 'playing') return;

    // Power-up timer
    if (player.powerUp) {
        player.powerUpTimer -= dt;
        if (player.powerUpTimer <= 0) {
            player.powerUp = null;
        }
    }

    // Invincibility timer
    if (player.invincible) {
        player.invincibleTimer -= dt;
        if (player.invincibleTimer <= 0) {
            player.invincible = false;
        }
    }

    // Combo system update
    if (comboTimer > 0) {
        comboTimer -= dt;
        if (comboTimer <= 0) {
            combo = 0;
            comboMultiplier = 1;
        }
    }

    // Coyote time
    if (player.grounded) {
        player.coyoteTime = 6;
    } else {
        player.coyoteTime -= dt;
    }

    // Jump buffer
    if (keys[' '] || keys['Enter'] || keys['ArrowUp']) {
        player.jumpBuffer = 6;
    } else {
        player.jumpBuffer -= dt;
    }

    // Movement with power-up speed
    let currentSpeed = player.speed;
    if (player.powerUp === POWER_UPS.SPEED) {
        currentSpeed = 8;
    }

    // Smooth acceleration
    if (keys['ArrowLeft']) {
        player.vx = Math.max(player.vx - PHYSICS.ACCELERATION * dt, -currentSpeed);
    } else if (keys['ArrowRight']) {
        player.vx = Math.min(player.vx + PHYSICS.ACCELERATION * dt, currentSpeed);
    } else {
        player.vx *= Math.pow(PHYSICS.FRICTION, dt);
        if (Math.abs(player.vx) < 0.1) player.vx = 0;
    }

    // Jump with coyote time and jump buffer
    const canJump = (player.jumpBuffer > 0 || (keys[' '] || keys['Enter'] || keys['ArrowUp'])) &&
                     ((player.grounded || player.coyoteTime > 0 || player.jumpCount === 1) && player.jumpCount < 2);

    if (canJump) {
        let jumpPower = player.jumpPower;
        if (player.powerUp === POWER_UPS.JUMP) {
            jumpPower = -20;
        }

        if (player.grounded || player.coyoteTime > 0) {
            player.jumpState = 'jumping';
            player.jumpCount = 1;
        } else if (player.jumpCount === 1) {
            player.jumpState = 'doubleJump';
            player.jumpCount = 2;
            jumpPower *= 1.0;
        }

        player.vy = jumpPower;
        player.grounded = false;
        player.coyoteTime = 0;
        player.jumpBuffer = 0;
        player.jumpAnimationFrame = 0;
        audioManager.playSound('jump');
        triggerScreenShake(2);
    }

    // Apply gravity with delta time
    player.vy += PHYSICS.GRAVITY * dt;
    
    // Terminal velocity
    if (player.vy > PHYSICS.MAX_FALL_SPEED) {
        player.vy = PHYSICS.MAX_FALL_SPEED;
    }

    // Apply velocity with delta time
    player.x += player.vx * dt;
    player.y += player.vy * dt;

    // Update jump state based on velocity
    if (!player.grounded) {
        if (player.vy < 0) {
            if (player.jumpState === 'grounded') {
                player.jumpState = 'jumping';
            } else if (player.jumpState === 'jumping') {
                player.jumpState = 'falling';
            }
        } else if (player.vy > 0 && player.jumpState === 'jumping') {
            player.jumpState = 'falling';
        }
    }

    // Animation
    if (Math.abs(player.vx) > 0.1) {
        player.legAnimation += 0.3 * dt;
        player.armAnimation += 0.3 * dt;
    } else {
        player.legAnimation *= 0.8;
        player.armAnimation *= 0.8;
    }

    player.bodyBounce = Math.sin(player.legAnimation) * 2;

    if (player.jumpState !== 'grounded') {
        player.jumpAnimationFrame += dt;
    }

    // Screen boundaries
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;

    // Platform collision
    player.grounded = false;
    player.currentPlatform = null;

    // Update moving platforms
    currentLevelData.platforms.forEach(platform => {
        if (platform.moving) {
            const prevX = platform.x;
            platform.x = platform.startX + Math.sin(animationFrame * 0.02) * platform.range;
            platform.dx = platform.x - prevX;
        } else {
            platform.dx = 0;
        }
    });

    currentLevelData.platforms.forEach(platform => {
        if (player.x < platform.x + platform.width &&
            player.x + player.width > platform.x &&
            player.y < platform.y + platform.height &&
            player.y + player.height > platform.y) {

            if (player.vy > 0 && player.y < platform.y) {
                player.y = platform.y - player.height;
                player.vy = 0;
                player.grounded = true;
                player.jumpState = 'grounded';
                player.jumpCount = 0;
                player.currentPlatform = platform;
                triggerScreenShake(1);
            }
        }
    });

    // Move player with platform
    if (player.grounded && player.currentPlatform && player.currentPlatform.dx) {
        player.x += player.currentPlatform.dx;
    }

    // Disappearing platforms
    currentLevelData.disappearingPlatforms.forEach(platform => {
        platform.timer += dt;
        if (platform.timer >= platform.cycleTime) {
            platform.visible = !platform.visible;
            platform.timer = 0;
        }
        platform.dx = 0;

        if (platform.visible &&
            player.x < platform.x + platform.width &&
            player.x + player.width > platform.x &&
            player.y < platform.y + platform.height &&
            player.y + player.height > platform.y) {

            if (player.vy > 0 && player.y < platform.y) {
                player.y = platform.y - player.height;
                player.vy = 0;
                player.grounded = true;
                player.jumpState = 'grounded';
                player.jumpCount = 0;
                player.currentPlatform = platform;
                triggerScreenShake(1);
            }
        }
    });

    // Collect candies
    currentLevelData.candies.forEach(candy => {
        if (!candy.collected &&
            player.x < candy.x + 20 &&
            player.x + player.width > candy.x &&
            player.y < candy.y + 20 &&
            player.y + player.height > candy.y) {

            candy.collected = true;

            if (comboTimer > 0) {
                combo++;
                comboTimer = SETTINGS.comboTimer;
                
                if (combo % 5 === 0) {
                    audioManager.playSound('combo');
                    triggerScreenShake(2);
                }
                comboMultiplier = Math.min(combo, 5);
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

            if (combo >= 3) {
                timeBonus += combo * 5;
                score += timeBonus;
                particlePool.spawn(candy.x + 10, candy.y + 10, '#00ff00', 5);
            }

            audioManager.playSound('collect');
            triggerScreenShake(1);
            particlePool.spawn(candy.x + 10, candy.y + 10, '#ffd700', 12);
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
            player.powerUpTimer = 300;
            audioManager.playSound('powerup');
            triggerScreenShake(3);
            particlePool.spawnExplosion(powerUp.x + 10, powerUp.y + 10, '#00ff00', 15);
        }
    });

    // Update enemies
    enemies.forEach((enemy, enemyIndex) => {
        enemy.x += enemy.vx * dt;

        if (Math.abs(enemy.x - enemy.startX) > enemy.range) {
            enemy.vx *= -1;
        }

        if (!player.invincible &&
            player.x < enemy.x + enemy.width &&
            player.x + player.width > enemy.x &&
            player.y < enemy.y + enemy.height &&
            player.y + player.height > enemy.y) {

            const playerBottom = player.y + player.height;
            const enemyCenter = enemy.y + enemy.height / 2;
            
            const isStomp = player.vy > 0 && playerBottom < enemyCenter;

            if (isStomp) {
                audioManager.playSound('enemyHit');
                triggerScreenShake(5);
                
                particlePool.spawnExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, '#ff6600', 25);
                
                particlePool.spawn(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, '#ffff00', 15, {
                    spread: 12,
                    gravity: 0.1,
                    life: 1.5,
                    size: { min: 3, max: 8 },
                    fade: 0.015,
                    shape: 'star'
                });
                
                score += 50;
                
                if (comboTimer > 0) {
                    combo++;
                    comboTimer = SETTINGS.comboTimer;
                    comboMultiplier = Math.min(combo, 5);
                } else {
                    combo = 1;
                    comboTimer = SETTINGS.comboTimer;
                    comboMultiplier = 1;
                }
                
                player.vy = -10;
                player.grounded = false;
                
                enemies.splice(enemyIndex, 1);
                
                if (combo >= 3 && combo % 3 === 0) {
                    audioManager.playSound('combo');
                    triggerScreenShake(3);
                }
                
            } else if (player.powerUp === POWER_UPS.SHIELD) {
                player.powerUp = null;
                player.invincible = true;
                player.invincibleTimer = 60;
                audioManager.playSound('shield');
                triggerScreenShake(5);
            } else {
                player.lives--;
                audioManager.playSound('hit');
                triggerScreenShake(8);

                if (player.lives <= 0) {
                    gameState = 'gameover';
                    audioManager.stopBackgroundMusic();
                    audioManager.playSound('gameOver');

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
        }
    });

    // Check goal
    const goal = currentLevelData.goal;
    if (player.x < goal.x + goal.width &&
        player.x + player.width > goal.x &&
        player.y < goal.y + goal.height &&
        player.y + player.height > goal.y) {

        const allCollected = currentLevelData.candies.every(c => c.collected);

        if (allCollected) {
            audioManager.playSound('levelComplete');
            loadLevel(currentLevel + 1);
        }
    }

    // Fall off screen
    if (player.y > 600) {
        player.lives--;
        audioManager.playSound('hit');

        if (player.lives <= 0) {
            gameState = 'gameover';
            audioManager.stopBackgroundMusic();
            audioManager.playSound('gameOver');

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

    // Update particle pool
    particlePool.update(dt);

    // Update player trail
    updatePlayerTrail();

    // Update screen shake
    updateScreenShake();
}

function updatePlayerTrail() {
    for (let i = playerTrail.length - 1; i >= 0; i--) {
        playerTrail[i].alpha -= 0.05;
        if (playerTrail[i].alpha <= 0) {
            playerTrail.splice(i, 1);
        }
    }
}

function drawPlayerTrail() {
    playerTrail.forEach(trail => {
        if (trail.isDoubleJump) {
            ctx.globalAlpha = trail.alpha * 0.3;
            ctx.fillStyle = '#00ffff';
            ctx.beginPath();
            ctx.arc(trail.x, trail.y, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    });
    ctx.globalAlpha = 1.0;
}

// ============================================================================
// DRAWING FUNCTIONS
// ============================================================================
function drawCloud(x, y, size) {
    ctx.beginPath();
    ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
    ctx.arc(x + size * 0.4, y - size * 0.1, size * 0.4, 0, Math.PI * 2);
    ctx.arc(x + size * 0.8, y, size * 0.5, 0, Math.PI * 2);
    ctx.arc(x + size * 0.4, y + size * 0.2, size * 0.4, 0, Math.PI * 2);
    ctx.fill();
}

function drawStartScreen() {
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(1, '#E0F7FA');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const cloudOffset = Math.sin(animationFrame * 0.01) * 20;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    drawCloud(100 + cloudOffset, 80, 60);
    drawCloud(400 - cloudOffset, 120, 80);
    drawCloud(650 + cloudOffset, 60, 70);

    ctx.fillStyle = '#ff1493';
    ctx.font = 'bold 56px Comic Sans MS';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#ff69b4';
    ctx.shadowBlur = 10;
    ctx.fillText('🍬 Candy Landy 🍬', canvas.width / 2, 150);
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#ff69b4';
    ctx.font = '24px Comic Sans MS';
    ctx.fillText('Enhanced Edition v2.0!', canvas.width / 2, 190);

    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 28px Comic Sans MS';
    ctx.fillText('Princess Emmaline', canvas.width / 2, 230);

    ctx.fillStyle = '#333';
    ctx.font = '22px Comic Sans MS';
    ctx.fillText('Press SPACE, ENTER, or UP ARROW to Start!', canvas.width / 2, 280);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillRect(200, 320, 400, 180);
    ctx.strokeStyle = '#ff69b4';
    ctx.lineWidth = 3;
    ctx.strokeRect(200, 320, 400, 180);

    ctx.fillStyle = '#333';
    ctx.font = '18px Comic Sans MS';
    ctx.textAlign = 'left';
    ctx.fillText('⬅️ ➡️ Arrow Keys - Move', 230, 355);
    ctx.fillText('⬆️ SPACE - Jump (Double tap for double jump!)', 230, 385);
    ctx.fillText('🍬 Collect all candies to advance', 230, 415);
    ctx.fillText('⚠️ Avoid enemies and don\'t fall!', 230, 445);
    ctx.fillText('🔊 Keys 0-5 - Adjust volume', 230, 475);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff1493';
    ctx.font = '20px Comic Sans MS';
    ctx.fillText('🏆 High Score: ' + highScore, canvas.width / 2, 520);
    
    // Add focus hint
    if (!canvasHasFocus) {
        ctx.fillStyle = '#ff6600';
        ctx.font = '16px Comic Sans MS';
        ctx.fillText('💡 Click anywhere if keyboard doesn\'t work', canvas.width / 2, 560);
    }

    const bounce = Math.sin(animationFrame * 0.1) * 10;
    drawCharacter(canvas.width / 2, 480 + bounce);
}

function drawCharacter(x, y) {
    const hairWaveSpeed = animationFrame * 0.08;
    const hairColor = '#ffd700';
    const hairHighlight = '#ffed4e';

    const hairBaseX = x;
    const hairBaseY = y - 10;

    for (let i = 0; i < 10; i++) {
        const strandOffset = (i - 4.5) * 5;
        const waveOffset = Math.sin(hairWaveSpeed + i * 0.4) * 2;
        const upwardLength = 25 + Math.sin(hairWaveSpeed + i * 0.3) * 8;

        ctx.beginPath();
        ctx.moveTo(hairBaseX + strandOffset, hairBaseY - 10);
        ctx.bezierCurveTo(
            hairBaseX + strandOffset + waveOffset, hairBaseY - 15 - upwardLength * 0.3,
            hairBaseX + strandOffset + waveOffset * 1.5, hairBaseY - 15 - upwardLength * 0.6,
            hairBaseX + strandOffset + waveOffset, hairBaseY - 15 - upwardLength
        );
        ctx.strokeStyle = hairColor;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(hairBaseX + strandOffset - 0.5, hairBaseY - 10);
        ctx.bezierCurveTo(
            hairBaseX + strandOffset - 0.5 + waveOffset, hairBaseY - 15 - upwardLength * 0.3,
            hairBaseX + strandOffset - 0.5 + waveOffset * 1.5, hairBaseY - 15 - upwardLength * 0.6,
            hairBaseX + strandOffset - 1 + waveOffset, hairBaseY - 15 - upwardLength
        );
        ctx.strokeStyle = hairHighlight;
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }

    ctx.beginPath();
    ctx.ellipse(hairBaseX, hairBaseY - 10, 23, 7, 0, 0, Math.PI * 2);
    ctx.fillStyle = hairColor;
    ctx.fill();
    ctx.strokeStyle = '#e6b800';
    ctx.lineWidth = 2;
    ctx.stroke();

    for (let i = 0; i < 6; i++) {
        const strandOffset = (i - 2.5) * 8;
        const waveOffset = Math.sin(hairWaveSpeed + i * 0.5) * 2;
        const strandLength = 30 + Math.sin(hairWaveSpeed + i * 0.3) * 5;

        ctx.beginPath();
        ctx.moveTo(hairBaseX + strandOffset, hairBaseY);
        ctx.bezierCurveTo(
            hairBaseX + strandOffset + waveOffset, hairBaseY + 10,
            hairBaseX + strandOffset + waveOffset * 2, hairBaseY + 20,
            hairBaseX + strandOffset, hairBaseY + strandLength
        );
        ctx.strokeStyle = hairColor;
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(hairBaseX + strandOffset - 1, hairBaseY);
        ctx.bezierCurveTo(
            hairBaseX + strandOffset - 1 + waveOffset, hairBaseY + 10,
            hairBaseX + strandOffset - 1 + waveOffset * 2, hairBaseY + 20,
            hairBaseX + strandOffset - 2, hairBaseY + strandLength - 5
        );
        ctx.strokeStyle = hairHighlight;
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    ctx.fillStyle = '#ff69b4';
    ctx.fillRect(x - 20, y, 40, 60);

    ctx.fillStyle = '#8b4513';
    ctx.fillRect(x - 25, y - 10, 50, 10);

    ctx.fillStyle = '#ffd699';
    ctx.beginPath();
    ctx.arc(x, y - 20, 18, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.arc(x - 6, y - 22, 4, 0, Math.PI * 2);
    ctx.arc(x + 6, y - 22, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y - 18, 8, 0.1 * Math.PI, 0.9 * Math.PI);
    ctx.stroke();
}

function drawGame() {
    ctx.save();
    ctx.translate(screenShake.x, screenShake.y);
    
    const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    skyGradient.addColorStop(0, '#87CEEB');
    skyGradient.addColorStop(1, '#E0F7FA');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const cloudOffset = Math.sin(animationFrame * 0.01) * 20;
    drawCloud(80 + cloudOffset, 50, 50);
    drawCloud(350 - cloudOffset, 80, 60);
    drawCloud(600 + cloudOffset, 40, 55);

    // Draw platforms
    currentLevelData.platforms.forEach(platform => {
        const platGradient = ctx.createLinearGradient(platform.x, platform.y, platform.x, platform.y + platform.height);
        platGradient.addColorStop(0, '#ff69b4');
        platGradient.addColorStop(1, '#ff1493');
        ctx.fillStyle = platGradient;
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(platform.x, platform.y, platform.width, 5);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.fillRect(platform.x, platform.y + platform.height - 3, platform.width, 3);
    });

    // Draw disappearing platforms
    currentLevelData.disappearingPlatforms.forEach(platform => {
        if (platform.visible) {
            const fadeProgress = platform.timer / platform.cycleTime;
            const alpha = fadeProgress < 0.2 ? fadeProgress / 0.2 : (fadeProgress > 0.8 ? (1 - fadeProgress) / 0.2 : 1);

            const platGradient = ctx.createLinearGradient(platform.x, platform.y, platform.x, platform.y + platform.height);
            platGradient.addColorStop(0, `rgba(255, 165, 0, ${alpha})`);
            platGradient.addColorStop(1, `rgba(200, 100, 0, ${alpha})`);
            ctx.fillStyle = platGradient;
            ctx.fillRect(platform.x, platform.y, platform.width, platform.height);

            if (fadeProgress > 0.7) {
                ctx.strokeStyle = `rgba(255, 0, 0, ${1 - fadeProgress})`;
                ctx.lineWidth = 3;
                ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
            }

            ctx.fillStyle = `rgba(255, 255, 255, ${0.3 * alpha})`;
            ctx.fillRect(platform.x, platform.y, platform.width, 5);
        }
    });

    // Draw candies
    currentLevelData.candies.forEach((candy, index) => {
        if (!candy.collected) {
            const bounce = Math.sin(animationFrame * 0.05 + index) * 3;

            ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
            ctx.beginPath();
            ctx.arc(candy.x + 10, candy.y + 10 + bounce, 15, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#ffd700';
            ctx.beginPath();
            ctx.arc(candy.x + 10, candy.y + 10 + bounce, 10, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.beginPath();
            ctx.arc(candy.x + 7, candy.y + 7 + bounce, 3, 0, Math.PI * 2);
            ctx.fill();

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

            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(powerUp.x + 10, powerUp.y + 10 + bounce, 12, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#333';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('⚡', powerUp.x + 10, powerUp.y + 15 + bounce);
        }
    });

    // Draw enemies
    enemies.forEach(enemy => {
        ctx.fillStyle = '#ff4444';
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);

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

        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(enemy.x + 15, enemy.y + 20, 6, 0, Math.PI);
        ctx.stroke();
    });

    // Draw goal
    const goal = currentLevelData.goal;
    const goalBounce = Math.sin(animationFrame * 0.03) * 5;

    ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
    ctx.fillRect(goal.x - 5, goal.y - 5 + goalBounce, goal.width + 10, goal.height + 10);

    ctx.fillStyle = '#00ff00';
    ctx.fillRect(goal.x, goal.y + goalBounce, goal.width, goal.height);

    ctx.fillStyle = '#ffff00';
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('⭐', goal.x + goal.width / 2, goal.y + 35 + goalBounce);

    // Draw particles
    particlePool.draw(ctx);

    // Draw player trail
    drawPlayerTrail();

    // Draw player
    drawPlayer();

    // HUD
    drawHUD();
    
    // Show focus message if canvas lost focus during gameplay
    if (showFocusMessage) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(canvas.width / 2 - 150, canvas.height / 2 - 40, 300, 80);
        ctx.strokeStyle = '#ff69b4';
        ctx.lineWidth = 3;
        ctx.strokeRect(canvas.width / 2 - 150, canvas.height / 2 - 40, 300, 80);
        
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 24px Comic Sans MS';
        ctx.textAlign = 'center';
        ctx.fillText('🎮 Click to Focus! 🎮', canvas.width / 2, canvas.height / 2);
        ctx.font = '16px Comic Sans MS';
        ctx.fillText('Then use keyboard to play', canvas.width / 2, canvas.height / 2 + 25);
    }
    
    ctx.restore();
}

function drawPlayer() {
    if (player.invincible && Math.floor(animationFrame / 5) % 2 === 0) {
        return;
    }

    const isRunning = Math.abs(player.vx) > 0.1;
    const isJumping = player.jumpState !== 'grounded';

    let hairFlowOffset = 0;
    let hairWaveAmplitude = 0;
    let hairWaveSpeed = 0;

    if (isRunning) {
        hairFlowOffset = -Math.abs(player.vx) * 2;
        hairWaveAmplitude = 3;
        hairWaveSpeed = animationFrame * 0.2;
    } else if (isJumping) {
        hairFlowOffset = -5;
        hairWaveAmplitude = 5;
        hairWaveSpeed = animationFrame * 0.15;
    } else {
        hairWaveAmplitude = 2;
        hairWaveSpeed = animationFrame * 0.08;
    }

    const hairColor = '#ffd700';
    const hairHighlight = '#ffed4e';

    const hairBaseX = player.x + 20;
    const hairBaseY = player.y - 15;

    for (let i = 0; i < 10; i++) {
        const strandOffset = (i - 4.5) * 5;
        const waveOffset = Math.sin(hairWaveSpeed + i * 0.4) * hairWaveAmplitude;
        const upwardLength = 25 + Math.sin(hairWaveSpeed + i * 0.3) * 8;

        ctx.beginPath();
        ctx.moveTo(hairBaseX + strandOffset, hairBaseY - 10);
        ctx.bezierCurveTo(
            hairBaseX + strandOffset + waveOffset + hairFlowOffset * 0.2, hairBaseY - 15 - upwardLength * 0.3,
            hairBaseX + strandOffset + waveOffset * 1.5 + hairFlowOffset * 0.4, hairBaseY - 15 - upwardLength * 0.6,
            hairBaseX + strandOffset + waveOffset + hairFlowOffset * 0.5, hairBaseY - 15 - upwardLength
        );
        ctx.strokeStyle = hairColor;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(hairBaseX + strandOffset - 0.5, hairBaseY - 10);
        ctx.bezierCurveTo(
            hairBaseX + strandOffset - 0.5 + waveOffset + hairFlowOffset * 0.2, hairBaseY - 15 - upwardLength * 0.3,
            hairBaseX + strandOffset - 0.5 + waveOffset * 1.5 + hairFlowOffset * 0.4, hairBaseY - 15 - upwardLength * 0.6,
            hairBaseX + strandOffset - 1 + waveOffset + hairFlowOffset * 0.5, hairBaseY - 15 - upwardLength
        );
        ctx.strokeStyle = hairHighlight;
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }

    ctx.beginPath();
    ctx.ellipse(hairBaseX, hairBaseY - 10, 23, 7, 0, 0, Math.PI * 2);
    ctx.fillStyle = hairColor;
    ctx.fill();
    ctx.strokeStyle = '#e6b800';
    ctx.lineWidth = 2;
    ctx.stroke();

    for (let i = 0; i < 6; i++) {
        const strandOffset = (i - 2.5) * 8;
        const waveOffset = Math.sin(hairWaveSpeed + i * 0.5) * hairWaveAmplitude;
        const strandLength = 25 + Math.sin(hairWaveSpeed + i * 0.3) * 5;

        ctx.beginPath();
        ctx.moveTo(hairBaseX + strandOffset, hairBaseY);
        ctx.bezierCurveTo(
            hairBaseX + strandOffset + waveOffset + hairFlowOffset * 0.3, hairBaseY + 10,
            hairBaseX + strandOffset + waveOffset * 2 + hairFlowOffset * 0.6, hairBaseY + 20,
            hairBaseX + strandOffset + hairFlowOffset, hairBaseY + strandLength
        );
        ctx.strokeStyle = hairColor;
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(hairBaseX + strandOffset - 1, hairBaseY);
        ctx.bezierCurveTo(
            hairBaseX + strandOffset - 1 + waveOffset + hairFlowOffset * 0.3, hairBaseY + 10,
            hairBaseX + strandOffset - 1 + waveOffset * 2 + hairFlowOffset * 0.6, hairBaseY + 20,
            hairBaseX + strandOffset - 2 + hairFlowOffset, hairBaseY + strandLength - 5
        );
        ctx.strokeStyle = hairHighlight;
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    const bodyGradient = ctx.createLinearGradient(player.x, player.y, player.x + player.width, player.y);
    bodyGradient.addColorStop(0, '#ff69b4');
    bodyGradient.addColorStop(1, '#ff1493');
    ctx.fillStyle = bodyGradient;
    ctx.fillRect(player.x, player.y, player.width, player.height);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(player.x, player.y, 10, player.height);

    const legAnimation = Math.abs(player.vx) > 0.1 ? Math.sin(animationFrame * 0.3) * 3 : 0;

    ctx.fillStyle = '#333';
    ctx.fillRect(player.x + 10, player.y + player.height - 5 + legAnimation, 8, 10);
    ctx.fillRect(player.x + 22, player.y + player.height - 5 - legAnimation, 8, 10);

    const armSwing = Math.abs(player.vx) > 0.1 ? Math.sin(animationFrame * 0.3) * 10 : 0;

    ctx.fillStyle = '#ff69b4';
    ctx.fillRect(player.x - 5 + armSwing, player.y + 10, 8, 20);
    ctx.fillRect(player.x + player.width - 3 - armSwing, player.y + 10, 8, 20);

    ctx.fillStyle = '#8b4513';
    ctx.fillRect(player.x - 5, player.y - 10, 50, 10);
    ctx.fillRect(player.x + 15, player.y - 25, 15, 20);

    ctx.fillStyle = '#ffd699';
    ctx.beginPath();
    ctx.arc(player.x + 20, player.y - 15, 15, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.arc(player.x + 15, player.y - 17, 3, 0, Math.PI * 2);
    ctx.arc(player.x + 25, player.y - 17, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(player.x + 20, player.y - 12, 6, 0.1 * Math.PI, 0.9 * Math.PI);
    ctx.stroke();
}

function drawHUD() {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillRect(10, 10, 280, 190);
    ctx.strokeStyle = '#ff69b4';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, 280, 190);

    ctx.fillStyle = '#ff1493';
    ctx.font = 'bold 20px Comic Sans MS';
    ctx.textAlign = 'left';
    ctx.fillText('🍬 Score: ' + score, 20, 40);

    ctx.fillText('❤️ Lives: ' + '❤️'.repeat(player.lives), 20, 65);

    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 16px Comic Sans MS';
    ctx.fillText('👑 Princess Emmaline', 20, 90);

    ctx.fillText('🎮 Level: ' + (currentLevel + 1) + '/' + levels.length, 20, 110);

    const collected = currentLevelData.candies.filter(c => c.collected).length;
    const total = currentLevelData.candies.length;
    ctx.fillText('🍭 Candies: ' + collected + '/' + total, 20, 130);

    if (combo > 1) {
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 18px Comic Sans MS';
        ctx.fillText('🔥 ' + combo + 'x COMBO!', 20, 150);
    }

    if (timeBonus > 0) {
        ctx.fillStyle = '#00ff00';
        ctx.font = '16px Comic Sans MS';
        ctx.fillText('⏱️ Bonus: +' + timeBonus, 20, 170);
    }

    const jumpsRemaining = 2 - player.jumpCount;
    ctx.fillStyle = jumpsRemaining > 0 ? '#00ffff' : '#888';
    ctx.font = '16px Comic Sans MS';
    ctx.fillText('🦘 Jumps: ' + '⬆️'.repeat(jumpsRemaining), 20, 190);

    if (player.powerUp) {
        ctx.fillStyle = 'rgba(0, 255, 0, 0.9)';
        ctx.fillRect(canvas.width - 120, 10, 110, 40);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px Comic Sans MS';
        ctx.textAlign = 'center';
        ctx.fillText('⚡ ' + player.powerUp.toUpperCase(), canvas.width - 65, 35);
    }

    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillRect(canvas.width - 120, 55, 110, 25);
    ctx.fillStyle = '#333';
    ctx.font = '12px Comic Sans MS';
    ctx.fillText('🔊 ' + Math.round(SETTINGS.volume * 100) + '% (0-5)', canvas.width - 65, 72);

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

    ctx.fillStyle = '#fff';
    ctx.font = '32px Comic Sans MS';
    ctx.fillText('Score: ' + score, canvas.width / 2, 280);

    ctx.fillStyle = '#ffd700';
    ctx.font = '24px Comic Sans MS';
    ctx.fillText('🔥 Max Combo: ' + combo + 'x', canvas.width / 2, 320);

    if (timeBonus > 0) {
        ctx.fillText('⏱️ Time Bonus: ' + timeBonus, canvas.width / 2, 350);
    }

    if (score >= highScore) {
        ctx.fillStyle = '#ffd700';
        ctx.fillText('🎉 NEW HIGH SCORE! 🎉', canvas.width / 2, 400);
    }

    ctx.fillStyle = '#fff';
    ctx.font = '24px Comic Sans MS';
    ctx.fillText('Press R to Restart', canvas.width / 2, 460);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillRect(canvas.width - 120, 10, 110, 30);
    ctx.fillStyle = '#333';
    ctx.font = '14px Comic Sans MS';
    ctx.fillText('Volume: ' + Math.round(SETTINGS.volume * 100) + '%', canvas.width - 65, 30);
}

function drawVictoryScreen() {
    if (animationFrame % 2 === 0) {
        if (animationFrame % 30 === 0) {
            particlePool.spawnConfetti(Math.random() * canvas.width, -10, 15);
            triggerScreenShake(2);
        }
        
        const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ff69b4', '#ffd700'];
        for (let i = 0; i < 3; i++) {
            particlePool.spawn(
                Math.random() * canvas.width,
                -10,
                colors[Math.floor(Math.random() * colors.length)],
                Math.floor(Math.random() * 2) + 1,
                { spread: 12, gravity: 0.03, life: 2.0, shape: 'square' }
            );
        }
    }
    particlePool.update(1);
    particlePool.draw(ctx);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

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

    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillRect(canvas.width - 120, 10, 110, 30);
    ctx.fillStyle = '#333';
    ctx.font = '14px Comic Sans MS';
    ctx.textAlign = 'center';
    ctx.fillText('Volume: ' + Math.round(SETTINGS.volume * 100) + '%', canvas.width - 65, 30);
}

// ============================================================================
// GAME LOOP WITH DELTA TIME
// ============================================================================
function gameLoop(timestamp) {
    // Calculate delta time
    if (!lastTime) lastTime = timestamp;
    deltaTime = (timestamp - lastTime) / FRAME_TIME;
    lastTime = timestamp;
    
    // Cap delta time to prevent spiral of death
    if (deltaTime > 3) deltaTime = 3;

    // FPS tracking
    frameCount++;
    if (timestamp - lastFpsUpdate >= 1000) {
        fps = frameCount;
        frameCount = 0;
        lastFpsUpdate = timestamp;
    }

    animationFrame++;

    if (gameState === 'start') {
        drawStartScreen();
    } else if (gameState === 'playing') {
        updatePlayer(deltaTime);
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

// Expose stats for debugging
window.getGameStats = function() {
    return {
        fps: fps,
        activeParticles: particlePool.activeParticles.length,
        poolSize: particlePool.pool.length,
        deltaTime: deltaTime.toFixed(2),
        gameState: gameState
    };
};

// Start the game
requestAnimationFrame(gameLoop);
