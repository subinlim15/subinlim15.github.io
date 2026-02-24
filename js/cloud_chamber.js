class CloudChamber {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.particles = [];
        this.targetB = 0;
        this.currentB = 0;
        this.animationFrame = null;
        this.isActive = false;

        this.init();
    }

    init() {
        this.canvas = document.getElementById('cloud-chamber-canvas');
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        this.resize();

        // Mouse interaction for Magnetic Field based on background hovering
        const setMagneticField = (e) => {
            if (!this.isActive) return;
            const target = e.target;
            // If the mouse is over a card, navbar, or control, remove B-field
            const overCard = target.closest('.glass-card, .navbar, .gate-btn, .footer-content');
            if (!overCard) {
                // Determine direction based on x position relative to center for consistent curving
                const rect = this.canvas.getBoundingClientRect();
                const x = e.clientX || (e.touches && e.touches[0].clientX) || 0;
                this.targetB = (x > rect.left + rect.width / 2) ? 0.05 : -0.05;
            } else {
                this.targetB = 0;
            }
        };

        window.addEventListener('mousemove', setMagneticField);
        window.addEventListener('touchmove', setMagneticField, { passive: true });

        // Reset when mouse leaves
        window.addEventListener('mouseleave', () => this.targetB = 0);
        window.addEventListener('touchend', () => this.targetB = 0);

        window.addEventListener('resize', () => {
            if (this.isActive) this.resize();
        });

        this.start();
    }

    resize() {
        if (!this.canvas) return;
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
    }

    spawnParticle() {
        if (!this.canvas) return;

        const isCosmic = Math.random() > 0.7; // 30% are long fast cosmic rays
        const x = Math.random() * this.canvas.width;
        const y = Math.random() * this.canvas.height;

        const angle = Math.random() * Math.PI * 2;
        const speed = isCosmic ? 8 + Math.random() * 5 : 2 + Math.random() * 3;

        const charge = Math.random() > 0.5 ? 1 : -1;

        this.particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            charge: charge,
            life: 1.0,
            decayRate: isCosmic ? 0.005 : 0.015 + Math.random() * 0.02,
            history: [{ x, y }]
        });
    }

    updateAndDraw() {
        if (!this.ctx) return;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Smooth transition for Magnetic Field
        this.currentB += (this.targetB - this.currentB) * 0.05;

        // Spawn new particles (rarely to keep it subtle)
        if (Math.random() < 0.15 && this.particles.length < 50) {
            this.spawnParticle();
        }

        for (let i = this.particles.length - 1; i >= 0; i--) {
            let p = this.particles[i];

            // Apply magnetic field (Lorentz Force curve)
            if (Math.abs(this.currentB) > 0.001) {
                const curveForce = p.charge * this.currentB;
                const newVx = p.vx * Math.cos(curveForce) - p.vy * Math.sin(curveForce);
                const newVy = p.vx * Math.sin(curveForce) + p.vy * Math.cos(curveForce);
                p.vx = newVx;
                p.vy = newVy;
            }

            p.x += p.vx;
            p.y += p.vy;
            p.life -= p.decayRate;

            p.history.push({ x: p.x, y: p.y });

            // Limit history length to fade tail
            if (p.history.length > 30) {
                p.history.shift();
            }

            // Draw track
            if (p.history.length > 1) {
                this.ctx.beginPath();
                this.ctx.moveTo(p.history[0].x, p.history[0].y);
                for (let j = 1; j < p.history.length; j++) {
                    this.ctx.lineTo(p.history[j].x, p.history[j].y);
                }

                // Color mapping: subtle traces adapting to theme
                const alpha = Math.max(0, p.life);
                const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
                const rgb = isDark ? '180, 200, 255' : '120, 130, 150'; // Bright for dark mode, subtle grey/blue for light mode
                this.ctx.strokeStyle = `rgba(${rgb}, ${alpha * (isDark ? 0.4 : 0.6)})`;
                this.ctx.lineWidth = 1.5;
                this.ctx.lineCap = 'round';
                this.ctx.lineJoin = 'round';
                this.ctx.stroke();
            }

            // Remove dead particles
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }

        if (this.isActive) {
            this.animationFrame = requestAnimationFrame(() => this.updateAndDraw());
        }
    }

    start() {
        this.isActive = true;
        this.updateAndDraw();
    }

    stop() {
        this.isActive = false;
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
    }
}

// Global hook
window.initCloudChamber = () => {
    if (window.cloudChamberInstance) {
        window.cloudChamberInstance.stop();
        window.cloudChamberInstance.init(); // re-init canvas if DOM re-rendered
    } else {
        window.cloudChamberInstance = new CloudChamber();
    }
};

window.stopCloudChamber = () => {
    if (window.cloudChamberInstance) {
        window.cloudChamberInstance.stop();
    }
};
