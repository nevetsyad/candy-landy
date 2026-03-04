/**
 * particles.js - Particle System and Effects
 * Manages particle creation, updates, and rendering
 */

/**
 * Particle class - Individual particle
 */
export class Particle {
    constructor(x, y, color, options = {}) {
        const defaultOptions = {
            spread: 8,
            gravity: 0.1,
            life: 1.0,
            size: { min: 2, max: 8 },
            fade: 0.02,
            shape: 'circle',
            vx: 0,
            vy: 0
        };

        const config = { ...defaultOptions, ...options };

        this.x = x;
        this.y = y;
        
        // Calculate velocity from spread if not provided
        if (config.vx !== 0 || config.vy !== 0) {
            this.vx = config.vx;
            this.vy = config.vy;
        } else {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * config.spread + 2;
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed;
        }

        this.life = config.life;
        this.maxLife = config.life;
        this.color = color || '#ffffff';
        this.size = Math.random() * (config.size.max - config.size.min) + config.size.min;
        this.gravity = config.gravity;
        this.fade = config.fade;
        this.shape = config.shape;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.2;
    }

    /**
     * Update particle state
     */
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity || 0.1;
        this.life -= this.fade || 0.02;

        if (this.rotation !== undefined) {
            this.rotation += this.rotationSpeed || 0;
        }

        return this.life > 0;
    }

    /**
     * Draw the particle
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    draw(ctx) {
        ctx.globalAlpha = this.life / this.maxLife;
        ctx.fillStyle = this.color;

        ctx.save();
        ctx.translate(this.x, this.y);

        if (this.rotation !== undefined) {
            ctx.rotate(this.rotation);
        }

        switch (this.shape) {
            case 'circle':
                ctx.beginPath();
                ctx.arc(0, 0, this.size, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 'square':
                ctx.fillRect(-this.size/2, -this.size/2, this.size, this.size);
                break;
            case 'star':
                this.drawStar(ctx, 0, 0, this.size, this.size/2, 5);
                break;
            default:
                ctx.beginPath();
                ctx.arc(0, 0, this.size, 0, Math.PI * 2);
                ctx.fill();
        }

        ctx.restore();
        ctx.globalAlpha = 1.0;
    }

    /**
     * Draw star shape
     */
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
}

/**
 * ParticleSystem class - Manages all particles
 */
export class ParticleSystem {
    constructor(maxParticles = 300) {
        this.particles = [];
        this.maxParticles = maxParticles;
        this.playerTrail = [];
    }

    /**
     * Create particles at a position
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {string} color - Particle color
     * @param {number} count - Number of particles
     * @param {Object} options - Particle options
     */
    createParticles(x, y, color, count = 10, options = {}) {
        // Validate inputs
        if (typeof x !== 'number' || typeof y !== 'number') {
            console.warn('Invalid particle position');
            return;
        }
        if (typeof count !== 'number' || count <= 0) {
            count = 10;
        }
        
        // Limit particle count for performance
        count = Math.max(0, Math.min(count, 100));

        // Limit total particles
        if (this.particles.length > this.maxParticles) {
            this.particles.splice(0, Math.min(count, this.particles.length - this.maxParticles));
        }

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
            const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
            const speed = Math.random() * config.spread + 2;

            const particle = new Particle(x, y, color, {
                ...config,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed
            });

            this.particles.push(particle);
        }
    }

    /**
     * Create explosion effect
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {string} color - Particle color
     * @param {number} count - Number of particles
     */
    createExplosion(x, y, color, count = 30) {
        // Validate inputs
        if (typeof x !== 'number' || typeof y !== 'number') {
            console.warn('Invalid explosion position');
            return;
        }
        if (typeof count !== 'number' || count <= 0) {
            count = 30;
        }
        
        // Limit particle count
        count = Math.max(0, Math.min(count, 100));

        // Limit total particles
        if (this.particles.length > this.maxParticles) {
            this.particles.splice(0, Math.min(count, this.particles.length - this.maxParticles));
        }

        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count;
            const speed = Math.random() * 10 + 5;

            const particle = new Particle(x, y, color, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1.0,
                maxLife: 1.0,
                size: Math.random() * 8 + 4,
                gravity: 0.2,
                fade: 0.025,
                shape: 'circle'
            });

            this.particles.push(particle);
        }
    }

    /**
     * Create confetti effect
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} count - Number of confetti pieces
     */
    createConfetti(x, y, count = 20) {
        const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ff69b4', '#ffd700', '#ff4500', '#9370db'];

        for (let i = 0; i < count; i++) {
            const color = colors[Math.floor(Math.random() * colors.length)];
            this.createParticles(x, y, color, 1, {
                spread: 15,
                gravity: 0.05,
                life: 3.0,
                size: { min: 8, max: 12 },
                fade: 0.005,
                shape: 'square'
            });
        }
    }

    /**
     * Add player trail effect
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {Object} options - Trail options
     */
    addPlayerTrail(x, y, options = {}) {
        this.playerTrail.push({
            x: x,
            y: y,
            alpha: options.alpha || 0.5,
            isDoubleJump: options.isDoubleJump || false,
            isDash: options.isDash || false
        });
    }

    /**
     * Update all particles
     */
    update() {
        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            if (!this.particles[i].update()) {
                this.particles.splice(i, 1);
            }
        }

        // Update player trail
        for (let i = this.playerTrail.length - 1; i >= 0; i--) {
            this.playerTrail[i].alpha -= 0.05;
            if (this.playerTrail[i].alpha <= 0) {
                this.playerTrail.splice(i, 1);
            }
        }
    }

    /**
     * Draw all particles
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} playerHeight - Player height for trail drawing
     */
    draw(ctx, playerHeight = 60) {
        // Draw particles
        this.particles.forEach(p => p.draw(ctx));

        // Draw player trail
        this.playerTrail.forEach(trail => {
            if (trail.isDoubleJump) {
                ctx.globalAlpha = trail.alpha * 0.3;
                ctx.fillStyle = '#00ffff';
                ctx.beginPath();
                ctx.arc(trail.x, trail.y, 3, 0, Math.PI * 2);
                ctx.fill();
            }
            if (trail.isDash) {
                ctx.globalAlpha = trail.alpha * 0.5;
                ctx.fillStyle = '#ffff00';
                ctx.fillRect(trail.x - 20, trail.y, 40, playerHeight);
            }
        });
        ctx.globalAlpha = 1.0;
    }

    /**
     * Clear all particles
     */
    clear() {
        this.particles = [];
        this.playerTrail = [];
    }
}

// Create singleton instance
export const particleSystem = new ParticleSystem();

// Export convenience functions for backward compatibility
export function createParticles(x, y, color, count = 10, options = {}) {
    particleSystem.createParticles(x, y, color, count, options);
}

export function createExplosion(x, y, color, count = 30) {
    particleSystem.createExplosion(x, y, color, count);
}

export function createConfetti(x, y, count = 20) {
    particleSystem.createConfetti(x, y, count);
}

export function updateParticles() {
    particleSystem.update();
}

export function drawParticles(ctx) {
    particleSystem.draw(ctx);
}
