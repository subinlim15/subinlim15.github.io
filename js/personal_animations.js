const PersonalAnimations = (() => {
    let canvas, ctx, animationId;
    let isPlaying = false;
    let currentMode = 'tunneling'; // tunneling, feynman, neutrino, doubleslit
    let entities = [];
    let time = 0;

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
        entities = { time: 0 };
    }
    function updateDoubleSlit() {
        entities.time += 0.05;
        let s1 = { x: canvas.width / 2 - 100, y: canvas.height / 2 };
        let s2 = { x: canvas.width / 2 + 100, y: canvas.height / 2 };

        ctx.lineWidth = 1;
        let isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        let rgb = isDark ? '255, 255, 255' : '0, 0, 0';

        let maxRadius = Math.max(canvas.width, canvas.height) * 0.8;
        for (let r = (entities.time * 20) % 40; r < maxRadius; r += 40) {
            let alpha = Math.max(0, 1 - r / maxRadius) * 0.25;
            ctx.strokeStyle = `rgba(${rgb}, ${alpha})`;

            ctx.beginPath();
            ctx.arc(s1.x, s1.y, r, 0, Math.PI * 2);
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(s2.x, s2.y, r, 0, Math.PI * 2);
            ctx.stroke();
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
        },
        updateInfoText: () => {
            const infoDesc = {
                'tunneling': 'The background animation shows Quantum Tunneling. The energy barrier mostly reflects incoming wave packets, but occasionally, a particle seamlessly tunnels through the impenetrable wall.',
                'feynman': 'The background animation generates random Feynman diagrams. It visualizes hypothetical interaction histories between fermions and bosons in a vacuum state.',
                'neutrino': 'The background animation illustrates Neutrino Oscillation, displaying particles that drift steadily while shifting their flavor states (represented by gradient colors).',
                'doubleslit': 'The background animation mimics the Double-Slit wave interference pattern. Concentric waves emitted from two distinct points overlap to form constructive and destructive interference.'
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
