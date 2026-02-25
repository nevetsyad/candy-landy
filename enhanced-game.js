const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- Canvas Settings ---
canvas.width = 800;
canvas.height = 600;

// --- Game Constants ---
const GRAVITY = 0.6;
const JUMP_STRENGTH = -14;
const MOVE_SPEED = 5;
const GROUND_HEIGHT = 60;

// --- Game State Variables ---
let emmaline;
let levelManager;
let keys = {};
let score = 0;
let gameState = 'start'; // 'start', 'playing', 'won', 'lost', 'paused'
let animationFrame = 0;
let lastTime = 0;
let deltaTime = 0;

// --- Sound System using Web Audio API ---
class SoundSystem {
    constructor() {
        this.audioContext = null;
        this.masterVolume = 0.5;
        this.sfxVolume = 0.7;
        this.musicVolume = 0.4;
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.initialized = true;
        } catch (e) {
            console.warn('Web Audio API not supported');
        }
    }

    playTone(frequency, duration, type = 'sine', volume = 0.3) {
        if (!this.initialized || !this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = type;
        
        gainNode.gain.setValueAtTime(volume * this.masterVolume * this.sfxVolume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }

    jumpSound() {
        this.playTone(400, 0.1, 'sine', 0.2);
        setTimeout(() => this.playTone(500, 0.1, 'sine', 0.15), 50);
    }

    collectSound() {
        this.playTone(880, 0.1, 'sine', 0.3);
        setTimeout(() => this.playTone(1100, 0.15, 'sine', 0.2), 80);
    }

    powerUpSound() {
        const notes = [523, 659, 784, 1047];
        notes.forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 0.15, 'square', 0.2), i * 80);
        });
    }

    hurtSound() {
        this.playTone(200, 0.2, 'sawtooth', 0.3);
    }

    gameOverSound() {
        this.playTone(300, 0.3, 'sawtooth', 0.3);
        setTimeout(() => this.playTone(200, 0.5, 'sawtooth', 0.3), 300);
    }

    victorySound() {
        const melody = [523, 587, 659, 698, 784, 880, 988, 1047];
        melody.forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 0.2, 'sine', 0.2), i * 100);
        });
    }

    landingSound() {
        this.playTone(150, 0.1, 'triangle', 0.15);
    }

    setMasterVolume(value) {
        this.masterVolume = Math.max(0, Math.min(1, value));
    }

    setSFXVolume(value) {
        this.sfxVolume = Math.max(0, Math.min(1, value));
    }
}

const soundSystem = new SoundSystem();

// --- Particle System ---
class Particle {
    constructor(x, y, options = {}) {
        this.x = x;
        this.y = y;
        this.vx = options.vx || (Math.random() - 0.5) * 6;
        this.vy = options.vy || (Math.random() - 0.5) * 6;
        this.life = options.life || 30;
        this.maxLife = this.life;
        this.color = options.color || '#fff';
        this.size = options.size || Math.random() * 4 + 2;
        this.gravity = options.gravity || 0.1;
        this.type = options.type || 'square';
        this.rotation = options.rotation || 0;
        this.rotationSpeed = options.rotationSpeed || 0;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity;
        this.rotation += this.rotationSpeed;
        this.life--;
        return this.life > 0;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.life / this.maxLife;
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        if (this.type === 'circle') {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(0, 0, this.size, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'star') {
            ctx.fillStyle = this.color;
            this.drawStar(ctx, 0, 0, 5, this.size, this.size / 2);
        } else {
            ctx.fillStyle = this.color;
            ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
        }
        
        ctx.restore();
    }

    drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
        let rot = Math.PI / 2 * 3;
        let x = cx;
        let y = cy;
        const step = Math.PI / spikes;

        ctx.beginPath();
        ctx.moveTo(cx, cy - outerRadius);
        
        for (let i = 0; i < spikes; i++) {
            x = cx + Math.cos(rot) * outerRadius;
            y = cy + Math.sin(rot) * outerRadius;
            ctx.lineTo(x, y);
            rot += step;

            x = cx + Math.cos(rot) * innerRadius;
            y = cy + Math.sin(rot) * innerRadius;
            ctx.lineTo(x, y);
            rot += step;
        }
        
        ctx.lineTo(cx, cy - outerRadius);
        ctx.closePath();
        ctx.fill();
    }
}

// --- Enhanced Player Character: Emmaline ---
class Emmaline {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 60;
        this.vx = 0;
        this.vy = 0;
        this.isOnGround = false;
        this.facingRight = true;
        this.animFrame = 0;
        this.animTimer = 0;
        this.jumpCount = 0;
        this.baseMaxJumps = 2;
        this.maxJumps = 2;
        
        // Power-up states
        this.invincible = false;
        this.invincibleTimer = 0;
        this.speedBoost = false;
        this.speedBoostTimer = 0;
        this.tripleJump = false;
        this.tripleJumpTimer = 0;
        
