/**
 * player.js - Player Class with Movement, Physics, and Interactions
 * Contains the Player class and all player-related functionality
 */

import { 
    POWER_UPS, 
    SETTINGS, 
    PHYSICS, 
    PLAYER_CONFIG, 
    GROUND_POUND,
    CANVAS 
} from './config.js';
import { ParticleSystem, particleSystem } from './particles.js';
import { AudioManager, audioManager } from './audio.js';
import { InputManager, inputManager } from './input.js';

/**
 * Enemy class - Represents an enemy in the game
 */
export class Enemy {
    constructor(data) {
        this.x = data.x;
        this.y = data.y;
        this.width = data.width || 30;
        this.height = data.height || 30;
        this.vx = data.vx || 2;
        this.range = data.range || 80;
        this.startX = data.startX || data.x;
    }

    /**
     * Update enemy position
     */
    update() {
        this.x += this.vx;
        if (Math.abs(this.x - this.startX) > this.range) {
            this.vx *= -1;
        }
    }

    /**
     * Draw the enemy
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    draw(ctx) {
        // Enemy body
        ctx.fillStyle = '#ff4444';
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Enemy eyes
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(this.x + 10, this.y + 10, 5, 0, Math.PI * 2);
        ctx.arc(this.x + 20, this.y + 10, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(this.x + 10, this.y + 10, 2, 0, Math.PI * 2);
        ctx.arc(this.x + 20, this.y + 10, 2, 0, Math.PI * 2);
        ctx.fill();

        // Enemy angry mouth
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x + 15, this.y + 20, 6, 0, Math.PI);
        ctx.stroke();
    }
}

/**
 * Player class - Main player character
 */
export class Player {
    constructor(x = PLAYER_CONFIG.START_X, y = PLAYER_CONFIG.START_Y) {
        // Position and dimensions
        this.x = x;
        this.y = y;
        this.width = PLAYER_CONFIG.WIDTH;
        this.height = PLAYER_CONFIG.HEIGHT;

        // Velocity
        this.vx = 0;
        this.vy = 0;

        // Movement
        this.speed = PHYSICS.PLAYER_SPEED;
        this.jumpPower = PHYSICS.JUMP_POWER;

        // State
        this.grounded = false;
        this.lives = PLAYER_CONFIG.START_LIVES;
        this.powerUp = null;
        this.powerUpTimer = 0;
        this.invincible = false;
        this.invincibleTimer = 0;

        // Jump mechanics
        this.jumpState = 'grounded';
        this.jumpCount = 0;
        this.coyoteTime = 0;
        this.jumpBuffer = 0;

        // Animation
        this.legAnimation = 0;
        this.armAnimation = 0;
        this.bodyBounce = 0;
        this.jumpAnimationFrame = 0;

        // Platform tracking
        this.currentPlatform = null;
        this.previousPlatformX = 0;

        // Dash
        this.dashCooldown = 0;
        this.dashTimer = 0;
        this.isDashing = false;

        // Wall jump
        this.wallSliding = false;
        this.wallDir = 0;
        this.canWallSlide = true;
        this.canWallJump = true;
    }

    /**
     * Reset player to initial state
     */
    reset() {
        this.x = PLAYER_CONFIG.START_X;
        this.y = PLAYER_CONFIG.START_Y;
        this.vx = 0;
        this.vy = 0;
        this.lives = PLAYER_CONFIG.START_LIVES;
        this.powerUp = null;
        this.powerUpTimer = 0;
        this.invincible = false;
        this.invincibleTimer = 0;
        this.dashCooldown = 0;
        this.dashTimer = 0;
        this.isDashing = false;
        this.wallSliding = false;
        this.wallDir = 0;
        this.jumpState = 'grounded';
        this.jumpCount = 0;
    }

    /**
     * Respawn player at checkpoint or start
     * @param {Object} checkpoint - Checkpoint position or null
     */
    respawn(checkpoint = null) {
        if (checkpoint) {
            this.x = checkpoint.x + 15 - this.width / 2;
            this.y = checkpoint.y - this.height;
        } else {
            this.x = PLAYER_CONFIG.START_X;
            this.y = PLAYER_CONFIG.START_Y;
        }
        this.vx = 0;
        this.vy = 0;
        this.invincible = true;
        this.invincibleTimer = PLAYER_CONFIG.INVINCIBILITY_TIME;
    }

