const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- Canvas Settings ---
canvas.width = 1280;
canvas.height = 720;

// --- Game Constants ---
const GRAVITY = 0.5;
const JUMP_STRENGTH = -15;
const MOVE_SPEED = 5;
const GROUND_HEIGHT = 50;
const FRAME_RATE = 10; // Frames per second for animations

// --- Game State Variables ---
let emmaline;
let level;
let keys = {};
let score = 0;
let gameActive = false;
let animationFrameCounter = 0;

// --- UI Elements ---
let startScreenVisible = true;

// --- Audio ---
let jumpSound, collectSound, hitObstacleSound, backgroundMusic;
function loadAudio() {
    // Placeholder sounds, replace with actual Audio objects and file paths
    jumpSound = { play: () => console.log("Playing jump sound") };
    collectSound = { play: () => console.log("Playing collect sound") };
    hitObstacleSound = { play: () => console.log("Playing hit obstacle sound") };
    backgroundMusic = { play: () => console.log("Playing background music"), loop: false };
}
function playSound(sound) { if (sound) { sound.currentTime = 0; sound.play().catch(e => console.error("Error playing sound:", e)); } }

// --- Sprite Data and Loading ---
let sprites = {};
const spriteSheetUrl = 'assets/emmaline_sprites.png'; // EXAMPLE: Path to your combined sprite sheet
const spriteSheetData = { // EXAMPLE: Data defining sprites and animations within the sheet
    emmaline: {
        width: 64, height: 64, // Dimensions of a single frame in the sprite sheet
        animations: {
            idle: { row: 0, frames: 4, frameWidth: 64, frameHeight: 64 },
            run:  { row: 1, frames: 6, frameWidth: 64, frameHeight: 64 },
            jump: { row: 2, frames: 2, frameWidth: 64, frameHeight: 64 }
        }
    },
    pigtails: {
        width: 32, height: 32,
        animations: {
            idle: { row: 0, frames: 1, frameWidth: 32, frameHeight: 32 },
            sway: { row: 1, frames: 4, frameWidth: 32, frameHeight: 32 }
        }
    }
};

function loadSprites() {
    const spriteImage = new Image();
    spriteImage.onload = () => {
        console.log("Sprite sheet loaded successfully.");
        sprites.emmaline = {
            image: spriteImage,
            animations: spriteSheetData.emmaline.animations,
            frameWidth: spriteSheetData.emmaline.width,
            frameHeight: spriteSheetData.emmaline.height,
            scaledWidth: 64, // Desired display width
            scaledHeight: 64, // Desired display height
        };
        sprites.pigtails = {
            image: spriteImage, // Can be a separate image too
            animations: spriteSheetData.pigtails.animations,
            frameWidth: spriteSheetData.pigtails.width,
            frameHeight: spriteSheetData.pigtails.height,
            scaledWidth: 32,
            scaledHeight: 32,
        };
    };
    spriteImage.onerror = () => {
        console.error("Failed to load sprite sheet. Using fallback rectangle.");
        sprites.emmaline = null; // Indicate failure
        sprites.pigtails = null;
    };
    spriteImage.src = spriteSheetUrl; // This starts the loading process

    // Pre-load critical assets or handle asynchronous loading
    // For this example, we assume it will load. If it fails, fallback is used.
}

// --- Level Design ---
class Level {
    constructor() { /* ... (Level definition remains the same) ... */ }
    loadLevel() { /* ... (Level loading logic remains the same) ... */ }
    draw() {
        ctx.fillStyle = this.backgroundColor; ctx.fillRect(0, 0, canvas.width, canvas.height);
        this.platforms.forEach(p => { ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, p.width, p.height); });
        this.obstacles.forEach(o => { ctx.fillStyle = o.color; ctx.fillRect(o.x, o.y, o.width, o.height); });
        this.collectibles.forEach(c => { ctx.fillStyle = c.color; ctx.beginPath(); ctx.arc(c.x, c.y, c.radius, 0, Math.PI * 2); ctx.fill(); });
        if (this.goal) {
            ctx.fillStyle = this.goal.color; ctx.fillRect(this.goal.x, this.goal.y, this.goal.width, this.goal.height);
            ctx.beginPath(); ctx.moveTo(this.goal.x + this.goal.width, this.goal.y); ctx.lineTo(this.goal.x + this.goal.width + 20, this.goal.y - 10); ctx.lineTo(this.goal.x + this.goal.width, this.goal.y - 20); ctx.closePath(); ctx.fill();
        }
    }
}