        // Combo system
        this.comboCount = 0;
        this.comboTimer = 0;
        this.lastCandyTime = 0;
    }

    update(level) {
        // Apply gravity
        this.vy += GRAVITY;

        // Apply movement (with speed boost)
        const speedMultiplier = this.speedBoost ? 1.6 : 1;
        this.x += this.vx * speedMultiplier;
        this.y += this.vy;

        // Update animation
        this.animTimer++;
        if (this.animTimer > 6) {
            this.animTimer = 0;
            this.animFrame = (this.animFrame + 1) % 4;
        }

        // Update power-up timers
        if (this.invincible) {
            this.invincibleTimer--;
            if (this.invincibleTimer <= 0) {
                this.invincible = false;
            }
        }
        
        if (this.speedBoost) {
            this.speedBoostTimer--;
            if (this.speedBoostTimer <= 0) {
                this.speedBoost = false;
                this.maxJumps = this.baseMaxJumps;
            }
        }
        
        if (this.tripleJump) {
            this.tripleJumpTimer--;
            if (this.tripleJumpTimer <= 0) {
                this.tripleJump = false;
                this.maxJumps = this.baseMaxJumps;
            }
        }

        // Combo timer
        if (this.comboTimer > 0) {
            this.comboTimer--;
            if (this.comboTimer <= 0) {
                this.comboCount = 0;
            }
        }

        // Platform collision
        let onPlatform = false;

        level.platforms.forEach(platform => {
            if (this.checkPlatformCollision(platform)) {
                onPlatform = true;
            }
        });

        // Enemy collision
        level.enemies.forEach(enemy => {
            if (!enemy.defeated && this.checkEnemyCollision(enemy)) {
                if (this.invincible) {
                    enemy.defeated = true;
                    score += 50;
                    level.createParticles(enemy.x, enemy.y, enemy.color, 'star', 20);
                    soundSystem.powerUpSound();
                } else {
                    this.takeDamage();
                }
            }
        });

        // Screen bounds
        if (this.x < 0) this.x = 0;
        if (this.x + this.width > canvas.width) this.x = canvas.width - this.width;

        // Fell off screen
        if (this.y > canvas.height) {
            gameState = 'lost';
            soundSystem.gameOverSound();
        }

        const wasOnGround = this.isOnGround;
        this.isOnGround = onPlatform;
        
        // Landing effect
        if (!wasOnGround && onPlatform) {
            level.createParticles(this.x + this.width / 2, this.y + this.height, '#FFDAB9', 'circle', 8);
            soundSystem.landingSound();
        }

        if (onPlatform) {
            this.jumpCount = 0;
        }
    }

    checkPlatformCollision(platform) {
        const prevY = this.y - this.vy;
        const playerBottom = this.y + this.height;
        const playerPrevBottom = prevY + this.height;

        if (this.x + this.width > platform.x &&
            this.x < platform.x + platform.width &&
            playerBottom >= platform.y &&
            playerPrevBottom <= platform.y + 10 &&
            this.vy >= 0) {
            
            this.y = platform.y - this.height;
            this.vy = 0;
            return true;
        }
        return false;
    }

    checkEnemyCollision(enemy) {
        return this.x < enemy.x + enemy.width &&
               this.x + this.width > enemy.x &&
               this.y < enemy.y + enemy.height &&
               this.y + this.height > enemy.y;
    }

    takeDamage() {
        if (this.invincible) return;
        
        soundSystem.hurtSound();
        this.comboCount = 0;
        
        // Knockback
        this.vy = -8;
        this.vx = this.facingRight ? -8 : 8;
        
        // Brief invincibility
        this.invincible = true;
        this.invincibleTimer = 60;
        
        // Screen shake effect
        level.shakeScreen(10);
    }

    jump() {
        if (this.jumpCount < this.maxJumps) {
            this.vy = JUMP_STRENGTH;
            this.jumpCount++;
            soundSystem.jumpSound();
            
            // Jump particles
            if (levelManager) {
                const currentLevel = levelManager.getCurrentLevel();
                if (currentLevel) {
                    currentLevel.createParticles(
                        this.x + this.width / 2, 
                        this.y + this.height, 
                        '#87CEEB', 
                        'circle', 
                        6
                    );
                }
            }
        }
    }

    moveLeft() {
        this.vx = -MOVE_SPEED;
        this.facingRight = false;
    }

    moveRight() {
        this.vx = MOVE_SPEED;
        this.facingRight = true;
    }

    stopMoving() {
        this.vx = 0;
    }

    collectCandy() {
        const now = Date.now();
        
        // Combo system
        if (now - this.lastCandyTime < 1500) {
            this.comboCount++;
            this.comboTimer = 120; // 2 seconds
        } else {
            this.comboCount = 1;
        }
        
        this.lastCandyTime = now;
        
        // Calculate score with combo multiplier
        const comboMultiplier = Math.min(this.comboCount, 5);
        const points = 10 * comboMultiplier;
        score += points;
        
        soundSystem.collectSound();
        
        return points;
    }

    draw() {
        ctx.save();
        
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;

        // Face direction
        if (!this.facingRight) {
            ctx.translate(centerX, centerY);
            ctx.scale(-1, 1);
            ctx.translate(-centerX, -centerY);
        }

        // Invincibility flash
        if (this.invincible && Math.floor(animationFrame / 4) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }

        // Speed boost glow
        if (this.speedBoost) {
            ctx.shadowColor = '#FFD700';
            ctx.shadowBlur = 15;
        }

        // Triple jump indicator
        if (this.tripleJump) {
            ctx.shadowColor = '#00BFFF';
            ctx.shadowBlur = 15;
        }

        // Body (dress)
        const dressColor = this.invincible ? '#FFD700' : 
                           this.speedBoost ? '#FF8C00' : 
                           this.tripleJump ? '#00BFFF' : '#FF69B4';
        ctx.fillStyle = dressColor;
        ctx.beginPath();
        ctx.moveTo(centerX - 15, this.y + 25);
        ctx.lineTo(centerX + 15, this.y + 25);
        ctx.lineTo(centerX + 20, this.y + this.height);
        ctx.lineTo(centerX - 20, this.y + this.height);
        ctx.closePath();
        ctx.fill();

        // Head
        ctx.fillStyle = '#FFDAB9';
        ctx.beginPath();
        ctx.arc(centerX, this.y + 15, 15, 0, Math.PI * 2);
        ctx.fill();

        // Hair (brown pigtails with animation)
        ctx.fillStyle = '#8B4513';
        const pigtailSway = Math.sin(animationFrame * 0.2) * 3;

        // Left pigtail
        ctx.beginPath();
        ctx.moveTo(centerX - 12, this.y + 12);
        ctx.quadraticCurveTo(
            centerX - 25 + pigtailSway,
            this.y + 20,
            centerX - 20 + pigtailSway,
            this.y + 35
        );
        ctx.quadraticCurveTo(
            centerX - 15 + pigtailSway,
            this.y + 25,
            centerX - 12,
            this.y + 15
        );
        ctx.fill();

        // Right pigtail
        ctx.beginPath();
        ctx.moveTo(centerX + 12, this.y + 12);
        ctx.quadraticCurveTo(
            centerX + 25 - pigtailSway,
            this.y + 20,
            centerX + 20 - pigtailSway,
            this.y + 35
        );
        ctx.quadraticCurveTo(
            centerX + 15 - pigtailSway,
            this.y + 25,
            centerX + 12,
            this.y + 15
        );
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(centerX - 5, this.y + 13, 2, 0, Math.PI * 2);
        ctx.arc(centerX + 5, this.y + 13, 2, 0, Math.PI * 2);
        ctx.fill();

        // Smile
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(centerX, this.y + 18, 4, 0, Math.PI);
        ctx.stroke();

        // Legs (animate when moving)
        const legOffset = (this.vx !== 0 && this.isOnGround) ? Math.sin(animationFrame * 0.3) * 5 : 0;
        ctx.fillStyle = '#FFDAB9';
        ctx.fillRect(centerX - 10 + legOffset, this.y + this.height - 15, 6, 15);
        ctx.fillRect(centerX + 4 - legOffset, this.y + this.height - 15, 6, 15);

        // Arms
        const armOffset = (this.vx !== 0) ? Math.sin(animationFrame * 0.3) * 8 : 0;
        ctx.fillRect(centerX - 20, this.y + 28 + armOffset, 6, 20);
        ctx.fillRect(centerX + 14, this.y + 28 - armOffset, 6, 20);

        ctx.restore();
    }
}

