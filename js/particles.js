document.addEventListener('DOMContentLoaded', () => {
    // Create canvas dynamically
    const canvas = document.createElement('canvas');
    canvas.id = 'particle-canvas';
    canvas.classList.add('particle-canvas');

    // Insert behind hero content
    const heroSection = document.querySelector('#main');
    if (heroSection) {
        heroSection.insertBefore(canvas, heroSection.firstChild);
        // Ensure hero content sits above canvas
        const heroContent = heroSection.querySelector('.hero');
        if (heroContent) {
            heroContent.style.position = 'relative';
            heroContent.style.zIndex = '1';
        }
    } else {
        return;
    }

    const ctx = canvas.getContext('2d');
    let width = canvas.width = heroSection.clientWidth;
    let height = canvas.height = heroSection.clientHeight;

    // Handle Resize
    window.addEventListener('resize', () => {
        width = canvas.width = heroSection.clientWidth;
        height = canvas.height = heroSection.clientHeight;
    });

    const getThemeColors = () => {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        return {
            particle: isDark ? 'rgba(255, 255, 255, ' : 'rgba(33, 37, 41, ',
            spark: isDark ? 'rgba(255, 100, 100, ' : 'rgba(220, 50, 50, ',
            line: isDark ? '255, 255, 255' : '33, 37, 41'
        };
    };

    class Particle {
        constructor(x, y, radius, vx, vy) {
            this.x = x;
            this.y = y;
            this.radius = radius;
            this.vx = vx;
            this.vy = vy;
            this.mass = radius * radius; // Mass proportional to area
            this.colorAlpha = Math.random() * 0.4 + 0.1;
        }

        draw(ctx, colors) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = `${colors.particle}${this.colorAlpha})`;
            ctx.fill();
        }

        update(canvasWidth, canvasHeight) {
            this.x += this.vx;
            this.y += this.vy;

            // Bounce off walls smoothly
            if (this.x - this.radius < 0) {
                this.x = this.radius;
                this.vx = -this.vx;
            } else if (this.x + this.radius > canvasWidth) {
                this.x = canvasWidth - this.radius;
                this.vx = -this.vx;
            }

            if (this.y - this.radius < 0) {
                this.y = this.radius;
                this.vy = -this.vy;
            } else if (this.y + this.radius > canvasHeight) {
                this.y = canvasHeight - this.radius;
                this.vy = -this.vy;
            }
        }
    }

    class Spark {
        constructor(x, y, vx, vy) {
            this.x = x;
            this.y = y;
            this.vx = vx;
            this.vy = vy;
            this.life = 1.0;
            this.decay = Math.random() * 0.04 + 0.02;
            this.radius = Math.random() * 2 + 0.5;
        }

        draw(ctx, colors) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = `${colors.spark}${this.life})`;
            ctx.fill();
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;
            this.life -= this.decay;
        }
    }

    const particles = [];
    let sparks = [];
    const numParticles = 60; // Optimal for collision frequency without lag

    // Initialize particles
    for (let i = 0; i < numParticles; i++) {
        const radius = Math.random() * 3 + 1.5;
        const x = Math.random() * (width - radius * 2) + radius;
        const y = Math.random() * (height - radius * 2) + radius;
        // Faster velocities for collision experiment feel
        const vx = (Math.random() - 0.5) * 3;
        const vy = (Math.random() - 0.5) * 3;
        particles.push(new Particle(x, y, radius, vx, vy));
    }

    const resolveCollision = (p1, p2) => {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < p1.radius + p2.radius) {
            // Emulate high-energy particle spark emission on collision
            const numSparks = Math.floor(Math.random() * 4) + 2;
            for (let k = 0; k < numSparks; k++) {
                const svx = (Math.random() - 0.5) * 6 + p1.vx * 0.5;
                const svy = (Math.random() - 0.5) * 6 + p1.vy * 0.5;
                sparks.push(new Spark(p1.x + dx / 2, p1.y + dy / 2, svx, svy));
            }

            const nx = dx / dist;
            const ny = dy / dist;

            const rvx = p2.vx - p1.vx;
            const rvy = p2.vy - p1.vy;

            const velAlongNormal = rvx * nx + rvy * ny;

            if (velAlongNormal > 0) return;

            // Restitution (elasticity)
            const e = 1;

            let j = -(1 + e) * velAlongNormal;
            j /= 1 / p1.mass + 1 / p2.mass;

            const impulseX = j * nx;
            const impulseY = j * ny;

            p1.vx -= (1 / p1.mass) * impulseX;
            p1.vy -= (1 / p1.mass) * impulseY;
            p2.vx += (1 / p2.mass) * impulseX;
            p2.vy += (1 / p2.mass) * impulseY;

            // Positional correction to prevent interlocking
            const percent = 0.2;
            const slop = 0.01;
            const penetration = p1.radius + p2.radius - dist;
            const correction = Math.max(penetration - slop, 0.0) / (1 / p1.mass + 1 / p2.mass) * percent;
            const cx = nx * correction;
            const cy = ny * correction;

            p1.x -= (1 / p1.mass) * cx;
            p1.y -= (1 / p1.mass) * cy;
            p2.x += (1 / p2.mass) * cx;
            p2.y += (1 / p2.mass) * cy;
        }
    };

    const animate = () => {
        requestAnimationFrame(animate);
        ctx.clearRect(0, 0, width, height);

        const colors = getThemeColors();

        // Update, draw, and detect collisions for particles
        for (let i = 0; i < particles.length; i++) {
            particles[i].update(width, height);
            particles[i].draw(ctx, colors);

            for (let j = i + 1; j < particles.length; j++) {
                resolveCollision(particles[i], particles[j]);

                // Draw physics-like tension tracks between close particles
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 120) {
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(${colors.line}, ${0.15 * (1 - dist / 120)})`;
                    ctx.lineWidth = 1;
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                }
            }
        }

        // Update and draw decaying sparks
        for (let i = sparks.length - 1; i >= 0; i--) {
            sparks[i].update();
            sparks[i].draw(ctx, colors);
            if (sparks[i].life <= 0) {
                sparks.splice(i, 1);
            }
        }
    };

    animate();
});
