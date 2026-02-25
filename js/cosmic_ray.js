const CosmicRayShower = (() => {
    let canvas, ctx, animationId;
    let isPlaying = false;
    let particles = [];

    class Particle {
        constructor(x, y, angle, speed, color, generation, life) {
            this.x = x;
            this.y = y;
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed;
            this.color = color;
            this.generation = generation;
            this.life = life;
            this.maxLife = life;
            this.history = [{ x, y }];
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;
            this.life--;
            this.history.push({ x: this.x, y: this.y });
            if (this.history.length > 25) {
                this.history.shift();
            }
        }

        draw(ctx) {
            ctx.beginPath();
            ctx.strokeStyle = this.color;
            // Dashed line for 'neutral' looking particles
            if (this.color === '#888') {
                ctx.setLineDash([5, 5]);
            } else {
                ctx.setLineDash([]);
            }

            ctx.lineWidth = Math.max(0.7, 2.5 - this.generation * 0.4);
            ctx.globalAlpha = Math.max(0, this.life / this.maxLife);

            for (let i = 0; i < this.history.length; i++) {
                let pos = this.history[i];
                if (i === 0) ctx.moveTo(pos.x, pos.y);
                else ctx.lineTo(pos.x, pos.y);
            }
            ctx.stroke();
            ctx.globalAlpha = 1.0;
            ctx.setLineDash([]);
        }
    }

    function createPrimaryShower() {
        // High energy primary cosmic ray
        let x = Math.random() * canvas.width;
        let y = -20;
        let angle = Math.PI / 2 + (Math.random() - 0.5) * 0.3; // pointing downwards
        particles.push(new Particle(x, y, angle, 6 + Math.random() * 3, '#fff', 0, 80 + Math.random() * 50));
    }

    const COLORS = ['#ff4757', '#2ed573', '#1e90ff', '#eccc68', '#888', '#a29bfe'];

    function loop() {
        if (!isPlaying) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Spawn primary cosmic ray occasionally
        if (Math.random() < 0.04) {
            createPrimaryShower();
        }

        let newParticles = [];
        for (let i = particles.length - 1; i >= 0; i--) {
            let p = particles[i];
            p.update();
            p.draw(ctx);

            if (p.life > 0 && p.generation < 5) {
                // Primary interaction with atmosphere
                if (p.generation === 0 && p.life < p.maxLife - 20 - Math.random() * 30) {
                    // Hard collision -> wide shower
                    let numSecondaries = 5 + Math.floor(Math.random() * 6);
                    let baseAngle = Math.atan2(p.vy, p.vx);
                    for (let j = 0; j < numSecondaries; j++) {
                        let splitAngle = baseAngle + (Math.random() - 0.5) * 1.2;
                        let color = COLORS[Math.floor(Math.random() * COLORS.length)];
                        newParticles.push(new Particle(p.x, p.y, splitAngle, Math.sqrt(p.vx * p.vx + p.vy * p.vy) * (0.6 + Math.random() * 0.4), color, p.generation + 1, 100 + Math.random() * 80));
                    }
                    particles.splice(i, 1);
                    continue;
                }

                // Secondary decay
                if (p.generation > 0 && Math.random() < 0.015) {
                    let numDecays = 2;
                    let baseAngle = Math.atan2(p.vy, p.vx);
                    for (let j = 0; j < numDecays; j++) {
                        // Narrower split angle
                        let splitAngle = baseAngle + (Math.random() - 0.5) * 0.4;
                        let color = COLORS[Math.floor(Math.random() * COLORS.length)];
                        newParticles.push(new Particle(p.x, p.y, splitAngle, Math.sqrt(p.vx * p.vx + p.vy * p.vy) * 0.9, color, p.generation + 1, p.life));
                    }
                    particles.splice(i, 1);
                    continue;
                }
            }

            // Remove dead or off-screen particles
            if (p.life <= 0 || p.y > canvas.height + 50 || p.x < -50 || p.x > canvas.width + 50) {
                particles.splice(i, 1);
            }
        }

        particles.push(...newParticles);

        animationId = requestAnimationFrame(loop);
    }

    function resize() {
        if (!canvas) return;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    return {
        init: () => {
            canvas = document.getElementById('cosmic-ray-canvas');
            if (!canvas) return;
            ctx = canvas.getContext('2d');
            resize();
            window.addEventListener('resize', resize);

            if (!isPlaying) {
                isPlaying = true;
                particles = [];
                loop();
            }
        },
        stop: () => {
            isPlaying = false;
            if (animationId) cancelAnimationFrame(animationId);
            window.removeEventListener('resize', resize);
        }
    };
})();

window.initCosmicRay = CosmicRayShower.init;
window.stopCosmicRay = CosmicRayShower.stop;
