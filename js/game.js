// Canvas initialization will be done in initGame()

const GRAVITY = 0.6;
const JUMP_STRENGTH = -14;
const MOVE_SPEED = 5;
const GROUND_HEIGHT = 60;

let emmaline, level, keys = {}, score = 0, gameState = 'start', animationFrame = 0;

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
        this.maxJumps = 2;
    }

    update() {
        this.vy += GRAVITY;
        this.x += this.vx;
        this.y += this.vy;

        if (this.animTimer > 8) {
            this.animTimer = 0;
            this.animFrame = (this.animFrame + 1) % 4;
        }

        let onPlatform = false;
        level.platforms.forEach(platform => {
            if (this.checkPlatformCollision(platform)) onPlatform = true;
        });

        if (this.x < 0) this.x = 0;
        if (this.x + this.width > canvas.width) this.x = canvas.width - this.width;

        if (this.y > canvas.height) {
            gameState = 'lost';
        }

        this.isOnGround = onPlatform;
        if (onPlatform) this.jumpCount = 0;
    }

    checkPlatformCollision(platform) {
        const prevY = this.y - this.vy;
        if (this.x + this.width > platform.x &&
            this.x < platform.x + platform.width &&
            this.y + this.height >= platform.y &&
            prevY + this.height <= platform.y + 10 &&
            this.vy >= 0) {
            this.y = platform.y - this.height;
            this.vy = 0;
            return true;
        }
        return false;
    }

    draw() {
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;

        if (!this.facingRight) {
            canvas.ctx.translate(centerX, centerY);
            canvas.ctx.scale(-1, 1);
            canvas.ctx.translate(-centerX, -centerY);
        }

        canvas.ctx.fillStyle = '#FF69B4';
        canvas.ctx.beginPath();
        canvas.ctx.moveTo(centerX - 15, this.y + 25);
        canvas.ctx.lineTo(centerX + 15, this.y + 25);
        canvas.ctx.lineTo(centerX + 20, this.y + this.height);
        canvas.ctx.lineTo(centerX - 20, this.y + this.height);
        canvas.ctx.closePath();
        canvas.ctx.fill();

        canvas.ctx.fillStyle = '#FFDAB9';
        canvas.ctx.beginPath();
        canvas.ctx.arc(centerX, this.y + 15, 15, 0, Math.PI * 2);
        canvas.ctx.fill();

        const pigtailSway = Math.sin(animationFrame * 0.2) * 3;
        canvas.ctx.fillStyle = '#8B4513';

        // Left pigtail
        canvas.ctx.beginPath();
        canvas.ctx.moveTo(centerX - 12, this.y + 12);
        canvas.ctx.quadraticCurveTo(centerX - 25 + pigtailSway, this.y + 20, centerX - 20 + pigtailSway, this.y + 35);
        canvas.ctx.quadraticCurveTo(centerX - 15 + pigtailSway, this.y + 25, centerX - 12, this.y + 15);
        canvas.ctx.fill();

        // Right pigtail
        canvas.ctx.beginPath();
        canvas.ctx.moveTo(centerX + 12, this.y + 12);
        canvas.ctx.quadraticCurveTo(centerX + 25 - pigtailSway, this.y + 20, centerX + 20 - pigtailSway, this.y + 35);
        canvas.ctx.quadraticCurveTo(centerX + 15 - pigtailSway, this.y + 25, centerX + 12, this.y + 15);
        canvas.ctx.fill();

        canvas.ctx.fillStyle = '#000';
        canvas.ctx.beginPath();
        canvas.ctx.arc(centerX - 5, this.y + 13, 2, 0, Math.PI * 2);
        canvas.ctx.arc(centerX + 5, this.y + 13, 2, 0, Math.PI * 2);
        canvas.ctx.fill();

        canvas.ctx.strokeStyle = '#000';
        canvas.ctx.lineWidth = 1;
        canvas.ctx.beginPath();
        canvas.ctx.arc(centerX, this.y + 18, 4, 0, Math.PI);
        canvas.ctx.stroke();

        const legOffset = (this.vx !== 0 && this.isOnGround) ? Math.sin(animationFrame * 0.3) * 5 : 0;
        canvas.ctx.fillStyle = '#FFDAB9';

        // Legs
        canvas.ctx.fillRect(centerX - 10 + legOffset, this.y + this.height - 15, 6, 15);
        canvas.ctx.fillRect(centerX + 4 - legOffset, this.y + this.height - 15, 6, 15);

        // Arms
        const armOffset = (this.vx !== 0) ? Math.sin(animationFrame * 0.3) * 8 : 0;
        canvas.ctx.fillRect(centerX - 20, this.y + 28 + armOffset, 6, 20);
        canvas.ctx.fillRect(centerX + 14, this.y + 28 - armOffset, 6, 20);

        canvas.ctx.restore();
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
        this.platforms.push({ x: 0, y: canvas.height - GROUND_HEIGHT, width: canvas.width, height: GROUND_HEIGHT, color: '#8B4513' });

        // Platforms
        this.platforms.push({ x: 100, y: 480, width: 150, height: 20, color: '#FF69B4' });
        this.platforms.push({ x: 350, y: 400, width: 120, height: 20, color: '#FFD700' });
        this.platforms.push({ x: 550, y: 320, width: 180, height: 20, color: '#87CEEB' });
        this.platforms.push({ x: 200, y: 250, width: 140, height: 20, color: '#DDA0DD' });
        this.platforms.push({ x: 500, y: 180, width: 150, height: 20, color: '#98FB98' });
        this.platforms.push({ x: 700, y: 120, width: 100, height: 20, color: '#FF6347' });

        // Candies
        this.candies.push({ x: 170, y: 450, radius: 12, color: '#FF1493', collected: false });
        this.candies.push({ x: 400, y: 370, radius: 14, color: '#FFD700', collected: false });
        this.candies.push({ x: 620, y: 290, radius: 13, color: '#00CED1', collected: false });
        this.candies.push({ x: 260, y: 220, radius: 15, color: '#FF69B4', collected: false });
        this.candies.push({ x: 560, y: 150, radius: 12, color: '#32CD32', collected: false });
        this.candies.push({ x: 730, y: 90, radius: 14, color: '#FF4500', collected: false });
        this.candies.push({ x: 50, y: 520, radius: 13, color: '#9370DB', collected: false });
        this.candies.push({ x: 750, y: 520, radius: 12, color: '#20B2AA', collected: false });

        // Goal flag
        this.goal = { x: canvas.width - 80, y: canvas.height - GROUND_HEIGHT - 80, width: 20, height: 80 };
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
            this.particles.push({ x: x, y: y, vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.5) * 6, life: 30, color: color, size: Math.random() * 4 + 2 });
        }
    }

    draw() {
        // Draw background gradient
        const gradient = canvas.ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(0.6, '#E0F7FA');
        gradient.addColorStop(1, '#98FB98');
        canvas.ctx.fillStyle = gradient;
        canvas.ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw platforms
        this.platforms.forEach(platform => {
            canvas.ctx.fillStyle = 'rgba(0,0,0,0.2)';
            canvas.ctx.fillRect(platform.x + 4, platform.y + 4, platform.width, platform.height);

            canvas.ctx.fillStyle = platform.color;
            canvas.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);

            canvas.ctx.fillStyle = 'rgba(255,255,255,0.3)';
            canvas.ctx.fillRect(platform.x, platform.y, platform.width, 4);
        });

        // Draw candies
        this.candies.forEach(candy => {
            if (!candy.collected) {
                canvas.ctx.beginPath();
                canvas.ctx.arc(candy.x, candy.y, candy.radius + 5, 0, Math.PI * 2);
                canvas.ctx.fillStyle = 'rgba(255,255,255,0.3)';
                canvas.ctx.fill();

                canvas.ctx.beginPath();
                canvas.ctx.arc(candy.x, candy.y, candy.radius, 0, Math.PI * 2);
                canvas.ctx.fillStyle = candy.color;
                canvas.ctx.fill();

                canvas.ctx.beginPath();
                canvas.ctx.arc(candy.x - 3, candy.y - 3, candy.radius / 3, 0, Math.PI * 2);
                canvas.ctx.fillStyle = 'rgba(255,255,255,0.6)';
                canvas.ctx.fill();
            }
        });

        // Draw particles
        this.particles.forEach(p => {
            canvas.ctx.globalAlpha = p.life / 30;
            canvas.ctx.fillStyle = p.color;
            canvas.ctx.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
        });
        canvas.ctx.globalAlpha = 1;

        // Draw goal flag
        const flagX = this.goal.x, flagY = this.goal.y;

        canvas.ctx.fillStyle = '#8B4513';
        canvas.ctx.fillRect(flagX, flagY, 6, 80);

        canvas.ctx.fillStyle = '#FF6B6B';
        canvas.ctx.beginPath();
        canvas.ctx.moveTo(flagX + 6, flagY);
        canvas.ctx.lineTo(flagX + 60, flagY + 25);
        canvas.ctx.lineTo(flagX + 6, flagY + 50);
        canvas.ctx.closePath();
        canvas.ctx.fill();

        canvas.ctx.fillStyle = '#FFD700';
        canvas.ctx.font = '24px Arial';
        canvas.ctx.fillText('★', flagX + 20, flagY + 32);
    }
}