// --- Platform Types ---
class Platform {
    constructor(x, y, width, height, color, type = 'normal') {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.type = type;
        this.originalX = x;
        this.originalY = y;
        this.moveSpeed = 1.5;
        this.moveRange = 80;
        this.moveDirection = 1;
        this.visible = true;
        this.disappearTimer = 0;
        this.reappearTimer = 0;
    }

    update() {
        if (this.type === 'moving') {
            this.x += this.moveSpeed * this.moveDirection;
            if (this.x > this.originalX + this.moveRange || this.x < this.originalX - this.moveRange) {
                this.moveDirection *= -1;
            }
        } else if (this.type === 'disappearing') {
            if (this.visible) {
                this.disappearTimer++;
                if (this.disappearTimer > 180) {
                    this.visible = false;
                    this.reappearTimer = 120;
                    this.disappearTimer = 0;
                }
            } else {
                this.reappearTimer--;
                if (this.reappearTimer <= 0) {
                    this.visible = true;
                }
            }
        }
    }

    draw(ctx) {
        if (!this.visible) return;

        // Platform shadow
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fillRect(this.x + 4, this.y + 4, this.width, this.height);
        
        // Platform
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Platform highlight
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fillRect(this.x, this.y, this.width, 4);

        // Type indicators
        if (this.type === 'moving') {
            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            ctx.font = '12px Arial';
            ctx.fillText('↔', this.x + this.width / 2 - 6, this.y + 14);
        } else if (this.type === 'disappearing') {
            const alpha = 0.3 + Math.sin(animationFrame * 0.1) * 0.2;
            ctx.fillStyle = `rgba(255,255,255,${alpha})`;
            ctx.font = '12px Arial';
            ctx.fillText('⏳', this.x + this.width / 2 - 6, this.y + 14);
        }
    }
}

// --- Enemy Class ---
class Enemy {
    constructor(x, y, width, height, color, type = 'walker') {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.type = type;
        this.originalX = x;
        this.vx = 1.5;
        this.moveRange = 100;
        this.defeated = false;
        this.animFrame = 0;
    }

    update() {
        if (this.defeated) return;

        this.x += this.vx;
        this.animFrame = (this.animFrame + 0.1) % (Math.PI * 2);

        if (this.x > this.originalX + this.moveRange || this.x < this.originalX - this.moveRange) {
            this.vx *= -1;
        }
    }

    draw(ctx) {
        if (this.defeated) return;

        ctx.save();
        
        // Body
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.width / 2, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2 - 5, this.y + this.height / 2 - 3, 4, 0, Math.PI * 2);
        ctx.arc(this.x + this.width / 2 + 5, this.y + this.height / 2 - 3, 4, 0, Math.PI * 2);
        ctx.fill();

        // Pupils
        ctx.fillStyle = '#000';
        const pupilOffset = Math.sin(this.animFrame) * 1;
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2 - 5 + pupilOffset, this.y + this.height / 2 - 3, 2, 0, Math.PI * 2);
        ctx.arc(this.x + this.width / 2 + 5 + pupilOffset, this.y + this.height / 2 - 3, 2, 0, Math.PI * 2);
        ctx.fill();

        // Angry eyebrows
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x + this.width / 2 - 9, this.y + this.height / 2 - 10);
        ctx.lineTo(this.x + this.width / 2 - 2, this.y + this.height / 2 - 7);
        ctx.moveTo(this.x + this.width / 2 + 9, this.y + this.height / 2 - 10);
        ctx.lineTo(this.x + this.width / 2 + 2, this.y + this.height / 2 - 7);
        ctx.stroke();

        ctx.restore();
    }
}

