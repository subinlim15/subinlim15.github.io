document.addEventListener('DOMContentLoaded', () => {
    // Create canvas dynamically
    const canvas = document.createElement('canvas');
    canvas.id = 'particle-canvas';
    canvas.classList.add('particle-canvas');

    // Insert behind hero content
    const heroSection = document.querySelector('#main');
    if (heroSection) {
        heroSection.insertBefore(canvas, heroSection.firstChild);
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
            detector: isDark ? '255, 255, 255' : '0, 0, 0',
            beam: isDark ? '255, 255, 255' : '33, 37, 41',
            track: isDark ? '200, 200, 200' : '80, 80, 80'
        };
    };

    function drawDetector(ctx, cx, cy, radius, colors) {
        ctx.lineWidth = 1;
        ctx.strokeStyle = `rgba(${colors.detector}, 0.1)`;

        // Draw concentric octagons simulating detector layers (Tracker, ECAL, HCAL, Muon)
        const layers = [radius * 0.15, radius * 0.35, radius * 0.65, radius];
        for (let r of layers) {
            ctx.beginPath();
            for (let i = 0; i <= 8; i++) {
                let angle = i * Math.PI / 4 + Math.PI / 8;
                let x = cx + Math.cos(angle) * r;
                let y = cy + Math.sin(angle) * r;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();

            // Draw circle overlay
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Draw radial sector lines
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
            let angle = i * Math.PI / 4 + Math.PI / 8;
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + Math.cos(angle) * layers[3], cy + Math.sin(angle) * layers[3]);
        }
        ctx.stroke();
    }

    class Track {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.history = [{ x, y }];

            // Randomly distribute angles, with some preference for transverse planes
            this.angle = Math.random() * Math.PI * 2;

            // Particle momentum (speed) and charge (curvature in magnetic field)
            this.momentum = Math.random() * 8 + 2;
            this.charge = Math.random() > 0.5 ? 1 : -1;
            this.isNeutral = Math.random() > 0.7; // Neutrals don't curve

            // Lorentz force approximation in a uniform magnetic field: 
            // lower momentum = higher curvature radius
            let bend = 0.05 / (this.momentum * 0.5);
            this.curvature = this.isNeutral ? 0 : bend * this.charge;

            this.life = 1.0;
            // High momentum particles decay slower (reach outer layers)
            this.decay = (Math.random() * 0.02 + 0.005) / (this.momentum * 0.2);
            this.thickness = Math.random() > 0.8 ? 2.5 : 1; // Some high energy jets
        }

        update() {
            this.angle += this.curvature;
            this.x += Math.cos(this.angle) * this.momentum;
            this.y += Math.sin(this.angle) * this.momentum;
            this.history.push({ x: this.x, y: this.y });

            // Keep track tail limited
            if (this.history.length > 40) this.history.shift();
            this.life -= this.decay;
        }

        draw(ctx, colors) {
            if (this.history.length < 2) return;
            ctx.beginPath();
            for (let i = 0; i < this.history.length; i++) {
                let p = this.history[i];
                if (i === 0) ctx.moveTo(p.x, p.y);
                else ctx.lineTo(p.x, p.y);
            }
            // Fade out at end of life
            const alpha = Math.max(0, this.life);
            ctx.strokeStyle = `rgba(${colors.track}, ${alpha * 0.6})`;

            // Draw neutral particles as dashed lines
            if (this.isNeutral) {
                ctx.setLineDash([4, 4]);
            } else {
                ctx.setLineDash([]);
            }

            ctx.lineWidth = this.thickness;
            ctx.stroke();
            ctx.setLineDash([]); // Reset
        }
    }

    let state = 'BEAM'; // BEAM -> COLLISION -> COOLDOWN
    let beamProgress = 0;
    let eventTracks = [];
    let cooldownTimer = 0;

    const animate = () => {
        requestAnimationFrame(animate);
        ctx.clearRect(0, 0, width, height);

        const colors = getThemeColors();
        const cx = width / 2;
        const cy = height / 2;
        const maxRadius = Math.min(width, height) * 0.45;

        // Draw CMS/ATLAS Detector outline
        drawDetector(ctx, cx, cy, maxRadius, colors);

        if (state === 'BEAM') {
            // Speed of the approaching beams
            beamProgress += 0.02;

            const beamDist = (1 - beamProgress) * (width / 2);

            ctx.beginPath();
            ctx.strokeStyle = `rgba(${colors.beam}, 0.8)`;
            ctx.lineWidth = 3;

            // Beam 1 (Left to Right)
            ctx.moveTo(0, cy);
            ctx.lineTo(cx - beamDist, cy);

            // Beam 2 (Right to Left)
            ctx.moveTo(width, cy);
            ctx.lineTo(cx + beamDist, cy);

            ctx.stroke();

            // Head-on collision trigger
            if (beamProgress >= 1) {
                state = 'COLLISION';
                eventTracks = [];
                // Generate a burst of subatomic particles
                const numParticles = Math.floor(Math.random() * 60) + 40;
                for (let i = 0; i < numParticles; i++) {
                    eventTracks.push(new Track(cx, cy));
                }
            }

        } else if (state === 'COLLISION') {
            let alive = false;

            // Collision flash
            if (eventTracks[0] && eventTracks[0].life > 0.9) {
                ctx.beginPath();
                ctx.arc(cx, cy, (1 - eventTracks[0].life) * 100, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${colors.beam}, ${eventTracks[0].life - 0.5})`;
                ctx.fill();
            }

            for (let t of eventTracks) {
                if (t.life > 0) {
                    t.update();
                    t.draw(ctx, colors);
                    alive = true;
                }
            }

            if (!alive) {
                state = 'COOLDOWN';
                cooldownTimer = 120; // frame delay before next beam injection
            }

        } else if (state === 'COOLDOWN') {
            cooldownTimer--;
            if (cooldownTimer <= 0) {
                state = 'BEAM';
                beamProgress = 0;
            }
        }
    };

    animate();
});