function initGame() {
    canvas = document.getElementById('gameCanvas');
    if (!canvas) {
        console.error('Canvas element not found!');
        return;
    }

    ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error('Failed to get canvas context!');
        return;
    }

    canvas.width = 800;
    canvas.height = 600;

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
        } else if (gameState !== 'lost') {
            resetGame();
        }
    }

    if ([' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter'].includes(e.key)) {
        e.preventDefault();
    }
}

function handleKeyUp(e) {
    keys[e.key] = false;
}

function update() {
    if (gameState !== 'playing') return;

    if (keys['ArrowLeft']) {
        emmaline.moveLeft();
    } else if (keys['ArrowRight']) {
        emmaline.moveRight();
    } else {
        emmaline.stopMoving();
    }

    emmaline.update();
    level.update();
}

function drawStartScreen() {
    canvas.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    canvas.ctx.fillRect(0, 0, canvas.width, canvas.height);

    canvas.ctx.fillStyle = '#FF69B4';
    canvas.ctx.font = 'bold 64px Comic Sans MS, cursive';
    canvas.ctx.textAlign = 'center';
    canvas.ctx.fillText('🍬 Candy Landy 🍬', canvas.width / 2, canvas.height / 2 - 100);

    canvas.ctx.fillStyle = '#FFFFFF';
    canvas.ctx.font = '28px Comic Sans MS, cursive';
    canvas.ctx.fillText('Press SPACE or ENTER to Start', canvas.width / 2, canvas.height / 2);

    canvas.ctx.font = '20px Comic Sans MS, cursive';
    canvas.ctx.fillStyle = '#FFE4B5';
    canvas.ctx.fillText('← → Arrow Keys to Move', canvas.width / 2, canvas.height / 2 + 50);
    canvas.ctx.fillText('SPACE / ↑ / ENTER to Jump (Double Jump!)', canvas.width / 2, canvas.height / 2 + 80);
    canvas.ctx.fillText('Collect all the candies!', canvas.width / 2, canvas.height / 2 + 110);
    canvas.ctx.fillText('Reach the flag to win!', canvas.width / 2, canvas.height / 2 + 140);

    canvas.ctx.save();
    canvas.ctx.translate(canvas.width / 2 - 20, canvas.height / 2 + 180);
    canvas.ctx.scale(1.5, 1.5);

    // Mini Emmaline
    canvas.ctx.fillStyle = '#FF69B4';
    canvas.ctx.beginPath();
    canvas.ctx.moveTo(0, 15);
    canvas.ctx.lineTo(30, 15);
    canvas.ctx.lineTo(35, 50);
    canvas.ctx.lineTo(-5, 50);
    canvas.ctx.closePath();
    canvas.ctx.fill();

    canvas.ctx.fillStyle = '#FFDAB9';
    canvas.ctx.beginPath();
    canvas.ctx.arc(15, 5, 10, 0, Math.PI * 2);
    canvas.ctx.fill();

    canvas.ctx.fillStyle = '#8B4513';
    canvas.ctx.beginPath();
    canvas.ctx.arc(5, 3, 4, 0, Math.PI * 2);
    canvas.ctx.arc(25, 3, 4, 0, Math.PI * 2);
    canvas.ctx.fill();

    canvas.ctx.restore();
}