// --- Power-Up Class ---
class PowerUp {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 30;
        this.type = type; // 'speed', 'invincible', 'tripleJump'
        this.collected = false;
        this.floatOffset = 0;
    }

    update() {
        this.floatOffset = Math.sin(animationFrame * 0.08) * 5;
    }

    draw(ctx) {
        if (this.collected) return;

        const y = this.y + this.floatOffset;
        
        // Glow effect
        const gradient = ctx.createRadialGradient(
            this.x + this.width / 2, y + this.height / 2, 0,
            this.x + this.width / 2, y + this.height / 2, 25
        );
        
        let color;
        switch (this.type) {
            case 'speed':
                color = '#FFD700';
                break;
            case 'invincible':
                color = '#FF4500';
                break;
            case 'tripleJump':
                color = '#00BFFF';
                break;
        }
        
        gradient.addColorStop(0, color);
        gradient.addColorStop(0.5, color + '80');
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2, y + this.height / 2, 25, 0, Math.PI * 2);
        ctx.fill();

        // Power-up box
        ctx.fillStyle = color;
        ctx.fillRect(this.x, y, this.width, this.height);
        
        // Border
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, y, this.width, this.height);

        // Icon
        ctx.fillStyle = '#fff';
        ctx.font = '18px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        let icon;
        switch (this.type) {
            case 'speed':
                icon = '⚡';
                break;
            case 'invincible':
                icon = '★';
                break;
            case 'tripleJump':
                icon = '↑↑';
                break;
        }
        ctx.fillText(icon, this.x + this.width / 2, y + this.height / 2);
    }
}

// --- Level Class ---
class Level {
    constructor(levelNum) {
        this.levelNum = levelNum;
        this.platforms = [];
        this.candies = [];
        this.enemies = [];
        this.powerUps = [];
        this.goal = null;
        this.particles = [];
        this.screenShake = 0;
        this.backgroundElements = [];
        this.loadLevel();
    }

    loadLevel() {
        // Ground
        this.platforms.push(new Platform(
            0, canvas.height - GROUND_HEIGHT, 
            canvas.width, GROUND_HEIGHT, '#8B4513', 'normal'
        ));

        // Level-specific designs
        if (this.levelNum === 1) {
            // Level 1: Tutorial - Basic platforms
            this.platforms.push(new Platform(100, 480, 150, 20, '#FF69B4', 'normal'));
            this.platforms.push(new Platform(350, 400, 120, 20, '#FFD700', 'normal'));
            this.platforms.push(new Platform(550, 320, 180, 20, '#87CEEB', 'normal'));
            this.platforms.push(new Platform(200, 250, 140, 20, '#DDA0DD', 'normal'));
            this.platforms.push(new Platform(500, 180, 150, 20, '#98FB98', 'normal'));
            this.platforms.push(new Platform(700, 120, 100, 20, '#FF6347', 'normal'));

            // Candies
            this.candies.push({ x: 170, y: 450, radius: 12, color: '#FF1493', collected: false });
            this.candies.push({ x: 400, y: 370, radius: 14, color: '#FFD700', collected: false });
            this.candies.push({ x: 620, y: 290, radius: 13, color: '#00CED1', collected: false });
            this.candies.push({ x: 260, y: 220, radius: 15, color: '#FF69B4', collected: false });
            this.candies.push({ x: 560, y: 150, radius: 12, color: '#32CD32', collected: false });
            this.candies.push({ x: 730, y: 90, radius: 14, color: '#FF4500', collected: false });
            this.candies.push({ x: 50, y: 520, radius: 13, color: '#9370DB', collected: false });
            this.candies.push({ x: 750, y: 520, radius: 12, color: '#20B2AA', collected: false });

            // Power-up
            this.powerUps.push(new PowerUp(300, 350, 'speed'));

        } else if (this.levelNum === 2) {
            // Level 2: Moving platforms
            this.platforms.push(new Platform(80, 480, 200, 20, '#FF69B4', 'moving'));
            this.platforms.push(new Platform(300, 400, 150, 20, '#FFD700', 'normal'));
            this.platforms.push(new Platform(550, 320, 150, 20, '#87CEEB', 'moving'));
            this.platforms.push(new Platform(250, 220, 180, 20, '#DDA0DD', 'disappearing'));
            this.platforms.push(new Platform(500, 150, 150, 20, '#98FB98', 'moving'));
            this.platforms.push(new Platform(700, 80, 100, 20, '#FF6347', 'normal'));

            // Candies
            this.candies.push({ x: 180, y: 440, radius: 12, color: '#FF1493', collected: false });
            this.candies.push({ x: 370, y: 360, radius: 14, color: '#FFD700', collected: false });
            this.candies.push({ x: 620, y: 280, radius: 13, color: '#00CED1', collected: false });
            this.candies.push({ x: 340, y: 180, radius: 15, color: '#FF69B4', collected: false });
            this.candies.push({ x: 570, y: 110, radius: 12, color: '#32CD32', collected: false });

            // Enemies
            this.enemies.push(new Enemy(150, 450, 30, 30, '#FF4444'));
            this.enemies.push(new Enemy(350, 290, 30, 30, '#FF4444'));

            // Power-ups
            this.powerUps.push(new PowerUp(450, 350, 'invincible'));
            this.powerUps.push(new PowerUp(200, 130, 'tripleJump'));

        } else if (this.levelNum >= 3) {
            // Level 3+: Challenge
            this.platforms.push(new Platform(60, 480, 180, 20, '#FF69B4', 'moving'));
            this.platforms.push(new Platform(280, 400, 130, 20, '#FFD700', 'disappearing'));
            this.platforms.push(new Platform(500, 320, 140, 20, '#87CEEB', 'moving'));
            this.platforms.push(new Platform(200, 220, 160, 20, '#DDA0DD', 'disappearing'));
            this.platforms.push(new Platform(450, 140, 170, 20, '#98FB98', 'moving'));
            this.platforms.push(new Platform(680, 70, 120, 20, '#FF6347', 'disappearing'));

            // More candies
            this.candies.push({ x: 150, y: 440, radius: 12, color: '#FF1493', collected: false });
            this.candies.push({ x: 340, y: 360, radius: 14, color: '#FFD700', collected: false });
            this.candies.push({ x: 570, y: 280, radius: 13, color: '#00CED1', collected: false });
            this.candies.push({ x: 280, y: 180, radius: 15, color: '#FF69B4', collected: false });
            this.candies.push({ x: 530, y: 100, radius: 12, color: '#32CD32', collected: false });
            this.candies.push({ x: 740, y: 40, radius: 14, color: '#FF4500', collected: false });
            this.candies.push({ x: 50, y: 520, radius: 13, color: '#9370DB', collected: false });

            // More enemies
            this.enemies.push(new Enemy(120, 450, 30, 30, '#FF4444'));
            this.enemies.push(new Enemy(320, 370, 30, 30, '#FF4444'));
            this.enemies.push(new Enemy(550, 290, 30, 30, '#FF4444'));
            this.enemies.push(new Enemy(250, 190, 30, 30, '#FF4444'));

            // Power-ups
            this.powerUps.push(new PowerUp(400, 300, 'speed'));
            this.powerUps.push(new PowerUp(180, 100, 'invincible'));
            this.powerUps.push(new PowerUp(600, 220, 'tripleJump'));
        }

        // Goal flag
        this.goal = {
            x: canvas.width - 80,
            y: canvas.height - GROUND_HEIGHT - 80,
            width: 20,
            height: 80
        };

        // Background elements
        this.createBackgroundElements();
    }