    /**
     * Take damage
     * @returns {boolean} - True if player died
     */
    takeDamage() {
        if (this.invincible || this.isDashing) return false;

        if (this.powerUp === POWER_UPS.SHIELD) {
            this.powerUp = null;
            this.invincible = true;
            this.invincibleTimer = PLAYER_CONFIG.INVINCIBILITY_TIME;
            return false;
        }

        this.lives--;
        return this.lives <= 0;
    }

    /**
     * Start dash
     */
    startDash() {
        if (this.dashCooldown > 0 || !this.grounded) return false;

        this.isDashing = true;
        this.dashTimer = PLAYER_CONFIG.DASH_DURATION;
        this.dashCooldown = PLAYER_CONFIG.DASH_COOLDOWN;
        this.vx = this.speed * PLAYER_CONFIG.DASH_SPEED_MULTIPLIER;
        this.vy = 0;
        this.invincible = true;

        return true;
    }

    /**
     * Update player state
     * @param {Level} level - Current level
     * @param {number} animationFrame - Current animation frame
     * @param {Object} groundPound - Ground pound state
     */
    update(level, animationFrame, groundPound) {
        // Update dash
        if (this.isDashing) {
            this.dashTimer--;
            if (this.dashTimer <= 0) {
                this.isDashing = false;
                this.invincible = false;
            }
        }

        // Update dash cooldown
        if (this.dashCooldown > 0) {
            this.dashCooldown--;
        }

        // Update power-up timer
        if (this.powerUp) {
            this.powerUpTimer--;
            if (this.powerUpTimer <= 0) {
                this.powerUp = null;
            }
        }

        // Update invincibility
        if (this.invincible) {
            this.invincibleTimer--;
            if (this.invincibleTimer <= 0) {
                this.invincible = false;
            }
        }

        // Coyote time
        if (this.grounded) {
            this.coyoteTime = PLAYER_CONFIG.COYOTE_TIME;
        } else {
            this.coyoteTime--;
        }

        // Jump buffer
        if (inputManager.isJumpPressed()) {
            this.jumpBuffer = PLAYER_CONFIG.JUMP_BUFFER;
        } else {
            this.jumpBuffer--;
        }

        // Movement
        let currentSpeed = this.speed;
        if (this.powerUp === POWER_UPS.SPEED) {
            currentSpeed = 8;
        }

        if (inputManager.isLeftPressed()) {
            this.vx = -currentSpeed;
        } else if (inputManager.isRightPressed()) {
            this.vx = currentSpeed;
        } else {
            this.vx *= 0.8;
        }

        // Wall sliding detection
        this.wallSliding = false;
        this.wallDir = 0;

        if (this.canWallSlide && this.vy > 0 && !this.grounded) {
            this.checkWallSlide(level);
        }

        // Wall jump
        const canWallJump = inputManager.isJumpPressed() && this.wallSliding && this.jumpCount === 0;
        if (canWallJump) {
            this.performWallJump();
        }

        // Jump handling
        const canJump = (this.jumpBuffer > 0 || inputManager.isJumpPressed()) &&
                        ((this.grounded || this.coyoteTime > 0 || this.jumpCount === 1) && this.jumpCount < 2);

        if (canJump && !canWallJump) {
            this.performJump();
        }

        // Physics
        this.vy += PHYSICS.GRAVITY;

        // Cap fall speed
        if (this.vy > PHYSICS.TERMINAL_VELOCITY) {
            this.vy = PHYSICS.TERMINAL_VELOCITY;
        }

        this.x += this.vx;
        this.y += this.vy;

        // Update jump state
        this.updateJumpState();

        // Update animations
        this.updateAnimations();

        // Screen boundaries
        if (this.x < 0) this.x = 0;
        if (this.x + this.width > CANVAS.WIDTH) this.x = CANVAS.WIDTH - this.width;

        // Platform collision
        this.checkPlatformCollision(level);

        // Check if fell off screen
        return this.y <= CANVAS.HEIGHT;
    }

    /**
     * Check wall slide
     */
    checkWallSlide(level) {
        // Check left wall
        if (this.x > 0) {
            for (let i = 0; i < this.height; i += 10) {
                const checkY = this.y + i;
                if (level.platforms.some(p =>
                    p.x + p.width > this.x &&
                    p.x <= this.x &&
                    checkY >= p.y &&
                    checkY <= p.y + 10)) {
                    this.wallSliding = true;
                    this.wallDir = -1;
                    this.vy = Math.min(this.vy, PHYSICS.WALL_SLIDE_SPEED);
                    return;
                }
            }
        }

        // Check right wall
        if (this.x < CANVAS.WIDTH) {
            for (let i = 0; i < this.height; i += 10) {
                const checkY = this.y + i;
                if (level.platforms.some(p =>
                    p.x < this.x + this.width &&
                    p.x + p.width >= this.x &&
                    checkY >= p.y &&
                    checkY <= p.y + 10)) {
                    this.wallSliding = true;
                    this.wallDir = 1;
                    this.vy = Math.min(this.vy, PHYSICS.WALL_SLIDE_SPEED);
                    return;
                }
            }
        }
    }

