// Working Candy Landy Game - Simplified Version
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Canvas settings
canvas.width = 800;
canvas.height = 600;

// Game state
let gameState = 'start';
let score = 0;
let animationFrame = 0;

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
    grounded: false
};

// Input
let keys = {};

document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    
    // Start game
    if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowUp') {
        if (gameState === 'start') {
            gameState = 'playing';
        }
    }
    
    // Pause
    if (e.key === 'Escape') {
        if (gameState === 'playing') {
            gameState = 'paused';
        } else if (gameState === 'paused') {
            gameState = 'playing';
        }
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Game objects
let platforms = [
    { x: 0, y: 550, width: 800, height: 50 },
    { x: 200, y: 450, width: 150, height: 20 },
    { x: 450, y: 350, width: 150, height: 20 },
    { x: 650, y: 250, width: 150, height: 20 }
];

let candies = [
    { x: 250, y: 420, collected: false },
    { x: 500, y: 320, collected: false },
    { x: 700, y: 220, collected: false }
];

// Update functions
function updatePlayer() {
    if (gameState !== 'playing') return;
    
    // Movement
    if (keys['ArrowLeft']) {
        player.vx = -player.speed;
    } else if (keys['ArrowRight']) {
        player.vx = player.speed;
    } else {
        player.vx *= 0.8;
    }
    
    // Jump
    if ((keys[' '] || keys['Enter'] || keys['ArrowUp']) && player.grounded) {
        player.vy = player.jumpPower;
        player.grounded = false;
    }
    
    // Physics
    player.vy += 0.8;
    player.x += player.vx;
    player.y += player.vy;
    
    // Platform collision
    player.grounded = false;
    platforms.forEach(platform => {
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
    
    // Collect candies
    candies.forEach(candy => {
        if (!candy.collected &&
            player.x < candy.x + 20 &&
            player.x + player.width > candy.x &&
            player.y < candy.y + 20 &&
            player.y + player.height > candy.y) {
            
            candy.collected = true;
            score += 10;
        }
    });
    
    // Reset if fall off screen
    if (player.y > 600) {
        gameState = 'start';
        resetGame();
    }
}

function resetGame() {
    player.x = 100;
    player.y = 400;
    player.vx = 0;
    player.vy = 0;
    candies.forEach(candy => candy.collected = false);
    score = 0;
}

// Drawing functions
function drawStartScreen() {
    // Background
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Title
    ctx.fillStyle = '#ff1493';
    ctx.font = '48px Comic Sans MS';
    ctx.textAlign = 'center';
    ctx.fillText('🍬 Candy Landy 🍬', canvas.width / 2, 150);
    
    // Instructions
    ctx.fillStyle = '#333';
    ctx.font = '24px Comic Sans MS';
    ctx.fillText('Press SPACE, ENTER, or UP ARROW to Start!', canvas.width / 2, 250);
    
    // Controls
    ctx.font = '18px Comic Sans MS';
    ctx.fillText('Use Arrow Keys to Move and Jump', canvas.width / 2, 350);
    ctx.fillText('Collect all the candies!', canvas.width / 2, 380);
    
    // Character preview
    ctx.fillStyle = '#ff69b4';
    ctx.fillRect(canvas.width / 2 - 20, 450, 40, 60);
    ctx.fillStyle = '#8b4513';
    ctx.fillRect(canvas.width / 2 - 25, 440, 50, 10);
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.arc(canvas.width / 2, 430, 15, 0, Math.PI * 2);
    ctx.fill();
}

function drawGame() {
    // Background
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Platforms
    ctx.fillStyle = '#ff69b4';
    platforms.forEach(platform => {
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
    });
    
    // Candies
    candies.forEach(candy => {
        if (!candy.collected) {
            ctx.fillStyle = '#ffd700';
            ctx.beginPath();
            ctx.arc(candy.x + 10, candy.y + 10, 10, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = '#ff69b4';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    });
    
    // Player
    ctx.fillStyle = '#ff69b4';
    ctx.fillRect(player.x, player.y, player.width, player.height);
    
    // Player details
    ctx.fillStyle = '#8b4513';
    ctx.fillRect(player.x - 5, player.y - 10, 50, 10);
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.arc(player.x + 20, player.y - 15, 15, 0, Math.PI * 2);
    ctx.fill();
    
    // Score
    ctx.fillStyle = '#333';
    ctx.font = '24px Comic Sans MS';
    ctx.textAlign = 'left';
    ctx.fillText('Score: ' + score, 20, 40);
}

function drawPauseScreen() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#fff';
    ctx.font = '48px Comic Sans MS';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2);
    
    ctx.font = '24px Comic Sans MS';
    ctx.fillText('Press ESC to Resume', canvas.width / 2, canvas.height / 2 + 60);
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
    }
    
    requestAnimationFrame(gameLoop);
}

// Start the game
gameLoop();