    createBackgroundElements() {
        // Clouds
        for (let i = 0; i < 5; i++) {
            this.backgroundElements.push({
                type: 'cloud',
                x: Math.random() * canvas.width,
                y: 50 + Math.random() * 100,
                speed: 0.2 + Math.random() * 0.3,
                size: 30 + Math.random() * 40
            });
        }

        // Floating candies in background
        for (let i = 0; i < 8; i++) {
            this.backgroundElements.push({
                type: 'floatingCandy',
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                speed: 0.5 + Math.random() * 1,
                radius: 5 + Math.random() * 8,
                color: `hsl(${Math.random() * 360}, 70%, 70%)`,
                opacity: 0.3
            });
        }
    }

    update() {
        // Update platforms
        this.platforms.forEach(platform => platform.update());

        // Update enemies
        this.enemies.forEach(enemy => enemy.update());

        // Update power-ups
        this.powerUps.forEach(powerUp => powerUp.update());

        // Update background elements
        this.backgroundElements.forEach(bg => {
            bg.x += bg.speed;
            if (bg.type === 'floatingCandy') {
                bg.y += Math.sin(animationFrame * 0.02 + bg.x) * 0.5;
            }
            if (bg.x > canvas.width + 50) {
                bg.x = -50;
            }
        });

        // Check candy collection
        this.candies.forEach(candy => {
            if (!candy.collected) {
                const dx = candy.x - (emmaline.x + emmaline.width / 2);
                const dy = candy.y - (emmaline.y + emmaline.height / 2);
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < candy.radius + 20) {
                    candy.collected = true;
                    emmaline.collectCandy();
                    this.createParticles(candy.x, candy.y, candy.color, 'star', 10);
                }
            }
        });

        // Check power-up collection
        this.powerUps.forEach(powerUp => {
            if (!powerUp.collected) {
                if (emmaline.x < powerUp.x + powerUp.width &&
                    emmaline.x + emmaline.width > powerUp.x &&
                    emmaline.y < powerUp.y + powerUp.height + powerUp.floatOffset &&
                    emmaline.y + emmaline.height > powerUp.y + powerUp.floatOffset) {
                    
                    powerUp.collected = true;
                    soundSystem.powerUpSound();
                    
                    switch (powerUp.type) {
                        case 'speed':
                            emmaline.speedBoost = true;
                            emmaline.speedBoostTimer = 600; // 10 seconds
                            break;
                        case 'invincible':
                            emmaline.invincible = true;
                            emmaline.invincibleTimer = 300; // 5 seconds
                            break;
                        case 'tripleJump':
                            emmaline.tripleJump = true;
                            emmaline.tripleJumpTimer = 450; // 7.5 seconds
                            emmaline.maxJumps = 3;
                            break;
                    }
                    
                    score += 25;
                    this.createParticles(powerUp.x + 15, powerUp.y + 15, '#FFD700', 'star', 20);
                }
            }
        });

        // Update particles
        this.particles = this.particles.filter(p => p.update());

        // Decrease screen shake
        if (this.screenShake > 0) {
            this.screenShake--;
        }

