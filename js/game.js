// Canvas initialization will be done in initGame()

// --- Game Constants ---
const GRAVITY = 0.6;
const JUMP_STRENGTH = -14;
const MOVE_SPEED = 5;
const GROUND_HEIGHT = 60;

// --- Game State Variables ---
let emmaline;
let level;
let keys = {};
let score = 0;
let gameState = 'start'; // 'start', 'playing', 'won', 'lost'
let animationFrame = 0;

// --- Player Character: Emmaline ---
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
        this.maxJumps = 2; // Double jump!
    }

    update(level) {
        // Apply gravity
        this.vy += GRAVITY;

        // Apply movement
        this.x += this.vx;
        this.y += this.vy;

        // Update animation
        this.animTimer++;
        if (this.animTimer > 8) {
            this.animTimer = 0;
            this.animFrame = (this.animFrame + 1) % 4;
        }

        // Platform collision
        let onPlatform = false;

        // Check ground/platforms
        level.platforms.forEach(platform => {
            if (this.checkPlatformCollision(platform)) {
                onPlatform = true;
            }
        });

        // Screen bounds
        if (this.x < 0) this.x = 0;
        if (this.x + this.width > window.canvas.width) this.x = window.canvas.width - this.width;

        // Fell off screen
        if (this.y > window.canvas.height) {
            gameState = 'lost';
        }

        this.isOnGround = onPlatform;
        if (onPlatform) {
            this.jumpCount = 0;
        }
    }

    checkPlatformCollision(platform) {
        // Check if landing on top of platform
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

    draw() {
        window.ctx.save();
        
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;

        // Face direction
        if (!this.facingRight) {
            window.ctx.translate(centerX, centerY);
            window.ctx.scale(-1, 1);
            window.ctx.translate(-centerX, -centerY);
        }

        // Body (dress)
        window.ctx.fillStyle = '#FF69B4';
        window.ctx.beginPath();
        window.ctx.moveTo(centerX - 15, this.y + 25);
        window.ctx.lineTo(centerX + 15, this.y + 25);
        window.ctx.lineTo(centerX + 20, this.y + this.height);
        window.ctx.lineTo(centerX - 20, this.y + this.height);
        window.ctx.closePath();
        window.ctx.fill();

        // Head
        window.ctx.fillStyle = '#FFDAB9';
        window.ctx.beginPath();
        window.ctx.arc(centerX, this.y + 15, 15, 0, Math.PI * 2);
        window.ctx.fill();

        // Hair (brown pigtails)
        window.ctx.fillStyle = '#8B4513';

        // Left pigtail
        const pigtailSway = Math.sin(animationFrame * 0.2) * 3;
        window.ctx.beginPath();
        window.ctx.moveTo(centerX - 12, this.y + 12);
        window.ctx.quadraticCurveTo(
            centerX - 25 + pigtailSway,
            this.y + 20,
            centerX - 20 + pigtailSway,
            this.y + 35
        );
        window.ctx.quadraticCurveTo(
            centerX - 15 + pigtailSway,
            this.y + 25,
            centerX - 12,
            this.y + 15
        );
        window.ctx.fill();

        // Right pigtail
        window.ctx.beginPath();
        window.ctx.moveTo(centerX + 12, this.y + 12);
        window.ctx.quadraticCurveTo(
            centerX + 25 - pigtailSway,
            this.y + 20,
            centerX + 20 - pigtailSway,
            this.y + 35
        );
        window.ctx.quadraticCurveTo(
            centerX + 15 - pigtailSway,
            this.y + 25,
            centerX + 12,
            this.y + 15
        );
        window.ctx.fill();

        // Eyes
        window.ctx.fillStyle = '#000';
        window.ctx.beginPath();
        window.ctx.arc(centerX - 5, this.y + 13, 2, 0, Math.PI * 2);
        window.ctx.arc(centerX + 5, this.y + 13, 2, 0, Math.PI * 2);
        window.ctx.fill();

        // Smile
        window.ctx.strokeStyle = '#000';
        window.ctx.lineWidth = 1;
        window.ctx.beginPath();
        window.ctx.arc(centerX, this.y + 18, 4, 0, Math.PI);
        window.ctx.stroke();

        // Legs (animate when moving)
        const legOffset = (this.vx !== 0 && this.isOnGround) ? Math.sin(animationFrame * 0.3) * 5 : 0;
        window.ctx.fillStyle = '#FFDAB9';
        
        // Left leg
        window.ctx.fillRect(centerX - 10 + legOffset, this.y + this.height - 15, 6, 15);
        // Right leg
        window.ctx.fillRect(centerX + 4 - legOffset, this.y + this.height - 15, 6, 15);

        // Arms
        const armOffset = (this.vx !== 0) ? Math.sin(animationFrame * 0.3) * 8 : 0;
        window.ctx.fillRect(centerX - 20, this.y + 28 + armOffset, 6, 20);
        window.ctx.fillRect(centerX + 14, this.y + 28 - armOffset, 6, 20);

        window.ctx.restore();
    }

    jump() {
        if (this.jumpCount < this.maxJumps) {
            this.vy = JUMP_STRENGTH;
            this.jumpCount++;
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
}

// --- Level Class ---
class Level {
    constructor() {
        this.platforms = [];
        this.candies = [];
        this.goal = null;
        this.particles = [];
        this.loadLevel();
    }

    loadLevel() {
        // Ground
        this.platforms.push({
            x: 0,
            y: canvas.height - GROUND_HEIGHT,
            width: canvas.width,
            height: GROUND_HEIGHT,
            color: '#8B4513'
        });

        // Platforms at different heights
        this.platforms.push({ x: 100, y: 480, width: 150, height: 20, color: '#FF69B4' });
        this.platforms.push({ x: 350, y: 400, width: 120, height: 20, color: '#FFD700' });
        this.platforms.push({ x: 550, y: 320, width: 180, height: 20, color: '#87CEEB' });
        this.platforms.push({ x: 200, y: 250, width: 140, height: 20, color: '#DDA0DD' });
        this.platforms.push({ x: 500, y: 180, width: 150, height: 20, color: '#98FB98' });
        this.platforms.push({ x: 700, y: 120, width: 100, height: 20, color: '#FF6347' });

        // Candies (collectibles)
        this.candies.push({ x: 170, y: 450, radius: 12, color: '#FF1493', collected: false });
        this.candies.push({ x: 400, y: 370, radius: 14, color: '#FFD700', collected: false });
        this.candies.push({ x: 620, y: 290, radius: 13, color: '#00CED1', collected: false });
        this.candies.push({ x: 260, y: 220, radius: 15, color: '#FF69B4', collected: false });
        this.candies.push({ x: 560, y: 150, radius: 12, color: '#32CD32', collected: false });
        this.candies.push({ x: 730, y: 90, radius: 14, color: '#FF4500', collected: false });
        this.candies.push({ x: 50, y: 520, radius: 13, color: '#9370DB', collected: false });
        this.candies.push({ x: 750, y: 520, radius: 12, color: '#20B2AA', collected: false });

        // Goal flag
        this.goal = {
            x: window.canvas.width - 80,
            y: window.canvas.height - GROUND_HEIGHT - 80,
            width: 20,
            height: 80
        };
    }

    update() {
        // Check candy collection
        this.candies.forEach(candy => {
            if (!candy.collected) {
                const dx = candy.x - (emmaline.x + emmaline.width / 2);
                const dy = candy.y - (emmaline.y + emmaline.height / 2);
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < candy.radius + 20) {
                    candy.collected = true;
                    score += 10;
                    this.createParticles(candy.x, candy.y, candy.color);
                }
            }
        });

        // Update particles
        this.particles = this.particles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.1;
            p.life--;
            return p.life > 0;
        });

        // Check goal
        if (emmaline.x + emmaline.width > this.goal.x &&
            emmaline.x < this.goal.x + this.goal.width &&
            emmaline.y + emmaline.height > this.goal.y) {
            gameState = 'won';
        }
    }

    createParticles(x, y, color) {
        for (let i = 0; i < 10; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                life: 30,
                color: color,
                size: Math.random() * 4 + 2
            });
        }
    }

    draw() {
        // Draw background gradient
        const gradient = window.ctx.createLinearGradient(0, 0, 0, window.canvas.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(0.6, '#E0F7FA');
        gradient.addColorStop(1, '#98FB98');
        window.ctx.fillStyle = gradient;
        window.ctx.fillRect(0, 0, window.canvas.width, window.canvas.height);

        // Draw platforms
        this.platforms.forEach(platform => {
            // Platform shadow
            window.ctx.fillStyle = 'rgba(0,0,0,0.2)';
            window.ctx.fillRect(platform.x + 4, platform.y + 4, platform.width, platform.height);
            
            // Platform
            window.ctx.fillStyle = platform.color;
            window.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
            
            // Platform highlight
            window.ctx.fillStyle = 'rgba(255,255,255,0.3)';
            window.ctx.fillRect(platform.x, platform.y, platform.width, 4);
        });

        // Draw candies
        this.candies.forEach(candy => {
            if (!candy.collected) {
                // Candy glow
                window.ctx.beginPath();
                window.ctx.arc(candy.x, candy.y, candy.radius + 5, 0, Math.PI * 2);
                window.ctx.fillStyle = 'rgba(255,255,255,0.3)';
                window.ctx.fill();

                // Candy
                window.ctx.beginPath();
                window.ctx.arc(candy.x, candy.y, candy.radius, 0, Math.PI * 2);
                window.ctx.fillStyle = candy.color;
                window.ctx.fill();

                // Candy shine
                window.ctx.beginPath();
                window.ctx.arc(candy.x - 3, candy.y - 3, candy.radius / 3, 0, Math.PI * 2);
                window.ctx.fillStyle = 'rgba(255,255,255,0.6)';
                window.ctx.fill();
            }
        });

        // Draw particles
        this.particles.forEach(p => {
            window.ctx.globalAlpha = p.life / 30;
            window.ctx.fillStyle = p.color;
            window.ctx.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
        });
        window.ctx.globalAlpha = 1;

        // Draw goal flag
        const flagX = this.goal.x;
        const flagY = this.goal.y;

        // Flag pole
        window.ctx.fillStyle = '#8B4513';
        window.ctx.fillRect(flagX, flagY, 6, 80);

        // Flag
        window.ctx.fillStyle = '#FF6B6B';
        window.ctx.beginPath();
        window.ctx.moveTo(flagX + 6, flagY);
        window.ctx.lineTo(flagX + 60, flagY + 25);
        window.ctx.lineTo(flagX + 6, flagY + 50);
        window.ctx.closePath();
        window.ctx.fill();

        // Star on flag
        window.ctx.fillStyle = '#FFD700';
        window.ctx.font = '24px Arial';
        window.ctx.fillText('★', flagX + 20, flagY + 32);
    }
}