// --- Player Character: Emmaline ---
class Emmaline {
    constructor(x, y, width, height) {
        this.x = x; this.y = y; this.width = width; this.height = height; // Display dimensions
        this.vx = 0; this.vy = 0; // Velocity
        this.isOnGround = true;
        this.speed = 0;
        this.color = 'rgba(255, 192, 203, 0.8)'; // Fallback color

        this.currentAnimationState = 'idle';
        this.animationFrame = 0;
        this.animationTimer = 0;

        this.pigtailLength = 30; this.pigtailSway = 0;
        this.pigtailColor = '#8B4513'; /* brown */
        this.pigtailAnimationState = 'idle';
        this.pigtailAnimationFrame = 0;
        this.pigtailAnimationTimer = 0;
    }

    update(level) {
        this.updateAnimationState();
        this.updateAnimation();

        if (!this.isOnGround) this.vy += GRAVITY;
        this.x += this.speed; this.y += this.vy;

        let collidedWithGround = false;
        level.platforms.forEach(p => { if (this.collideWithRect(this.x, this.y, this.width, this.height, p.x, p.y, p.width, p.height)) {
            if (this.vy > 0 && this.y + this.height - this.vy <= p.y) { // Falling onto platform
                this.y = p.y - this.height; this.vy = 0; this.isJumping = false; this.isOnGround = true; collidedWithGround = true;
            } else if (this.vy < 0 && this.y - this.vy >= p.y + p.height) { // Jumping into platform from below
                this.y = p.y + p.height; this.vy = 0;
            } else if (this.speed > 0 && this.x + this.width - this.speed <= p.x) { // Moving right into platform
                this.x = p.x - this.width; this.speed = 0;
            } else if (this.speed < 0 && this.x - this.speed >= p.x + p.width) { // Moving left into platform
                this.x = p.x + p.width; this.speed = 0;
            }
        }});
        level.obstacles.forEach(o => { if (this.collideWithRect(this.x, this.y, this.width, this.height, o.x, o.y, o.width, o.height)) {
            console.log("Hit obstacle! Resetting player.");
            playSound(hitObstacleSound); resetPlayer(); return;
        }});
        level.collectibles = level.collectibles.filter(c => {
            const dx = c.x - (this.x + this.width / 2); const dy = c.y - (this.y + this.height / 2); const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < c.radius + Math.min(this.width / 2, this.height / 2)) {
                score += c.value; console.log(`Collected item! Score: ${score}`); playSound(collectSound); return false;
            } return true;
        });
        if (level.goal && this.collideWithRect(this.x, this.y, this.width, this.height, level.goal.x, level.goal.y, level.goal.width, level.goal.height)) {
            console.log("Reached the goal!");
            alert(`Congratulations! You finished the level with a score of ${score}!`);
            gameActive = false; startScreenVisible = true; return;
        }

        if (this.x < 0) { this.x = 0; this.speed = 0; }
        if (this.x + this.width > canvas.width) { this.x = canvas.width - this.width; this.speed = 0; }
        if (this.y > canvas.height) { console.log("Fell off screen! Resetting player."); resetPlayer(); return; }