function drawWinScreen() {
    const overlay = 'rgba(0, 0, 0, 0.7)';
    canvas.ctx.fillStyle = overlay;
    canvas.ctx.fillRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    canvas.ctx.fillStyle = '#FFD700';
    canvas.ctx.font = 'bold 56px Comic Sans MS, cursive';
    canvas.ctx.textAlign = 'center';
    canvas.ctx.fillText('🎉 YOU WIN! 🎉', centerX, centerY - 60);

    canvas.ctx.fillStyle = '#FFFFFF';
    canvas.ctx.font = '32px Comic Sans MS, cursive';
    canvas.ctx.fillText('Final Score: ' + score, centerX, centerY + 10);

    canvas.ctx.fillStyle = '#98FB98';
    canvas.ctx.font = '24px Comic Sans MS, cursive';
    canvas.ctx.fillText('Press SPACE or ENTER to Play Again', centerX, centerY + 70);

    const time = Date.now() / 100;
    for (let i = 0; i < 50; i++) {
        const x = (Math.sin(time + i) * canvas.width / 2) + centerX;
        const y = (Math.cos(time * 0.7 + i * 2) * canvas.height / 2) + centerY;
        canvas.ctx.fillStyle = 'hsl(' + ((time * 50 + i * 7) % 360) + ', 70%, 60%)';
        canvas.ctx.fillRect(x, y, 8, 8);
    }
}