// --- Game Functions ---
function initGame() {
    // Initialize canvas
    window.canvas = document.getElementById('gameCanvas');
    if (!canvas) {
        console.error('Canvas element not found!');
        return;
    }
    
    window.ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error('Failed to get canvas context!');
        return;
    }
    
    // Set canvas dimensions
    canvas.width = 800;
    canvas.height = 600;
    
    // Initialize game objects
    level = new Level();
    emmaline = new Emmaline(50, canvas.height - GROUND_HEIGHT - 80);
    score = 0;
    gameState = 'start';
}

function resetGame() {
    level = new Level();
    emmaline = new Emmaline(50, canvas.height - GROUND_HEIGHT - 80);
    score = 0;
    gameState = 'playing';
}

function handleKeyDown(e) {
    keys[e.key] = true;
    
    if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'Enter') {
        if (gameState === 'playing') {
            emmaline.jump();
        } else if (gameState === 'start' || gameState === 'won' || gameState === 'lost') {
            resetGame();
        }
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

    emmaline.update(level);
    level.update();
}

function drawStartScreen() {
    // Semi-transparent overlay
    window.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    window.ctx.fillRect(0, 0, window.canvas.width, window.canvas.height);

    // Title
    window.ctx.fillStyle = '#FF69B4';
    window.ctx.font = 'bold 64px Comic Sans MS, cursive';
    window.ctx.textAlign = 'center';
    window.ctx.fillText('🍬 Candy Landy 🍬', window.canvas.width / 2, window.canvas.height / 2 - 100);

    // Instructions
    window.ctx.fillStyle = '#FFFFFF';
    window.ctx.font = '28px Comic Sans MS, cursive';
    window.ctx.fillText('Press SPACE or ENTER to Start', window.canvas.width / 2, window.canvas.height / 2);

    window.ctx.font = '20px Comic Sans MS, cursive';
    window.ctx.fillStyle = '#FFE4B5';
    window.ctx.fillText('← → Arrow Keys to Move', window.canvas.width / 2, window.canvas.height / 2 + 50);
    window.ctx.fillText('SPACE / ↑ / ENTER to Jump (Double Jump!)', window.canvas.width / 2, window.canvas.height / 2 + 80);
    window.ctx.fillText('Collect all the candies!', window.canvas.width / 2, window.canvas.height / 2 + 110);
    window.ctx.fillText('Reach the flag to win!', window.canvas.width / 2, window.canvas.height / 2 + 140);

    // Draw a sample character
    window.ctx.save();
    window.ctx.translate(window.canvas.width / 2 - 20, window.canvas.height / 2 + 180);
    window.ctx.scale(1.5, 1.5);
    
    // Mini Emmaline
    window.ctx.fillStyle = '#FF69B4';
    window.ctx.beginPath();
    window.ctx.moveTo(0, 15);
    window.ctx.lineTo(30, 15);
    window.ctx.lineTo(35, 50);
    window.ctx.lineTo(-5, 50);
    window.ctx.closePath();
    window.ctx.fill();
    
    window.ctx.fillStyle = '#FFDAB9';
    window.ctx.beginPath();
    window.ctx.arc(15, 5, 10, 0, Math.PI * 2);
    window.ctx.fill();
    
    window.ctx.fillStyle = '#8B4513';
    window.ctx.beginPath();
    window.ctx.arc(5, 3, 4, 0, Math.PI * 2);
    window.ctx.arc(25, 3, 4, 0, Math.PI * 2);
    window.ctx.fill();
    
    window.ctx.restore();
}