    /**
     * Perform wall jump
     */
    performWallJump() {
        this.vy = PHYSICS.WALL_JUMP_POWER;
        this.vx = this.wallDir * PHYSICS.WALL_JUMP_HORIZONTAL;
        this.jumpCount = 1;
        this.wallSliding = false;
        this.grounded = false;
        
        audioManager.playSound('wallJump');
        particleSystem.createParticles(
            this.x + (this.wallDir > 0 ? this.width : 0), 
            this.y + this.height/2, 
            '#00ffff', 
            8
        );
    }

    /**
     * Perform jump
     */
    performJump() {
        let jumpPower = this.jumpPower;
        if (this.powerUp === POWER_UPS.JUMP) {
            jumpPower = -20;
        }

        if (this.grounded || this.coyoteTime > 0) {
            this.jumpState = 'jumping';
            this.jumpCount = 1;
        } else if (this.jumpCount === 1) {
            this.jumpState = 'doubleJump';
            this.jumpCount = 2;
            jumpPower *= 1.0;
        }

        this.vy = jumpPower;
        this.grounded = false;
        this.coyoteTime = 0;
        this.jumpBuffer = 0;
        this.jumpAnimationFrame = 0;
        
        audioManager.playSound('jump');
    }

    /**
     * Update jump state based on velocity
     */
    updateJumpState() {
        if (this.grounded) {
            this.jumpState = 'grounded';
            this.jumpCount = 0;
        } else if (this.vy < 0) {
            if (this.jumpCount === 0) {
                this.jumpState = 'jumping';
            } else {
                this.jumpState = 'doubleJump';
            }
        } else if (this.vy > 0) {
            this.jumpState = 'falling';
        }
    }

    /**
     * Update animation variables
     */
    updateAnimations() {
        if (Math.abs(this.vx) > 0.1) {
            this.legAnimation += 0.3;
            this.armAnimation += 0.3;
        } else {
            this.legAnimation *= 0.8;
            this.armAnimation *= 0.8;
        }

        this.bodyBounce = Math.sin(this.legAnimation) * 2;

        if (this.jumpState !== 'grounded') {
            this.jumpAnimationFrame++;
        }
    }

    /**
     * Check platform collision
     */
    checkPlatformCollision(level) {
        this.grounded = false;
        this.currentPlatform = null;

        // Update moving platforms
        level.platforms.forEach(platform => {
            if (platform.moving) {
                const prevX = platform.x;
                platform.x = platform.startX + Math.sin(Date.now() * 0.002) * platform.range;
                platform.dx = platform.x - prevX;
            } else {
                platform.dx = 0;
            }
        });

        // Collision detection helper
        const checkCollision = (px, py, platform) => {
            return px < platform.x + platform.width &&
                   px + this.width > platform.x &&
                   py < platform.y + platform.height &&
                   py + this.height > platform.y;
        };

        // Check for platform collisions with CCD for vertical movement
        level.platforms.forEach(platform => {
            if (this.vy > 10) {
                const steps = Math.ceil(this.vy / 10);
                const stepSize = this.vy / steps;

                for (let i = 0; i <= steps; i++) {
                    const checkY = this.y - this.vy + (stepSize * i);

                    if (checkCollision(this.x, checkY, platform)) {
                        if (this.vy > 0 && (this.y - this.vy) < platform.y) {
                            this.y = platform.y - this.height;
                            this.vy = 0;
                            this.grounded = true;
                            this.jumpState = 'grounded';
                            this.jumpCount = 0;
                            this.currentPlatform = platform;
                            break;
                        }
                    }
                }
            } else {
                if (checkCollision(this.x, this.y, platform)) {
                    if (this.vy > 0 && this.y < platform.y) {
                        this.y = platform.y - this.height;
                        this.vy = 0;
                        this.grounded = true;
                        this.jumpState = 'grounded';
                        this.jumpCount = 0;
                        this.currentPlatform = platform;
                    }
                }
            }
        });

        // Move with platform
        if (this.grounded && this.currentPlatform && this.currentPlatform.dx) {
            this.x += this.currentPlatform.dx;
        }

        // Disappearing platforms
        level.disappearingPlatforms.forEach(platform => {
            platform.timer++;
            if (platform.timer >= platform.cycleTime) {
                platform.visible = !platform.visible;
                platform.timer = 0;
            }
            platform.dx = 0;

            if (platform.visible && checkCollision(this.x, this.y, platform)) {
                if (this.vy > 0 && this.y < platform.y) {
                    this.y = platform.y - this.height;
                    this.vy = 0;
                    this.grounded = true;
                    this.jumpState = 'grounded';
                    this.jumpCount = 0;
                    this.currentPlatform = platform;
                }
            }
        });
    }

