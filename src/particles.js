/**
 * particles.js - Enhanced Particle System and Effects
 * Sprint 4: Improved particle effects, glow effects, enhanced trails
 */

/**
 * Particle class - Individual particle with enhanced visual effects
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
            vy: 0,
            glow: false,
            glowColor: null,
            glowSize: 0,
            trail: false,
            trailLength: 0,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.2,
            shrink: true,
            shrinkRate: 0.98,
            colorVariation: 0,
            sparkle: false,
            wave: false,
            waveAmplitude: 0,
            waveFrequency: 0
        };

        const config = { ...defaultOptions, ...options };

        this.x = x;
        this.y = y;
        this.startX = x;
        this.startY = y;
        
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
        this.originalColor = color || '#ffffff';
        this.color = this.applyColorVariation(color, config.colorVariation);
        this.size = Math.random() * (config.size.max - config.size.min) + config.size.min;
        this.originalSize = this.size;
        this.gravity = config.gravity;
        this.fade = config.fade;
        this.shape = config.shape;
        this.rotation = config.rotation;
        this.rotationSpeed = config.rotationSpeed;
        
        // Enhanced effects
        this.glow = config.glow;
        this.glowColor = config.glowColor || this.color;
        this.glowSize = config.glowSize || this.size * 2;
        this.trail = config.trail;
        this.trailLength = config.trailLength;
        this.trailPositions = [];
        this.shrink = config.shrink;
        this.shrinkRate = config.shrinkRate;
        this.sparkle = config.sparkle;
        this.wave = config.wave;
        this.waveAmplitude = config.waveAmplitude;
        this.waveFrequency = config.waveFrequency;
        this.time = 0;
    }

    /**
     * Apply color variation for more natural look
     */
    applyColorVariation(color, variation) {
        if (!variation || variation <= 0) return color;
        
        // Parse hex color
        if (color.startsWith('#')) {
            const r = parseInt(color.slice(1, 3), 16);
            const g = parseInt(color.slice(3, 5), 16);
            const b = parseInt(color.slice(5, 7), 16);
            
            const vary = () => Math.floor((Math.random() - 0.5) * variation * 255);
            const clamp = (v) => Math.max(0, Math.min(255, v));
            
            const nr = clamp(r + vary());
            const ng = clamp(g + vary());
            const nb = clamp(b + vary());
            
            return `#${nr.toString(16).padStart(2, '0')}${ng.toString(16).padStart(2, '0')}${nb.toString(16).padStart(2, '0')}`;
        }
        return color;
    }

    /**
     * Update particle state
     */
    update() {
        // Store trail position
        if (this.trail && this.trailLength > 0) {
            this.trailPositions.unshift({ x: this.x, y: this.y, size: this.size });
            if (this.trailPositions.length > this.trailLength) {
                this.trailPositions.pop();
            }
        }
        
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity || 0.1;
        this.life -= this.fade || 0.02;
        this.time++;

        // Wave motion
        if (this.wave && this.waveAmplitude > 0) {
            this.x += Math.sin(this.time * this.waveFrequency) * this.waveAmplitude;
        }

        if (this.rotation !== undefined) {
            this.rotation += this.rotationSpeed || 0;
        }
        
        // Shrink effect
        if (this.shrink) {
            this.size *= this.shrinkRate;
        }

        return this.life > 0 && this.size > 0.5;
    }

    /**
     * Draw the particle with enhanced effects
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    draw(ctx) {
        const alpha = this.life / this.maxLife;
        
        // Draw trail
        if (this.trail && this.trailPositions.length > 0) {
            this.trailPositions.forEach((pos, i) => {
                const trailAlpha = alpha * (1 - i / this.trailPositions.length) * 0.5;
                ctx.globalAlpha = trailAlpha;
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, pos.size * (1 - i / this.trailPositions.length), 0, Math.PI * 2);
                ctx.fill();
            });
        }
        
        ctx.globalAlpha = alpha;
        
        // Draw glow effect
        if (this.glow) {
            const glowAlpha = alpha * 0.4;
            const gradient = ctx.createRadialGradient(
                this.x, this.y, 0,
                this.x, this.y, this.glowSize
            );
            gradient.addColorStop(0, this.glowColor);
            gradient.addColorStop(0.5, this.hexToRgba(this.glowColor, glowAlpha * 0.5));
            gradient.addColorStop(1, this.hexToRgba(this.glowColor, 0));
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.glowSize, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Sparkle effect
        if (this.sparkle && this.time % 4 < 2) {
            ctx.globalAlpha = alpha * 1.2;
        }
        
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
            case 'heart':
                this.drawHeart(ctx, 0, 0, this.size);
                break;
            case 'diamond':
                this.drawDiamond(ctx, 0, 0, this.size);
                break;
            case 'ring':
                ctx.beginPath();
                ctx.arc(0, 0, this.size, 0, Math.PI * 2);
                ctx.strokeStyle = this.color;
                ctx.lineWidth = 2;
                ctx.stroke();
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
     * Convert hex color to rgba
     */
    hexToRgba(hex, alpha) {
        if (!hex.startsWith('#')) return `rgba(255, 255, 255, ${alpha})`;
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    /**
     * Draw star shape
     */
    drawStar(ctx, cx, cy, outerRadius, innerRadius, points) {
        ctx.beginPath();
        for (let i = 0; i < points * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (i * Math.PI) / points - Math.PI / 2;
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
    
    /**
     * Draw heart shape
     */
    drawHeart(ctx, cx, cy, size) {
        ctx.beginPath();
        ctx.moveTo(cx, cy + size * 0.3);
        ctx.bezierCurveTo(cx, cy, cx - size, cy, cx - size, cy + size * 0.3);
        ctx.bezierCurveTo(cx - size, cy + size * 0.6, cx, cy + size, cx, cy + size);
        ctx.bezierCurveTo(cx, cy + size, cx + size, cy + size * 0.6, cx + size, cy + size * 0.3);
        ctx.bezierCurveTo(cx + size, cy, cx, cy, cx, cy + size * 0.3);
        ctx.fill();
    }
    
    /**
     * Draw diamond shape
     */
    drawDiamond(ctx, cx, cy, size) {
        ctx.beginPath();
        ctx.moveTo(cx, cy - size);
        ctx.lineTo(cx + size * 0.7, cy);
        ctx.lineTo(cx, cy + size);
        ctx.lineTo(cx - size * 0.7, cy);
        ctx.closePath();
        ctx.fill();
    }
}

/**
 * ParticleSystem class - Enhanced particle management
 */
export class ParticleSystem {
    constructor(maxParticles = 500) {
        this.particles = [];
        this.maxParticles = maxParticles;
        this.playerTrail = [];
    }

    /**
     * Create particles at a position with enhanced options
     */
    createParticles(x, y, color, count = 10, options = {}) {
        if (typeof x !== 'number' || typeof y !== 'number') {
            console.warn('Invalid particle position');
            return;
        }
        if (typeof count !== 'number' || count <= 0) {
            count = 10;
        }
        
        count = Math.max(0, Math.min(count, 150));

        if (this.particles.length > this.maxParticles) {
            this.particles.splice(0, Math.min(count, this.particles.length - this.maxParticles + count));
        }

        const defaultOptions = {
            spread: 8,
            gravity: 0.1,
            life: 1.0,
            size: { min: 2, max: 8 },
            fade: 0.02,
            shape: 'circle',
            glow: false,
            trail: false,
            colorVariation: 0.1
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
     * Create enhanced explosion effect
     */
    createExplosion(x, y, color, count = 30, options = {}) {
        if (typeof x !== 'number' || typeof y !== 'number') {
            console.warn('Invalid explosion position');
            return;
        }
        if (typeof count !== 'number' || count <= 0) {
            count = 30;
        }
        
        count = Math.max(0, Math.min(count, 150));

        if (this.particles.length > this.maxParticles) {
            this.particles.splice(0, Math.min(count, this.particles.length - this.maxParticles + count));
        }

        const config = {
            life: 1.0,
            size: { min: 4, max: 10 },
            gravity: 0.2,
            fade: 0.025,
            glow: true,
            glowSize: 15,
            ...options
        };

        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count;
            const speed = Math.random() * 12 + 5;
            
            // Vary shapes for more interesting explosions
            const shapes = ['circle', 'star', 'diamond'];
            const shape = shapes[Math.floor(Math.random() * shapes.length)];

            const particle = new Particle(x, y, color, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: config.life,
                maxLife: config.life,
                size: Math.random() * (config.size.max - config.size.min) + config.size.min,
                gravity: config.gravity,
                fade: config.fade,
                shape: shape,
                glow: config.glow,
                glowColor: color,
                glowSize: config.glowSize,
                rotationSpeed: (Math.random() - 0.5) * 0.3
            });

            this.particles.push(particle);
        }
    }

    /**
     * Create confetti effect with enhanced variety
     */
    createConfetti(x, y, count = 20) {
        const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ff69b4', '#ffd700', '#ff4500', '#9370db'];
        const shapes = ['square', 'star', 'diamond', 'heart'];

        for (let i = 0; i < count; i++) {
            const color = colors[Math.floor(Math.random() * colors.length)];
            const shape = shapes[Math.floor(Math.random() * shapes.length)];
            
            this.createParticles(x, y, color, 1, {
                spread: 18,
                gravity: 0.08,
                life: 3.5,
                size: { min: 6, max: 14 },
                fade: 0.004,
                shape: shape,
                glow: true,
                glowSize: 8,
                rotationSpeed: (Math.random() - 0.5) * 0.4,
                wave: true,
                waveAmplitude: 2,
                waveFrequency: 0.1
            });
        }
    }
    
    /**
     * Create sparkle effect for collectibles
     */
    createSparkles(x, y, color, count = 8) {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count;
            const speed = Math.random() * 3 + 1;
            
            this.particles.push(new Particle(x, y, color, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 2,
                life: 0.8,
                maxLife: 0.8,
                size: Math.random() * 4 + 2,
                gravity: 0.05,
                fade: 0.03,
                shape: 'star',
                glow: true,
                glowColor: '#ffffff',
                glowSize: 10,
                sparkle: true,
                shrink: true,
                shrinkRate: 0.96
            }));
        }
    }
    
    /**
     * Create ring burst effect
     */
    createRingBurst(x, y, color, count = 20) {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count;
            const speed = 8;
            
            this.particles.push(new Particle(x, y, color, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 0.6,
                maxLife: 0.6,
                size: 6,
                gravity: 0,
                fade: 0.025,
                shape: 'ring',
                glow: true,
                glowColor: color,
                glowSize: 12,
                shrink: true,
                shrinkRate: 0.95
            }));
        }
    }
    
    /**
     * Create power-up collection effect
     */
    createPowerUpEffect(x, y, color) {
        // Inner burst
        this.createExplosion(x, y, color, 15, {
            spread: 6,
            gravity: 0.15,
            life: 0.8,
            size: { min: 4, max: 8 },
            fade: 0.02,
            glow: true,
            glowSize: 12
        });
        
        // Outer ring
        this.createRingBurst(x, y, '#ffffff', 12);
        
        // Sparkles
        this.createSparkles(x, y, '#ffd700', 6);
    }
    
    /**
     * Create secret collectible effect
     */
    createSecretEffect(x, y) {
        // Purple burst
        this.createExplosion(x, y, '#9370db', 25, {
            spread: 10,
            gravity: 0.1,
            life: 1.2,
            size: { min: 5, max: 12 },
            fade: 0.015,
            glow: true,
            glowSize: 18
        });
        
        // Gold sparkles
        this.createSparkles(x, y, '#ffd700', 12);
        
        // Confetti
        this.createConfetti(x, y, 10);
    }
    
    /**
     * Create invincibility aura particles
     */
    createInvincibilityAura(x, y, width, height) {
        const centerX = x + width / 2;
        const centerY = y + height / 2;
        
        for (let i = 0; i < 3; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.max(width, height) / 2 + 10;
            const px = centerX + Math.cos(angle) * radius;
            const py = centerY + Math.sin(angle) * radius * 0.7;
            
            this.particles.push(new Particle(px, py, '#ffd700', {
                vx: Math.cos(angle) * 0.5,
                vy: Math.sin(angle) * 0.5 - 1,
                life: 0.5,
                maxLife: 0.5,
                size: Math.random() * 4 + 2,
                gravity: -0.05,
                fade: 0.02,
                shape: 'star',
                glow: true,
                glowColor: '#ffff00',
                glowSize: 8,
                sparkle: true
            }));
        }
    }
    
    /**
     * Create dash trail effect
     */
    createDashTrail(x, y, width, height, direction) {
        const trailX = direction > 0 ? x : x + width;
        
        for (let i = 0; i < 5; i++) {
            const offsetY = Math.random() * height;
            
            this.particles.push(new Particle(trailX, y + offsetY, '#ffff00', {
                vx: -direction * (Math.random() * 3 + 2),
                vy: (Math.random() - 0.5) * 2,
                life: 0.4,
                maxLife: 0.4,
                size: Math.random() * 8 + 4,
                gravity: 0,
                fade: 0.025,
                shape: 'diamond',
                glow: true,
                glowColor: '#ff8800',
                glowSize: 10,
                shrink: true,
                shrinkRate: 0.92
            }));
        }
    }

    /**
     * Add player trail effect
     */
    addPlayerTrail(x, y, options = {}) {
        this.playerTrail.push({
            x: x,
            y: y,
            alpha: options.alpha || 0.5,
            isDoubleJump: options.isDoubleJump || false,
            isDash: options.isDash || false,
            width: options.width || 40,
            height: options.height || 60,
            color: options.color || '#ff69b4'
        });
    }

    /**
     * Update all particles
     */
    update() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            if (!this.particles[i].update()) {
                this.particles.splice(i, 1);
            }
        }

        for (let i = this.playerTrail.length - 1; i >= 0; i--) {
            this.playerTrail[i].alpha -= 0.06;
            if (this.playerTrail[i].alpha <= 0) {
                this.playerTrail.splice(i, 1);
            }
        }
    }

    /**
     * Draw all particles with enhanced effects
     */
    draw(ctx, playerHeight = 60) {
        // Draw player trail first (behind everything)
        this.playerTrail.forEach(trail => {
            if (trail.isDoubleJump) {
                ctx.globalAlpha = trail.alpha * 0.4;
                ctx.fillStyle = '#00ffff';
                ctx.shadowColor = '#00ffff';
                ctx.shadowBlur = 10;
                ctx.beginPath();
                ctx.arc(trail.x + trail.width / 2, trail.y + trail.height / 2, 5, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
            }
            if (trail.isDash) {
                ctx.globalAlpha = trail.alpha * 0.6;
                const gradient = ctx.createLinearGradient(
                    trail.x, trail.y,
                    trail.x + trail.width, trail.y
                );
                gradient.addColorStop(0, 'rgba(255, 255, 0, 0)');
                gradient.addColorStop(0.5, 'rgba(255, 200, 0, 0.5)');
                gradient.addColorStop(1, trail.color);
                ctx.fillStyle = gradient;
                ctx.fillRect(trail.x - 20, trail.y, trail.width + 20, trail.height);
            }
        });
        ctx.globalAlpha = 1.0;
        
        // Draw particles
        this.particles.forEach(p => p.draw(ctx));
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