        // Check goal
        if (emmaline.x + emmaline.width > this.goal.x &&
            emmaline.x < this.goal.x + this.goal.width &&
            emmaline.y + emmaline.height > this.goal.y) {
            gameState = 'won';
            soundSystem.victorySound();
        }
    }

    createParticles(x, y, color, type = 'square', count = 10) {
        for (let i = 0; i < count; i++) {
            this.particles.push(new Particle(x, y, {
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                life: 40 + Math.random() * 20,
                color: color,
                size: Math.random() * 5 + 3,
                gravity: 0.15,
                type: type,
                rotationSpeed: (Math.random() - 0.5) * 0.2
            }));
        }
    }

    shakeScreen(intensity) {
        this.screenShake = intensity;
    }

    draw() {
        ctx.save();
        
        // Apply screen shake
        if (this.screenShake > 0) {
            ctx.translate(
                (Math.random() - 0.5) * this.screenShake,
                (Math.random() - 0.5) * this.screenShake
            );
        }

        // Draw background gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(0.4, '#E0F7FA');
        gradient.addColorStop(0.7, '#F0FFF0');
        gradient.addColorStop(1, '#98FB98');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw background elements
        this.backgroundElements.forEach(bg => {
            if (bg.type === 'cloud') {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                ctx.beginPath();
                ctx.arc(bg.x, bg.y, bg.size, 0, Math.PI * 2);
                ctx.arc(bg.x + bg.size * 0.8, bg.y - bg.size * 0.2, bg.size * 0.7, 0, Math.PI * 2);
                ctx.arc(bg.x + bg.size * 1.5, bg.y, bg.size * 0.8, 0, Math.PI * 2);
                ctx.fill();
            } else if (bg.type === 'floatingCandy') {
                ctx.globalAlpha = bg.opacity;
                ctx.fillStyle = bg.color;
                ctx.beginPath();
                ctx.arc(bg.x, bg.y, bg.radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;
            }
        });

        // Draw platforms
        this.platforms.forEach(platform => platform.draw(ctx));

        // Draw power-ups
        this.powerUps.forEach(powerUp => powerUp.draw(ctx));

        // Draw enemies
        this.enemies.forEach(enemy => enemy.draw(ctx));

        // Draw candies
        this.candies.forEach(candy => {
            if (!candy.collected) {
                // Candy glow
                const glowGradient = ctx.createRadialGradient(
                    candy.x, candy.y, 0,
                    candy.x, candy.y, candy.radius + 8
                );
                glowGradient.addColorStop(0, 'rgba(255,255,255,0.5)');
                glowGradient.addColorStop(1, 'transparent');
                ctx.fillStyle = glowGradient;
                ctx.beginPath();
                ctx.arc(candy.x, candy.y, candy.radius + 8, 0, Math.PI * 2);
                ctx.fill();

                // Candy
                ctx.beginPath();
                ctx.arc(candy.x, candy.y, candy.radius, 0, Math.PI * 2);
                ctx.fillStyle = candy.color;
                ctx.fill();

                // Candy shine
                ctx.beginPath();
                ctx.arc(candy.x - 3, candy.y - 3, candy.radius / 3, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(255,255,255,0.7)';
                ctx.fill();
            }
        });

        // Draw particles
        this.particles.forEach(p => p.draw(ctx));

        // Draw goal flag
        const flagX = this.goal.x;
        const flagY = this.goal.y;

        // Flag pole
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(flagX, flagY, 6, 80);

        // Flag (waving effect)
        const waveOffset = Math.sin(animationFrame * 0.1) * 3;
        ctx.fillStyle = '#FF6B6B';
        ctx.beginPath();
        ctx.moveTo(flagX + 6, flagY);
        ctx.lineTo(flagX + 60 + waveOffset, flagY + 25);
        ctx.lineTo(flagX + 6, flagY + 50);
        ctx.closePath();
        ctx.fill();

        // Star on flag
        ctx.fillStyle = '#FFD700';
        ctx.font = '24px Arial';
        ctx.fillText('★', flagX + 20, flagY + 32);

        ctx.restore();
    }
}

// --- Level Manager ---
class LevelManager {
    constructor() {
        this.currentLevelNum = 1;
        this.currentLevel = null;
        this.totalLevels = 3;
        this.levelStartTime = 0;
        this.timeBonus = 0;
    }

    loadLevel(levelNum) {
        this.currentLevelNum = levelNum;
        this.currentLevel = new Level(levelNum);
        this.levelStartTime = Date.now();
        
        // Reset player position
        emmaline.x = 50;
        emmaline.y = canvas.height - GROUND_HEIGHT - 80;
        emmaline.vx = 0;
        emmaline.vy = 0;
        emmaline.jumpCount = 0;
    }

    nextLevel() {
        if (this.currentLevelNum < this.totalLevels) {
            // Calculate time bonus
            const elapsed = (Date.now() - this.levelStartTime) / 1000;
            this.timeBonus = Math.max(0, Math.floor(60 - elapsed) * 5);
            score += this.timeBonus;
            
            this.loadLevel(this.currentLevelNum + 1);
            return true;
        } else {
            // Game completed!
            return false;
        }
    }

    getCurrentLevel() {
        return this.currentLevel;
    }

    resetToFirst() {
        score = 0;
        this.loadLevel(1);
    }
}

// --- High Score System ---
class HighScoreSystem {
    constructor() {
        this.storageKey = 'candyLandyHighScores';
        this.highScores = this.loadScores();
    }

    loadScores() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            return [];
        }
    }

    saveScores() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.highScores));
        } catch (e) {
            console.warn('Could not save high scores');
        }
    }

    addScore(newScore, level = 1) {
        const entry = {
            score: newScore,
            level: level,
            date: new Date().toLocaleDateString()
        };
        this.highScores.push(entry);
        this.highScores.sort((a, b) => b.score - a.score);
        this.highScores = this.highScores.slice(0, 10); // Keep top 10
        this.saveScores();
    }

    getHighScores() {
        return this.highScores;
    }

    getHighScore() {
        return this.highScores.length > 0 ? this.highScores[0].score : 0;
    }
}

const highScoreSystem = new HighScoreSystem();

// --- Game Functions ---
function initGame() {
    levelManager = new LevelManager();
    levelManager.loadLevel(1);
    emmaline = new Emmaline(50, canvas.height - GROUND_HEIGHT - 80);
    score = 0;
    gameState = 'start';
}

function resetGame() {
    score = 0;
    levelManager.resetToFirst();
    emmaline = new Emmaline(50, canvas.height - GROUND_HEIGHT - 80);
    gameState = 'playing';
    soundSystem.init();
}

function togglePause() {
    if (gameState === 'playing') {
        gameState = 'paused';
    } else if (gameState === 'paused') {
        gameState = 'playing';
    }
}