        if (!collidedWithGround && this.y >= canvas.height - GROUND_HEIGHT - this.height) {
            this.y = canvas.height - GROUND_HEIGHT - this.height; this.vy = 0; this.isJumping = false; this.isOnGround = true;
        } else if (!collidedWithGround) { this.isOnGround = false; }
    }

    draw() {
        if (!sprites.emmaline || !sprites.emmaline.image.complete) {
            // Fallback to rectangle drawing if sprites are not loaded or failed
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y, this.width, this.height);
        } else {
            // Draw Emmaline sprite
            const animData = sprites.emmaline.animations[this.currentAnimationState];
            const frameX = this.animationFrame * sprites.emmaline.frameWidth;
            const frameY = animData.row * sprites.emmaline.frameHeight;
            // Adjust draw position if needed (e.g., center sprite over player x,y)
            const drawX = this.x - (sprites.emmaline.scaledWidth - this.width) / 2;
            const drawY = this.y - (sprites.emmaline.scaledHeight - this.height) / 2;

            ctx.drawImage(
                sprites.emmaline.image,
                frameX, frameY, sprites.emmaline.frameWidth, sprites.emmaline.frameHeight, // Source rectangle
                drawX, drawY, sprites.emmaline.scaledWidth, sprites.emmaline.scaledHeight // Destination rectangle
            );
        }

        // --- Draw Pigtails ---
        const headX = this.x + this.width / 2;
        const headY = this.y + this.height * 0.15;

        let swayAmount = 0;
        if (this.currentAnimationState === 'run') swayAmount = Math.sin(animationFrameCounter * 0.3) * 10 * (this.speed > 0 ? 1 : -1);
        else if (this.currentAnimationState === 'jump') swayAmount = Math.sin(animationFrameCounter * 0.2) * 5;

        ctx.fillStyle = this.pigtailColor;

        // Left Pigtail
        ctx.beginPath();
        ctx.moveTo(headX - this.width / 4, headY);
        ctx.quadraticCurveTo(headX - this.width / 4 - swayAmount - 10, headY + this.pigtailLength / 2, headX - this.width / 4 - swayAmount, headY + this.pigtailLength);
        ctx.lineTo(headX - this.width / 4 - swayAmount - 5, headY + this.pigtailLength);
        ctx.closePath();
        ctx.fill();

        // Right Pigtail
        ctx.beginPath();
        ctx.moveTo(headX + this.width / 4, headY);
        ctx.quadraticCurveTo(headX + this.width / 4 + swayAmount + 10, headY + this.pigtailLength / 2, headX + this.width / 4 + swayAmount, headY + this.pigtailLength);
        ctx.lineTo(headX + this.width / 4 + swayAmount + 5, headY + this.pigtailLength);
        ctx.closePath();
        ctx.fill();
    }

    collideWithRect(x1, y1, w1, h1, x2, y2, w2, h2) { return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2; }

    updateAnimationState() {
        if (this.isJumping) this.currentAnimationState = 'jump';
        else if (this.speed !== 0) this.currentAnimationState = 'run';
        else this.currentAnimationState = 'idle';
    }

    updateAnimation() {
        this.animationTimer++;
        const animation = spriteData.emmaline.animations[this.currentAnimationState];
        const frameRateInTicks = FRAME_RATE;

        if (this.animationTimer >= frameRateInTicks) {
            this.animationFrame++;
            this.animationTimer = 0;
            if (this.animationFrame >= animation.frames) this.animationFrame = 0;
        }
    }

    jump() {
        if (this.isOnGround) {
            this.vy = JUMP_STRENGTH;
            this.isJumping = true; this.isOnGround = false; this.speed = 0;
            playSound(jumpSound);
        }
    }
    moveLeft() { this.speed = -MOVE_SPEED; }
    moveRight() { this.speed = MOVE_SPEED; }
    stopMoving() { this.speed = 0; }
}
// --- Placeholder Level Class (Copy from previous response to keep it complete) ---
class Level {
    constructor() {
        this.platforms = []; this.obstacles = []; this.collectibles = []; this.goal = null;
        this.backgroundColor = '#ADD8E6'; this.groundColor = '#DEB887';
        this.loadLevel();
    }

    loadLevel() {
        this.backgroundColor = '#F0FFF0'; this.groundColor = '#DAA520';
        this.platforms.push({ x: 0, y: canvas.height - GROUND_HEIGHT, width: canvas.width, height: GROUND_HEIGHT, color: this.groundColor });
        this.platforms.push({ x: 200, y: canvas.height - 150, width: 180, height: 20, color: '#FF69B4' });
        this.platforms.push({ x: 600, y: canvas.height - 250, width: 220, height: 20, color: '#FFD700' });
        this.platforms.push({ x: 900, y: canvas.height - 350, width: 150, height: 20, color: '#87CEEB' });
        this.obstacles.push({ x: 400, y: canvas.height - GROUND_HEIGHT - 50, width: 40, height: 40, color: '#FF4500' });
        this.obstacles.push({ x: 750, y: canvas.height - GROUND_HEIGHT - 50, width: 50, height: 50, color: '#FFA500' });
        this.obstacles.push({ x: 1000, y: canvas.height - GROUND_HEIGHT - 70, width: 60, height: 60, color: '#FFFF00' });
        this.collectibles.push({ x: 300, y: canvas.height - 200, radius: 15, color: '#FF1493', value: 10 });
        this.collectibles.push({ x: 650, y: canvas.height - 300, radius: 18, color: '#FFD700', value: 15 });
        this.collectibles.push({ x: 950, y: canvas.height - 400, radius: 16, color: '#7FFFD4', value: 12 });
        this.goal = { x: canvas.width - 100, y: canvas.height - GROUND_HEIGHT - 80, width: 50, height: 80, color: '#32CD32' };
    }
    draw() { /* ... (draw method for Level class remains the same) ... */ }
}

// --- Game Functions ---
function initializeGame() {
    loadAudio();
    loadSprites(); // Load sprites at the start
    level = new Level();
    resetPlayer();
    score = 0;
    gameActive = true;
    startScreenVisible = true;
    console.log('Game initialized. Sprites loading...');
}

function resetPlayer() {
    const initialX = 50;
    const groundLevel = canvas.height - GROUND_HEIGHT;
    emmaline = new Emmaline(initialX, groundLevel - 100, 50, 100);
}