function drawWinScreen() {
    // Semi-transparent overlay
    window.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    window.ctx.fillRect(0, 0, window.canvas.width, window.canvas.height);

    // Victory message
    window.ctx.fillStyle = '#FFD700';
    window.ctx.font = 'bold 56px Comic Sans MS, cursive';
    window.ctx.textAlign = 'center';
    window.ctx.fillText('🎉 YOU WIN! 🎉', window.canvas.width / 2, window.canvas.height / 2 - 60);

    window.ctx.fillStyle = '#FFFFFF';
    window.ctx.font = '32px Comic Sans MS, cursive';
    window.ctx.fillText(`Final Score: ${score}`, window.canvas.width / 2, window.canvas.height / 2 + 10);

    window.ctx.fillStyle = '#98FB98';
    window.ctx.font = '24px Comic Sans MS, cursive';
    window.ctx.fillText('Press SPACE or ENTER to Play Again', window.canvas.width / 2, window.canvas.height / 2 + 70);

    // Confetti particles (simple animation)
    const time = Date.now() / 100;
    for (let i = 0; i < 50; i++) {
        const x = (Math.sin(time + i) * window.canvas.width / 2) + window.canvas.width / 2;
        const y = (Math.cos(time * 0.7 + i * 2) * window.canvas.height / 2) + window.canvas.height / 2;
        window.ctx.fillStyle = `hsl(${(time * 50 + i * 7) % 360}, 70%, 60%)`;
        window.ctx.fillRect(x, y, 8, 8);
    }
}

