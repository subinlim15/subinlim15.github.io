const PersonalAnimations = (() => {
    let canvas, ctx, animationId;
    let isPlaying = false;
    let currentMode = 'tunneling'; // tunneling, feynman, neutrino, doubleslit
    let entities = [];
    let time = 0;
    let mouseX = 0, mouseY = 0;

    function handleMouseMove(e) {
        mouseX = e.clientX;
        mouseY = e.clientY;
    }

    function handleMouseDown() {
        if (currentMode === 'doubleslit' && entities.observerHover) {
            entities.isObserved = !entities.isObserved;
            // Reset accumulated screen data to clearly show the change
            entities.screenBins = new Array(200).fill(0);
        }
    }

    // --- Tunneling ---
    function initTunneling() {
        entities = [];
        for (let i = 0; i < 40; i++) {
            entities.push({
                x: Math.random() * (canvas.width / 2 - 100) - 200,
                y: Math.random() * canvas.height,
                vx: 1.5 + Math.random() * 2.5,
                vy: (Math.random() - 0.5) * 0.5,
                phase: Math.random() * Math.PI * 2,
                color: ['#1e90ff', '#eccc68'][Math.floor(Math.random() * 2)],
                status: 'moving' // moving, reflected, tunneled
            });
        }
    }
    function updateTunneling() {
        let isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        let barrierX = canvas.width / 2;
        let barrierWidth = 60;

        // Draw barrier
        ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
        ctx.fillRect(barrierX, 0, barrierWidth, canvas.height);

        entities.forEach(p => {
            if (p.status === 'moving') {
                if (p.x + p.vx > barrierX && p.x < barrierX + barrierWidth / 2) {
                    // Encounter barrier
                    if (Math.random() < 0.07) { // 7% tunneling probability
                        p.status = 'tunneled';
                        p.x += barrierWidth + 5; // jump across barrier
                    } else {
                        p.status = 'reflected';
                        p.vx *= -1;
                    }
                }
            }

            p.x += p.vx;
            p.y += p.vy;

            // reset bounds
            if (p.x < -100 || p.x > canvas.width + 100 || p.y < -50 || p.y > canvas.height + 50) {
                p.x = -50;
                p.y = Math.random() * canvas.height;
                p.vx = 1.5 + Math.random() * 2.5;
                p.status = 'moving';
            }

            p.phase += 0.1;
            let size = 3 + Math.sin(p.phase) * 1.5;

            ctx.beginPath();
            ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.status === 'tunneled' ? 0.3 : 0.7;
            ctx.fill();
            ctx.globalAlpha = 1.0;
        });
    }

    // --- Feynman Diagram ---
    function initFeynman() {
        entities = { nodes: [], edges: [] };
        time = 0;
    }
    function updateFeynman() {
        let isDark = document.documentElement.getAttribute('data-theme') === 'dark';

        if (Math.random() < 0.06 && entities.nodes.length < 25) {
            entities.nodes.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                life: 0
            });
            if (entities.nodes.length > 2 && Math.random() < 0.6) {
                let n1 = entities.nodes[entities.nodes.length - 1];
                let n2 = entities.nodes[Math.floor(Math.random() * (entities.nodes.length - 1))];
                entities.edges.push({
                    n1, n2,
                    type: ['straight', 'wavy', 'coiled'][Math.floor(Math.random() * 3)],
                    life: 0
                });
            }
        }

        entities.edges.forEach(e => e.life++);
        entities.nodes.forEach(n => n.life++);

        ctx.strokeStyle = isDark ? '#a29bfe' : '#6c5ce7';
        ctx.lineWidth = 1.5;
        entities.edges.forEach(e => {
            let alpha = Math.min(1, Math.max(0, e.life / 50));
            // fade out old
            if (e.life > 300) alpha = Math.max(0, 1 - (e.life - 300) / 50);
            if (alpha <= 0) return;
            ctx.globalAlpha = alpha;
            ctx.beginPath();

            if (e.type === 'straight') {
                ctx.moveTo(e.n1.x, e.n1.y);
                ctx.lineTo(e.n2.x, e.n2.y);
                ctx.stroke();
            } else if (e.type === 'wavy') {
                let dx = e.n2.x - e.n1.x;
                let dy = e.n2.y - e.n1.y;
                let dist = Math.sqrt(dx * dx + dy * dy);
                let angle = Math.atan2(dy, dx);
                let steps = Math.floor(dist / 6);
                ctx.moveTo(e.n1.x, e.n1.y);
                for (let i = 0; i <= steps; i++) {
                    let t = i / steps;
                    let mx = e.n1.x + dx * t;
                    let my = e.n1.y + dy * t;
                    let wave = Math.sin(t * dist * 0.25) * 6;
                    ctx.lineTo(mx + Math.cos(angle + Math.PI / 2) * wave, my + Math.sin(angle + Math.PI / 2) * wave);
                }
                ctx.stroke();
            } else {
                let dx = e.n2.x - e.n1.x;
                let dy = e.n2.y - e.n1.y;
                let dist = Math.sqrt(dx * dx + dy * dy);
                let angle = Math.atan2(dy, dx);
                let steps = Math.floor(dist / 4);
                ctx.moveTo(e.n1.x, e.n1.y);
                for (let i = 0; i <= steps; i++) {
                    let t = i / steps;
                    let mx = e.n1.x + dx * t;
                    let my = e.n1.y + dy * t;
                    let coilAngle = t * dist * 0.5;
                    ctx.lineTo(mx + Math.cos(coilAngle) * 8, my + Math.sin(coilAngle) * 8);
                }
                ctx.stroke();
            }
        });

        ctx.fillStyle = isDark ? '#ff7675' : '#d63031';
        entities.nodes.forEach(n => {
            let alpha = Math.min(1, Math.max(0, n.life / 50));
            if (n.life > 300) alpha = Math.max(0, 1 - (n.life - 300) / 50);
            if (alpha <= 0) return;
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.arc(n.x, n.y, 4, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1.0;

        entities.edges = entities.edges.filter(e => e.life <= 350);
        entities.nodes = entities.nodes.filter(n => n.life <= 350);
    }

    // --- Neutrino Oscillation ---
    function initNeutrino() {
        entities = [];
        for (let i = 0; i < 70; i++) {
            entities.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: 0.5 + Math.random() * 1.5,
                vy: (Math.random() - 0.5) * 0.5,
                phase: Math.random() * 10,
                speed: 0.01 + Math.random() * 0.02
            });
        }
    }
    function updateNeutrino() {
        let isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        entities.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.phase += p.speed;

            if (p.x > canvas.width + 50) p.x = -50;
            if (p.x < -50) p.x = canvas.width + 50;
            if (p.y > canvas.height + 50) p.y = -50;
            if (p.y < -50) p.y = canvas.height + 50;

            let r = Math.floor(127 + 127 * Math.sin(p.phase));
            let g = Math.floor(127 + 127 * Math.sin(p.phase + 2.09)); // 120 degrees offset
            let b = Math.floor(127 + 127 * Math.sin(p.phase + 4.18)); // 240 degrees offset

            ctx.beginPath();
            ctx.arc(p.x, p.y, 12, 0, Math.PI * 2);
            let grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 12);
            grad.addColorStop(0, `rgba(${r},${g},${b},${isDark ? 0.6 : 0.4})`);
            grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
            ctx.fillStyle = grad;
            ctx.fill();
        });
    }

    // --- Double Slit ---
    function initDoubleSlit() {
        entities = {
            particles: [],
            screenBins: new Array(200).fill(0), // bins for screen intensity
            isObserved: false,
            observerHover: false
        };
    }
    function updateDoubleSlit() {
        let isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        let fgColor = isDark ? '#ffffff' : '#000000';
        let particleColor = isDark ? '#00f7ff' : '#0055ff';

        // Dimensions
        let sourceX = 50;
        let slitX = canvas.width / 3;
        let screenX = canvas.width - 50;
        let slitGap = 80;
        let slitHeight = 30;
        let centerY = canvas.height / 2;

        // Draw Source
        ctx.fillStyle = fgColor;
        ctx.beginPath();
        ctx.arc(sourceX, centerY, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillText("Electron Gun", sourceX - 20, centerY - 20);

        // Draw Slit Barrier
        ctx.fillStyle = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)';
        ctx.fillRect(slitX, 0, 4, centerY - slitGap / 2 - slitHeight / 2); // Top
        ctx.fillRect(slitX, centerY - slitGap / 2 + slitHeight / 2, 4, slitGap - slitHeight); // Middle
        ctx.fillRect(slitX, centerY + slitGap / 2 + slitHeight / 2, 4, canvas.height); // Bottom

        // Draw Screen
        ctx.fillRect(screenX, 0, 2, canvas.height);

        // Draw Observer (Eye)
        let eyeX = slitX + 50;
        let eyeY = centerY - 150;
        let dist = Math.sqrt((mouseX - eyeX) ** 2 + (mouseY - eyeY) ** 2);
        entities.observerHover = dist < 30;

        // Toggle observation on click (handled in event listener, but visualized here)
        ctx.strokeStyle = entities.isObserved ? '#ff4757' : (entities.observerHover ? fgColor : 'rgba(128,128,128,0.5)');
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(eyeX, eyeY, 20, 12, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Pupil
        ctx.fillStyle = entities.isObserved ? '#ff4757' : fgColor;
        ctx.beginPath();
        if (entities.isObserved) {
            ctx.arc(eyeX, eyeY, 6, 0, Math.PI * 2); // Open
        } else {
            ctx.rect(eyeX - 5, eyeY - 1, 10, 2); // Closed/Sleeping
        }
        ctx.fill();

        ctx.fillStyle = fgColor;
        ctx.font = "12px sans-serif";
        ctx.fillText(entities.isObserved ? "Observer: ON" : "Observer: OFF", eyeX - 30, eyeY - 20);
        ctx.fillText(entities.isObserved ? "(Collapse!)" : "(Wave!)", eyeX - 25, eyeY + 35);

        // Spawn Particles
        if (Math.random() < 0.4) { // Spawn rate
            entities.particles.push({
                x: sourceX,
                y: centerY,
                vx: 4,
                vy: (Math.random() - 0.5) * 1,
                stage: 0, // 0: source->slit, 1: slit->screen
                targetY: 0
            });
        }

        // Update Particles
        for (let i = entities.particles.length - 1; i >= 0; i--) {
            let p = entities.particles[i];

            p.x += p.vx;
            p.y += p.vy;

            // Stage 0: Approaching Slits
            if (p.stage === 0 && p.x >= slitX) {
                // Check if blocked
                let inTopSlit = (p.y > centerY - slitGap / 2 - slitHeight / 2 && p.y < centerY - slitGap / 2 + slitHeight / 2);
                let inBotSlit = (p.y > centerY + slitGap / 2 - slitHeight / 2 && p.y < centerY + slitGap / 2 + slitHeight / 2);

                if (inTopSlit || inBotSlit) {
                    p.stage = 1;

                    // Determine target Y based on physics mode
                    // We distribute target Y based on Probability Density Function (PDF)
                    // Pattern width scaling
                    let sigma = 40;
                    let k = 0.15; // wave number proxy for interference fringe spacing

                    // Use rejection sampling to pick a random Y coordinate that fits the PDF
                    let found = false;
                    while (!found) {
                        let testY = Math.random() * canvas.height;
                        let relY = testY - centerY;
                        let prob = 0;

                        if (entities.isObserved) {
                            // Particle nature: Sum of two Gaussians (no interference)
                            // P = exp(-(y-d/2)^2) + exp(-(y+d/2)^2)
                            let p1 = Math.exp(-Math.pow(relY - slitGap / 2, 2) / (2 * sigma * sigma));
                            let p2 = Math.exp(-Math.pow(relY + slitGap / 2, 2) / (2 * sigma * sigma));
                            prob = p1 + p2;
                        } else {
                            // Wave nature: Interference pattern
                            // P = Envelope * Interference
                            // P = exp(-y^2) * cos^2(k*y)
                            let envelope = Math.exp(-Math.pow(relY, 2) / (2 * (sigma * 2.5) * (sigma * 2.5))); // Broader envelope
                            let interference = Math.cos(k * relY);
                            prob = envelope * (interference * interference);
                        }

                        if (Math.random() < prob) {
                            p.targetY = testY;
                            // Recalculate velocity vector to hit targetY at screenX
                            let dx = screenX - p.x;
                            let dy = p.targetY - p.y;
                            let speed = 4;
                            let angle = Math.atan2(dy, dx);
                            p.vx = Math.cos(angle) * speed;
                            p.vy = Math.sin(angle) * speed;
                            found = true;
                        }
                    }
                } else {
                    // Blocked by wall
                    entities.particles.splice(i, 1);
                    continue;
                }
            }

            // Stage 1: Slit to Screen
            if (p.stage === 1 && p.x >= screenX) {
                // Hit Screen
                let binIndex = Math.floor((p.y / canvas.height) * entities.screenBins.length);
                if (binIndex >= 0 && binIndex < entities.screenBins.length) {
                    entities.screenBins[binIndex] += 1;
                }
                entities.particles.splice(i, 1);
                continue;
            }

            // Draw Particle
            ctx.fillStyle = particleColor;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
            ctx.fill();
        }

        // Draw Intensity Pattern on Screen
        let maxVal = Math.max(...entities.screenBins, 1);
        ctx.fillStyle = isDark ? 'rgba(0, 247, 255, 0.5)' : 'rgba(0, 85, 255, 0.5)';
        ctx.beginPath();
        for (let i = 0; i < entities.screenBins.length; i++) {
            let val = entities.screenBins[i];
            let barHeight = (val / maxVal) * 100; // 100px max width for the graph
            let y = (i / entities.screenBins.length) * canvas.height;
            let h = canvas.height / entities.screenBins.length;
            ctx.rect(screenX + 2, y, barHeight, h);
        }
        ctx.fill();

        // Decay pattern slowly for dynamic effect
        if (Math.random() < 0.1) {
            for (let i = 0; i < entities.screenBins.length; i++) {
                if (entities.screenBins[i] > 0) entities.screenBins[i] *= 0.99;
            }
        }
    }

    function loop() {
        if (!isPlaying || !ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        switch (currentMode) {
            case 'tunneling': updateTunneling(); break;
            case 'feynman': updateFeynman(); break;
            case 'neutrino': updateNeutrino(); break;
            case 'doubleslit': updateDoubleSlit(); break;
        }

        animationId = requestAnimationFrame(loop);
    }

    function resize() {
        if (!canvas) return;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    return {
        init: (mode, canvasId) => {
            canvas = document.getElementById(canvasId);
            if (!canvas) return;
            ctx = canvas.getContext('2d');
            resize();
            window.addEventListener('resize', resize);
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mousedown', handleMouseDown);

            if (!isPlaying) {
                isPlaying = true;
                currentMode = mode;
                PersonalAnimations.setMode(currentMode);
                loop();
            } else {
                PersonalAnimations.setMode(mode);
            }
        },
        setMode: (mode) => {
            currentMode = mode;
            if (mode === 'tunneling') initTunneling();
            else if (mode === 'feynman') initFeynman();
            else if (mode === 'neutrino') initNeutrino();
            else if (mode === 'doubleslit') initDoubleSlit();
            PersonalAnimations.updateInfoText();

            PersonalAnimations.updateInfoText();
        },
        stop: () => {
            isPlaying = false;
            if (animationId) cancelAnimationFrame(animationId);
            window.removeEventListener('resize', resize);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mousedown', handleMouseDown);
        },
        updateInfoText: () => {
            const infoDesc = {
                'tunneling': 'The background animation shows Quantum Tunneling. The energy barrier mostly reflects incoming wave packets, but occasionally, a particle seamlessly tunnels through the impenetrable wall.',
                'feynman': 'The background animation generates random Feynman diagrams. It visualizes hypothetical interaction histories between fermions and bosons in a vacuum state.',
                'neutrino': 'The background animation illustrates Neutrino Oscillation, displaying particles that drift steadily while shifting their flavor states (represented by gradient colors).',
                'doubleslit': 'The background animation simulates the Double-Slit experiment. Click the Eye icon to observe which slit particles pass through, collapsing the wavefunction and destroying the interference pattern.'
            };
            const el = document.querySelector(`.bg-info-anim_${currentMode}`);
            if (el) {
                el.textContent = infoDesc[currentMode];
            }
        }
    }
})();

window.initPersonalAnimations = PersonalAnimations.init;
window.stopPersonalAnimations = PersonalAnimations.stop;
window.setPersonalAnimationMode = PersonalAnimations.setMode;
