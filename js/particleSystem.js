/**
 * Particle System Module
 * Optimized particle system with object pooling for performance
 */

class Particle {
    constructor(x, y, vx, vy, life, color, size) {
        this.x = x;
        this.y = y;
        this.vx = vx || (Math.random() - 0.5) * 6;
        this.vy = vy || (Math.random() - 0.5) * 6;
        this.life = life || 30;
        this.maxLife = this.life;
        this.color = color || '#FFD700';
        this.size = size || 4;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.1; // gravity
        this.life--;
    }

    draw(ctx) {
        ctx.globalAlpha = Math.max(0, this.life / this.maxLife);
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - this.size/2, this.y - this.size/2, this.size, this.size);
        ctx.globalAlpha = 1;
    }

    isDead() {
        return this.life <= 0;
    }
}

class ParticleSystem {
    constructor(maxParticles = 500) {
        this.maxParticles = maxParticles;
        this.pool = []; // Object pool for particles
        this.activeParticles = []; // Currently active particles
        this.reset();
    }

    reset() {
        // Pre-allocate particle pool (object pooling)
        for (let i = 0; i < this.maxParticles; i++) {
            this.pool.push(new Particle(0, 0, 0, 0, 0, '#FFD700', 4));
        }
        this.activeParticles = [];
    }

    /**
     * Create particles with optimized spawning
     * @param {number} x - X position
     * @param {number} y - Y position  
     * @param {Array} options - Particle configuration
     */
    create(x, y, options = {}) {
        const count = options.count || 15; // Default to 15 particles (optimized from 30)
        const color = options.color || '#FFD700';
        const size = options.size || 4;

        // Reuse particles from pool when available
        const particlesToCreate = Math.min(count, this.maxParticles - this.activeParticles.length);

        for (let i = 0; i < particlesToCreate; i++) {
            if (this.pool.length > 0) {
                // Reuse pooled particle
                const p = this.pool.pop();
                p.x = x;
                p.y = y;
                p.vx = options.vx || (Math.random() - 0.5) * 6;
                p.vy = options.vy || (Math.random() - 0.5) * 6;
                p.life = options.life || 30;
                p.maxLife = p.life;
                p.color = color;
                p.size = size;
            } else {
                // Create new particle (only when pool is exhausted)
                this.activeParticles.push(new Particle(x, y, options.vx || (Math.random() - 0.5) * 6, 
                    options.vy || (Math.random() - 0.5) * 6, options.life || 30, color, size));
            }
        }

        // If we still need more particles than pool can provide, create new ones
        const remaining = count - particlesToCreate;
        for (let i = 0; i < remaining && this.activeParticles.length < this.maxParticles; i++) {
            this.activeParticles.push(new Particle(x, y, options.vx || (Math.random() - 0.5) * 6, 
                options.vy || (Math.random() - 0.5) * 6, options.life || 30, color, size));
        }

        return this;
    }

    /**
     * Create explosion particles for enemy defeat
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {string} color - Explosion color
     */
    createExplosion(x, y, color = '#FF4500', size = 6) {
        // Reduced from 30 to 18 particles for better performance
        return this.create(x, y, { count: 18, color, size });
    }

    /**
     * Create candy collection particles
     * @param {number} x - X position
     * @param {number} y - Y position  
     * @param {string} color - Candy color
     */
    createCandy(x, y, color) {
        return this.create(x, y, { count: 12, color }); // Optimized from 10 to 12 for better visual feedback
    }

    /**
     * Create power-up particles with more variety
     * @param {number} x - X position
     * @param {number} y - Y position  
     * @param {string} color - Power-up color
     */
    createPowerUp(x, y, color) {
        return this.create(x, y, { count: 20, color }); // More particles for power-up effects
    }

    /**
     * Update all active particles
     */
    update() {
        for (let i = this.activeParticles.length - 1; i >= 0; i--) {
            const p = this.activeParticles[i];
            p.update();

            if (p.isDead()) {
                // Return to pool instead of creating garbage
                this.pool.push(p);
                this.activeParticles.splice(i, 1);
            }
        }

        // Replenish pool if needed (when particles are reused)
        while (this.pool.length < this.maxParticles / 2 && this.activeParticles.length > this.maxParticles / 4) {
            const p = new Particle(0, 0, 0, 0, 0, '#FFD700', 4);
            this.pool.push(p);
        }
    }

    /**
     * Draw all active particles with batching optimization
     */
    draw(ctx) {
        // Batch similar particles by color for better rendering performance
        const colorGroups = {};

        this.activeParticles.forEach(p => {
            if (!colorGroups[p.color]) {
                colorGroups[p.color] = [];
            }
            colorGroups[p.color].push(p);
        });

        // Draw each color group separately (batched rendering)
        Object.keys(colorGroups).forEach(color => {
            const group = colorGroups[color];
            
            ctx.globalAlpha = 1; // Reset alpha for each batch
            
            group.forEach(p => {
                ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
                ctx.fillStyle = color;
                ctx.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
            });
        });
    }

    /**
     * Clear all particles (for level reset)
     */
    clear() {
        // Return all active particles to pool
        this.activeParticles.forEach(p => this.pool.push(p));
        this.activeParticles = [];
    }

    /**
     * Get current particle count for debugging
     */
    getCount() {
        return this.activeParticles.length;
    }

    /**
     * Reset the entire system (for level reset)
     */
    resetSystem() {
        this.clear();
        // Re-populate pool with fresh particles
        for (let i = 0; i < this.maxParticles; i++) {
            if (this.pool[i]) {
                this.pool[i].x = 0;
                this.pool[i].y = 0;
                this.pool[i].vx = 0;
                this.pool[i].vy = 0;
                this.pool[i].life = 0;
            }
        }
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Particle, ParticleSystem };
}