function drawLoseScreen() {
    // Semi-transparent overlay
    window.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    window.ctx.fillRect(0, 0, window.canvas.width, window.canvas.height);

    // Game over message
    window.ctx.fillStyle = '#FF6B6B';
    window.ctx.font = 'bold 56px Comic Sans MS, cursive';
    window.ctx.textAlign = 'center';
    window.ctx.fillText('😢 GAME OVER 😢', window.canvas.width / 2, window.canvas.height / 2 - 60);

    window.ctx.fillStyle = '#FFFFFF';
    window.ctx.font = '32px Comic Sans MS, cursive';
    window.ctx.fillText(`Score: ${score}`, window.canvas.width / 2, window.canvas.height / 2 + 10);

    window.ctx.fillStyle = '#FFB6C1';
    window.ctx.font = '24px Comic Sans MS, cursive';
    window.ctx.fillText('Press SPACE or ENTER to Try Again', window.canvas.width / 2, window.canvas.height / 2 + 70);
}

function drawUI() {
    // Score
    window.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    window.ctx.fillRect(10, 10, 150, 40);
    window.ctx.fillStyle = '#FFFFFF';
    window.ctx.font = 'bold 24px Comic Sans MS, cursive';
    window.ctx.textAlign = 'left';
    window.ctx.fillText(`🍬 Score: ${score}`, 20, 38);

    // Jump indicator
    window.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    window.ctx.fillRect(window.canvas.width - 120, 10, 110, 40);
    window.ctx.fillStyle = '#FFFFFF';
    window.ctx.font = '20px Comic Sans MS, cursive';
    window.ctx.fillText(`Jumps: ${emmaline.maxJumps - emmaline.jumpCount}`, window.canvas.width - 110, 38);
}

function draw() {
    window.ctx.clearRect(0, 0, window.canvas.width, window.canvas.height);

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
    }
}

function gameLoop() {
    animationFrame++;
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// --- Initialize ---
window.addEventListener('DOMContentLoaded', function() {
    initGame();
    gameLoop();
});

// Fallback for older browsers
window.addEventListener('load', function() {
    if (!window.canvas) {
        initGame();
        gameLoop();
    }
});

// Event listeners
window.addEventListener('keydown', handleKeyDown);
window.addEventListener('keyup', handleKeyUp);
