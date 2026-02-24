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

        this.mouseX = -1000;
        this.mouseY = -1000;

        // Mouse interaction for Magnetic Field
        const trackMouse = (e) => {
            if (!this.isActive) return;
            this.mouseX = e.clientX || (e.touches && e.touches[0].clientX) || -1000;
            this.mouseY = e.clientY || (e.touches && e.touches[0].clientY) || -1000;
        };

        window.addEventListener('mousemove', trackMouse);
        window.addEventListener('touchmove', trackMouse, { passive: true });

        // Reset when mouse leaves
        const resetMouse = () => {
            this.mouseX = -1000;
            this.mouseY = -1000;
        };
        window.addEventListener('mouseleave', resetMouse);
        window.addEventListener('touchend', resetMouse);

        window.addEventListener('resize', () => {
            if (this.isActive) this.resize();
        });

        this.start();
    }

    resize() {
        if (!this.canvas) return;
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    spawnParticle() {
        if (!this.canvas) return;

        const isCosmic = Math.random() > 0.7; // 30% are long fast cosmic rays
        const x = Math.random() * this.canvas.width;
        const y = Math.random() * this.canvas.height;

        const angle = Math.random() * Math.PI * 2;
        // Slowed down initial speeds
        const speed = isCosmic ? 3 + Math.random() * 2 : 1 + Math.random() * 1.5;

        const charge = Math.random() > 0.5 ? 1 : -1;

        this.particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            charge: charge,
            life: 1.0,
            // Slower decay for longer visibility
            decayRate: isCosmic ? 0.0015 : 0.003 + Math.random() * 0.003,
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

            // Localized magnetic field (B-field coming out of the screen, active near mouse anywhere)
            if (this.mouseX > -1000 && this.mouseY > -1000) {
                const dx = this.mouseX - p.x;
                const dy = this.mouseY - p.y;
                const dist2 = dx * dx + dy * dy;
                // Reduced interaction radius for more localized effect (~250px)
                const maxDist2 = 250 * 250;

                if (dist2 < maxDist2) {
                    // Local magnetic field magnitude (stronger closer to mouse)
                    const bStrength = (1 - (dist2 / maxDist2)) * 0.3;
                    const curveForce = p.charge * bStrength;

                    // Lorentz force changes direction
                    const newVx = p.vx * Math.cos(curveForce) - p.vy * Math.sin(curveForce);
                    const newVy = p.vx * Math.sin(curveForce) + p.vy * Math.cos(curveForce);
                    p.vx = newVx;
                    p.vy = newVy;

                    // Energy loss: gentler decay so the spiral makes multiple loops
                    p.vx *= 0.985;
                    p.vy *= 0.985;
                }
            }

            p.x += p.vx;
            p.y += p.vy;
            p.life -= p.decayRate;

            p.history.push({ x: p.x, y: p.y });

            // Long history list to show the nice curved trails
            if (p.history.length > 80) {
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
                const rgb = isDark ? '180, 200, 255' : '80, 100, 140'; // Deeper blue/grey for light mode for better visibility
                this.ctx.strokeStyle = `rgba(${rgb}, ${alpha * (isDark ? 0.4 : 0.8)})`;
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