function drawLoseScreen() {
    const overlay = 'rgba(0, 0, 0, 0.7)';
    canvas.ctx.fillStyle = overlay;
    canvas.ctx.fillRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    canvas.ctx.fillStyle = '#FF6B6B';
    canvas.ctx.font = 'bold 56px Comic Sans MS, cursive';
    canvas.ctx.textAlign = 'center';
    canvas.ctx.fillText('😢 GAME OVER 😢', centerX, centerY - 60);

    canvas.ctx.fillStyle = '#FFFFFF';
    canvas.ctx.font = '32px Comic Sans MS, cursive';
    canvas.ctx.fillText('Score: ' + score, centerX, centerY + 10);

    canvas.ctx.fillStyle = '#FFB6C1';
    canvas.ctx.font = '24px Comic Sans MS, cursive';
    canvas.ctx.fillText('Press SPACE or ENTER to Try Again', centerX, centerY + 70);
}

function drawUI() {
    canvas.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    canvas.ctx.fillRect(10, 10, 150, 40);
    canvas.ctx.fillStyle = '#FFFFFF';
    canvas.ctx.font = 'bold 24px Comic Sans MS, cursive';
    canvas.ctx.textAlign = 'left';
    canvas.ctx.fillText('🍬 Score: ' + score, 20, 38);

    canvas.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    canvas.ctx.fillRect(canvas.width - 120, 10, 110, 40);
    canvas.ctx.fillStyle = '#FFFFFF';
    canvas.ctx.font = '20px Comic Sans MS, cursive';
    canvas.ctx.fillText('Jumps: ' + (emmaline.maxJumps - emmaline.jumpCount), canvas.width - 110, 38);
}

function draw() {
    canvas.ctx.clearRect(0, 0, canvas.width, canvas.height);

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

window.addEventListener('DOMContentLoaded', function() {
    initGame();
    gameLoop();
});