function handleKeyDown(e) {
    keys[e.key] = true;
    
    // Initialize audio on first keypress
    soundSystem.init();
    
    if (e.key === 'Escape') {
        if (gameState === 'playing' || gameState === 'paused') {
            togglePause();
        }
        e.preventDefault();
        return;
    }
    
    if (gameState === 'paused') return;
    
    if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'Enter') {
        if (gameState === 'playing') {
            emmaline.jump();
        } else if (gameState === 'start' || gameState === 'won' || gameState === 'lost') {
            resetGame();
        }
        e.preventDefault();
    }

    // Prevent scrolling
    if ([' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter'].includes(e.key)) {
        e.preventDefault();
    }
}

function handleKeyUp(e) {
    keys[e.key] = false;
}

function update() {
    if (gameState !== 'playing') return;

    // Handle continuous key presses
    if (keys['ArrowLeft']) {
        emmaline.moveLeft();
    } else if (keys['ArrowRight']) {
        emmaline.moveRight();
    } else {
        emmaline.stopMoving();
    }

    const level = levelManager.getCurrentLevel();
    emmaline.update(level);
    level.update();
}

// --- UI Drawing Functions ---
function drawStartScreen() {
    const level = levelManager.getCurrentLevel();
    level.draw();

    // Semi-transparent overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Title with gradient
    const titleGradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    titleGradient.addColorStop(0, '#FF69B4');
    titleGradient.addColorStop(0.5, '#FFD700');
    titleGradient.addColorStop(1, '#FF69B4');
    ctx.fillStyle = titleGradient;
    ctx.font = 'bold 64px Comic Sans MS, cursive';
    ctx.textAlign = 'center';
    ctx.fillText('🍬 Candy Landy 🍬', canvas.width / 2, canvas.height / 2 - 100);

    // High score
    const highScore = highScoreSystem.getHighScore();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '24px Comic Sans MS, cursive';
    ctx.fillText(`🏆 High Score: ${highScore}`, canvas.width / 2, canvas.height / 2 - 50);

    // Instructions
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '28px Comic Sans MS, cursive';
    ctx.fillText('Press SPACE or ENTER to Start', canvas.width / 2, canvas.height / 2 + 10);

    ctx.font = '20px Comic Sans MS, cursive';
    ctx.fillStyle = '#FFE4B5';
    ctx.fillText('← → Arrow Keys to Move', canvas.width / 2, canvas.height / 2 + 60);
    ctx.fillText('SPACE or ↑ to Jump (Double Jump!)', canvas.width / 2, canvas.height / 2 + 90);
    ctx.fillText('ESC to Pause | Collect candies & reach the flag!', canvas.width / 2, canvas.height / 2 + 120);
    
    // Power-up legend
    ctx.fillStyle = '#FFD700';
    ctx.fillText('⚡ Speed Boost  ★ Invincible  ↑↑ Triple Jump', canvas.width / 2, canvas.height / 2 + 160);

    // Draw animated character
    ctx.save();
    ctx.translate(canvas.width / 2 - 20, canvas.height / 2 + 200);
    ctx.scale(1.5, 1.5);
    emmaline.draw();
    ctx.restore();
}

function drawPauseScreen() {
    const level = levelManager.getCurrentLevel();
    level.draw();
    emmaline.draw();

    // Semi-transparent overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Pause message
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 56px Comic Sans MS, cursive';
    ctx.textAlign = 'center';
    ctx.fillText('⏸️ PAUSED ⏸️', canvas.width / 2, canvas.height / 2 - 30);

    ctx.fillStyle = '#FFD700';
    ctx.font = '28px Comic Sans MS, cursive';
    ctx.fillText('Press ESC to Resume', canvas.width / 2, canvas.height / 2 + 30);
}

function drawWinScreen() {
    const level = levelManager.getCurrentLevel();
    level.draw();
    emmaline.draw();

    // Semi-transparent overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (levelManager.currentLevelNum < levelManager.totalLevels) {
        // Level complete
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 48px Comic Sans MS, cursive';
        ctx.textAlign = 'center';
        ctx.fillText(`🎉 Level ${levelManager.currentLevelNum} Complete! 🎉`, canvas.width / 2, canvas.height / 2 - 60);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '32px Comic Sans MS, cursive';
        ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2);
        
        if (levelManager.timeBonus > 0) {
            ctx.fillStyle = '#98FB98';
            ctx.fillText(`Time Bonus: +${levelManager.timeBonus}`, canvas.width / 2, canvas.height / 2 + 40);
        }

        ctx.fillStyle = '#FFB6C1';
        ctx.font = '24px Comic Sans MS, cursive';
        ctx.fillText('Press SPACE for Next Level', canvas.width / 2, canvas.height / 2 + 100);
    } else {
        // Game completed!
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 56px Comic Sans MS, cursive';
        ctx.textAlign = 'center';
        ctx.fillText('🏆 YOU WIN! 🏆', canvas.width / 2, canvas.height / 2 - 80);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '32px Comic Sans MS, cursive';
        ctx.fillText(`Final Score: ${score}`, canvas.width / 2, canvas.height / 2);

        const highScore = highScoreSystem.getHighScore();
        ctx.fillStyle = '#98FB98';
        ctx.fillText(`High Score: ${highScore}`, canvas.width / 2, canvas.height / 2 + 50);

        if (score >= highScore) {
            ctx.fillStyle = '#FFD700';
            ctx.font = '24px Comic Sans MS, cursive';
            ctx.fillText('🎊 NEW HIGH SCORE! 🎊', canvas.width / 2, canvas.height / 2 + 90);
        }

        ctx.fillStyle = '#FFB6C1';
        ctx.font = '24px Comic Sans MS, cursive';
        ctx.fillText('Press SPACE to Play Again', canvas.width / 2, canvas.height / 2 + 140);

        // Save high score
        highScoreSystem.addScore(score, levelManager.currentLevelNum);
    }

    // Confetti
    const time = animationFrame * 0.1;
    for (let i = 0; i < 50; i++) {
        const x = (Math.sin(time + i * 0.5) * canvas.width / 2) + canvas.width / 2;
        const y = (Math.cos(time * 0.7 + i * 0.3) * canvas.height / 2) + canvas.height / 2;
        ctx.fillStyle = `hsl(${(time * 50 + i * 7) % 360}, 70%, 60%)`;
        ctx.fillRect(x, y, 8, 8);
    }
}