    /**
     * Draw the player
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} animationFrame - Current animation frame
     */
    draw(ctx, animationFrame) {
        // Invincibility effect
        if (this.invincible && !this.isDashing) {
            const alpha = 0.5 + Math.sin(animationFrame * 0.3) * 0.3;
            ctx.globalAlpha = alpha;
        }

        // Dash trail
        if (this.isDashing) {
            ctx.fillStyle = 'rgba(255, 255, 0, 0.5)';
            ctx.fillRect(this.x - 20, this.y, 40, this.height);
        }

        // Wall slide effect
        if (this.wallSliding) {
            ctx.fillStyle = 'rgba(0, 255, 255, 0.3)';
            ctx.fillRect(this.x - 5, this.y, this.width + 10, this.height);
        }

        // Hair animation
        const isRunning = Math.abs(this.vx) > 0.1;
        const isJumping = this.jumpState !== 'grounded';

        let hairFlowOffset = 0;
        let hairWaveAmplitude = 0;
        let hairWaveSpeed = 0;

        if (isRunning) {
            hairFlowOffset = -Math.abs(this.vx) * 2;
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

        this.drawHair(ctx, hairFlowOffset, hairWaveAmplitude, hairWaveSpeed);
        this.drawBody(ctx);
        this.drawLimbs(ctx);
        this.drawHead(ctx);

        ctx.globalAlpha = 1.0;
    }

    /**
     * Draw player hair
     */
    drawHair(ctx, hairFlowOffset, hairWaveAmplitude, hairWaveSpeed) {
        const hairColor = '#ffd700';
        const hairHighlight = '#ffed4e';
        const hairBaseX = this.x + 20;
        const hairBaseY = this.y - 15;

        // Upward hair
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

        // Crown/headband
        ctx.beginPath();
        ctx.ellipse(hairBaseX, hairBaseY - 10, 23, 7, 0, 0, Math.PI * 2);
        ctx.fillStyle = hairColor;
        ctx.fill();
        ctx.strokeStyle = '#e6b800';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Flowing hair behind
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
    }

    /**
     * Draw player body
     */
    drawBody(ctx) {
        const bodyGradient = ctx.createLinearGradient(this.x, this.y, this.x + this.width, this.y);
        bodyGradient.addColorStop(0, '#ff69b4');
        bodyGradient.addColorStop(1, '#ff1493');
        ctx.fillStyle = bodyGradient;
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Body highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(this.x, this.y, 10, this.height);
    }

    /**
     * Draw player limbs
     */
    drawLimbs(ctx) {
        const legAnimation = Math.abs(this.vx) > 0.1 ? Math.sin(this.legAnimation) * 3 : 0;
        const armSwing = Math.abs(this.vx) > 0.1 ? Math.sin(this.armAnimation) * 10 : 0;

        // Legs
        ctx.fillStyle = '#333';
        ctx.fillRect(this.x + 10, this.y + this.height - 5 + legAnimation, 8, 10);
        ctx.fillRect(this.x + 22, this.y + this.height - 5 - legAnimation, 8, 10);

        // Arms
        ctx.fillStyle = '#ff69b4';
        ctx.fillRect(this.x - 5 + armSwing, this.y + 10, 8, 20);
        ctx.fillRect(this.x + this.width - 3 - armSwing, this.y + 10, 8, 20);
    }

    /**
     * Draw player head
     */
    drawHead(ctx) {
        // Hat
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(this.x - 5, this.y - 10, 50, 10);
        ctx.fillRect(this.x + 15, this.y - 25, 15, 20);

        // Head
        ctx.fillStyle = '#ffd699';
        ctx.beginPath();
        ctx.arc(this.x + 20, this.y - 15, 15, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(this.x + 15, this.y - 17, 3, 0, Math.PI * 2);
        ctx.arc(this.x + 25, this.y - 17, 3, 0, Math.PI * 2);
        ctx.fill();

        // Smile
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x + 20, this.y - 12, 6, 0.1 * Math.PI, 0.9 * Math.PI);
        ctx.stroke();
    }
}

// Create default player instance
export const player = new Player();