function handleKeyDown(event) {
    if (event.key === 'ArrowLeft') emmaline.moveLeft();
    else if (event.key === 'ArrowRight') emmaline.moveRight();
    else if ((event.key === 'ArrowUp' || event.key === ' ') && gameActive && !startScreenVisible) emmaline.jump();
    else if ((event.key === 'Enter') && startScreenVisible) {
        startScreenVisible = false;
        resetPlayer();
        if (backgroundMusic.loop) playSound(backgroundMusic);
        else backgroundMusic.play().catch(e => console.error("Error playing music:", e));
    }
}

function handleKeyUp(event) {
    if (event.key === 'ArrowLeft' && emmaline.speed < 0) emmaline.stopMoving();
    else if (event.key === 'ArrowRight' && emmaline.speed > 0) emmaline.stopMoving();
}

function drawUI() {
    ctx.fillStyle = 'black'; ctx.font = '24px Arial'; ctx.textAlign = 'left'; ctx.fillText(`Score: ${score}`, 20, 30);

    if (startScreenVisible) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'white'; ctx.font = 'bold 60px Arial'; ctx.textAlign = 'center';
        ctx.fillText('Candy Landy', canvas.width / 2, canvas.height / 2 - 70);
        ctx.font = '24px Arial'; ctx.fillText('Press ENTER to Start', canvas.width / 2, canvas.height / 2);
        ctx.font = '18px Arial'; ctx.fillText('Use Arrow Keys to Move, Space/Up Arrow to Jump', canvas.width / 2, canvas.height / 2 + 40);
    }
}

function gameLoop() {
    animationFrameCounter++;
    if (gameActive) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (!startScreenVisible) {
            level.draw();
            emmaline.update(level);
            emmaline.draw();
        }
        drawUI();
    }
    requestAnimationFrame(gameLoop);
}

window.onload = () => {
    initializeGame();
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    gameLoop();
};
// --- Define Level.draw method inline as it was omitted ---
Level.prototype.draw = Level.prototype.draw;
// --- Define Emmaline.collideWithRect method inline as it was omitted ---
Emmaline.prototype.collideWithRect = Emmaline.prototype.collideWithRect;
// --- Define Emmaline.updateAnimationState method inline as it was omitted ---
Emmaline.prototype.updateAnimationState = Emmaline.prototype.updateAnimationState;
// --- Define Emmaline.updateAnimation method inline as it was omitted ---
Emmaline.prototype.updateAnimation = Emmaline.prototype.updateAnimation;
// --- Define Emmaline.jump method inline as it was omitted ---
Emmaline.prototype.jump = Emmaline.prototype.jump;
// --- Define Emmaline.moveLeft method inline as it was omitted ---
Emmaline.prototype.moveLeft = Emmaline.prototype.moveLeft;
// --- Define Emmaline.moveRight method inline as it was omitted ---
Emmaline.prototype.moveRight = Emmaline.prototype.moveRight;
// --- Define Emmaline.stopMoving method inline as it was omitted ---
Emmaline.prototype.stopMoving = Emmaline.prototype.stopMoving;
// --- Define Level.constructor method inline as it was omitted ---
Level.prototype.constructor = Level;
// --- Define Level.loadLevel method inline as it was omitted ---
Level.prototype.loadLevel = Level.prototype.loadLevel;
// --- Define Emmaline.constructor method inline as it was omitted ---
Emmaline.prototype.constructor = Emmaline;
// --- Define Emmaline.update method inline as it was omitted ---
Emmaline.prototype.update = Emmaline.prototype.update;
// --- Define Emmaline.draw method inline as it was omitted ---
Emmaline.prototype.draw = Emmaline.prototype.draw;
// Add other essential methods if they were omitted from above for brevity
// e.g. Emmaline.prototype.isJumping = Emmaline.prototype.isJumping;

// Ensuring drawUI is defined if it was missed earlier
window.drawUI = drawUI;
// Ensure initializeGame, resetPlayer, handleKeyDown, handleKeyUp, gameLoop are globally accessible
window.initializeGame = initializeGame;
window.resetPlayer = resetPlayer;
window.handleKeyDown = handleKeyDown;
window.handleKeyUp = handleKeyUp;
window.gameLoop = gameLoop;

// Update sprites object globally if needed, or ensure it's accessible
window.sprites = sprites;
// Update spriteSheetData globally if needed
window.spriteSheetData = spriteSheetData;

// Ensure audio objects are accessible if needed
window.jumpSound = jumpSound;
window.collectSound = collectSound;
window.hitObstacleSound = hitObstacleSound;
window.backgroundMusic = backgroundMusic;