function drawLoseScreen() {
    const level = levelManager.getCurrentLevel();
    level.draw();

    // Semi-transparent overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Game over message
    ctx.fillStyle = '#FF6B6B';
    ctx.font = 'bold 56px Comic Sans MS, cursive';
    ctx.textAlign = 'center';
    ctx.fillText('😢 GAME OVER 😢', canvas.width / 2, canvas.height / 2 - 60);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '32px Comic Sans MS, cursive';
    ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2);

    const highScore = highScoreSystem.getHighScore();
    ctx.fillStyle = '#FFE4B5';
    ctx.font = '24px Comic Sans MS, cursive';
    ctx.fillText(`High Score: ${highScore}`, canvas.width / 2, canvas.height / 2 + 50);

    ctx.fillStyle = '#FFB6C1';
    ctx.font = '24px Comic Sans MS, cursive';
    ctx.fillText('Press SPACE or ENTER to Try Again', canvas.width / 2, canvas.height / 2 + 100);
}

function drawUI() {
    const level = levelManager.getCurrentLevel();
    
    // Score panel
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(10, 10, 200, 90);
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 20px Comic Sans MS, cursive';
    ctx.textAlign = 'left';
    ctx.fillText(`🍬 Score: ${score}`, 20, 35);
    ctx.fillText(`🏆 High: ${highScoreSystem.getHighScore()}`, 20, 60);
    ctx.fillText(`📍 Level ${levelManager.currentLevelNum}/${levelManager.totalLevels}`, 20, 85);

    // Jump indicator
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(canvas.width - 130, 10, 120, 40);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '18px Comic Sans MS, cursive';
    ctx.fillText(`Jumps: ${emmaline.maxJumps - emmaline.jumpCount}`, canvas.width - 120, 36);

    // Combo indicator
    if (emmaline.comboCount > 1) {
        const comboText = emmaline.comboCount >= 5 ? '🔥 MAX COMBO!' : `${emmaline.comboCount}x COMBO!`;
        ctx.fillStyle = `rgba(255, ${100 - emmaline.comboCount * 15}, 0, ${emmaline.comboTimer / 120})`;
        ctx.font = 'bold 24px Comic Sans MS, cursive';
        ctx.textAlign = 'center';
        ctx.fillText(comboText, canvas.width / 2, 40);
    }

    // Power-up indicators
    let yOffset = 110;
    if (emmaline.invincible) {
        ctx.fillStyle = 'rgba(255, 69, 0, 0.7)';
        ctx.fillRect(canvas.width - 130, yOffset, 120, 25);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '16px Comic Sans MS, cursive';
        ctx.textAlign = 'left';
        ctx.fillText(`★ Invincible: ${Math.ceil(emmaline.invincibleTimer / 60)}s`, canvas.width - 125, yOffset + 18);
        yOffset += 30;
    }
    
    if (emmaline.speedBoost) {
        ctx.fillStyle = 'rgba(255, 215, 0, 0.7)';
        ctx.fillRect(canvas.width - 130, yOffset, 120, 25);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '16px Comic Sans MS, cursive';
        ctx.fillText(`⚡ Speed: ${Math.ceil(emmaline.speedBoostTimer / 60)}s`, canvas.width - 125, yOffset + 18);
        yOffset += 30;
    }
    
    if (emmaline.tripleJump) {
        ctx.fillStyle = 'rgba(0, 191, 255, 0.7)';
        ctx.fillRect(canvas.width - 130, yOffset, 120, 25);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '16px Comic Sans MS, cursive';
        ctx.fillText(`↑↑ Triple: ${Math.ceil(emmaline.tripleJumpTimer / 60)}s`, canvas.width - 125, yOffset + 18);
    }

    // Volume controls hint
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(10, canvas.height - 35, 180, 25);
    ctx.fillStyle = '#FFE4B5';
    ctx.font = '14px Comic Sans MS, cursive';
    ctx.textAlign = 'left';
    ctx.fillText('1-5: Volume | 0: Mute', 20, canvas.height - 18);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const level = levelManager.getCurrentLevel();
    level.draw();

    if (gameState === 'playing') {
        emmaline.draw();
        drawUI();
    } else if (gameState === 'start') {
        emmaline.draw();
        drawStartScreen();
    } else if (gameState === 'won') {
        emmaline.draw();
        drawWinScreen();
    } else if (gameState === 'lost') {
        drawLoseScreen();
    } else if (gameState === 'paused') {
        drawPauseScreen();
    }
}

// Handle volume controls
function handleVolumeControls(e) {
    if (e.key >= '0' && e.key <= '5') {
        if (e.key === '0') {
            soundSystem.setMasterVolume(0);
        } else {
            const volume = parseInt(e.key) / 5;
            soundSystem.setMasterVolume(volume);
        }
    }
}

function gameLoop(timestamp) {
    // Calculate delta time
    if (lastTime === 0) {
        lastTime = timestamp;
    }
    deltaTime = timestamp - lastTime;
    lastTime = timestamp;
    
    animationFrame++;
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// --- Initialize ---
window.addEventListener('keydown', handleKeyDown);
window.addEventListener('keydown', handleVolumeControls);
window.addEventListener('keyup', handleKeyUp);

initGame();
gameLoop(0);
