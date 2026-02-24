const PersonalGame = (() => {
    let canvas, ctx;
    let particles = [];
    let animationId;
    let isPlaying = false;
    let score = 0;
    let timeLeft = 30;
    let timerInterval;

    const COLORS = {
        background: '#111',
        higgs: '#ff4757',
        noise: ['#1e90ff', '#2ed573', '#ffa502', '#57606f', '#7bed9f']
    };

    class Particle {
        constructor(isHiggs = false) {
            this.isHiggs = isHiggs;
            this.radius = isHiggs ? 8 : (Math.random() * 4 + 3);
            this.reset();
        }

        reset() {
            if (!canvas) return;
            this.x = Math.random() * (canvas.width - this.radius * 2) + this.radius;
            this.y = Math.random() * (canvas.height - this.radius * 2) + this.radius;

            // Speed up the higgs a bit so it's challenging to catch
            const speedMultiplier = this.isHiggs ? 3.5 : (Math.random() * 1.5 + 0.5);
            const angle = Math.random() * Math.PI * 2;
            this.vx = Math.cos(angle) * speedMultiplier;
            this.vy = Math.sin(angle) * speedMultiplier;

            this.color = this.isHiggs ? COLORS.higgs : COLORS.noise[Math.floor(Math.random() * COLORS.noise.length)];

            // For higgs, erratic movement timer
            this.wiggleTimer = 0;
        }

        update() {
            if (!canvas) return;

            // Erratic movement for Higgs
            if (this.isHiggs) {
                this.wiggleTimer++;
                if (this.wiggleTimer > 30) {
                    this.vx += (Math.random() - 0.5) * 2;
                    this.vy += (Math.random() - 0.5) * 2;

                    // Cap speed
                    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
                    if (speed > 5) {
                        this.vx = (this.vx / speed) * 5;
                        this.vy = (this.vy / speed) * 5;
                    }
                    this.wiggleTimer = 0;
                }
            }

            this.x += this.vx;
            this.y += this.vy;

            // Bounce off walls
            if (this.x - this.radius <= 0 || this.x + this.radius >= canvas.width) this.vx *= -1;
            if (this.y - this.radius <= 0 || this.y + this.radius >= canvas.height) this.vy *= -1;

            // Constrain
            this.x = Math.max(this.radius, Math.min(canvas.width - this.radius, this.x));
            this.y = Math.max(this.radius, Math.min(canvas.height - this.radius, this.y));
        }

        draw(ctx) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
            if (this.isHiggs) {
                ctx.shadowBlur = 10;
                ctx.shadowColor = this.color;
                ctx.fill();
                ctx.shadowBlur = 0; // Reset
            }
            ctx.closePath();
        }
    }

    function spawnParticles() {
        particles = [];
        // Spawn 1 higgs
        particles.push(new Particle(true));
        // Spawn N noise particles depending on score to increase difficulty
        const noiseCount = 40 + (score * 15);
        for (let i = 0; i < noiseCount; i++) {
            particles.push(new Particle(false));
        }
    }

    function initGame() {
        canvas = document.getElementById('higgs-game-canvas');
        if (!canvas) return;
        ctx = canvas.getContext('2d');

        // Handle click
        canvas.addEventListener('mousedown', handleCanvasClick);
        canvas.addEventListener('touchstart', handleCanvasClick, { passive: false });

        const startBtn = document.getElementById('start-game-btn');
        if (startBtn) {
            startBtn.addEventListener('click', startGame);
        }

        // Draw initial state
        ctx.fillStyle = COLORS.background;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    function startGame() {
        if (isPlaying) return;
        score = 0;
        timeLeft = 30;
        isPlaying = true;

        document.getElementById('game-overlay').style.display = 'none';
        updateUI();

        spawnParticles();

        if (timerInterval) clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            timeLeft--;
            updateUI();
            if (timeLeft <= 0) {
                endGame();
            }
        }, 1000);

        if (animationId) cancelAnimationFrame(animationId);
        gameLoop();
    }

    function endGame() {
        isPlaying = false;
        cancelAnimationFrame(animationId);
        clearInterval(timerInterval);

        const overlay = document.getElementById('game-overlay');
        const msg = document.getElementById('game-message');
        const btn = document.getElementById('start-game-btn');

        overlay.style.display = 'flex';
        btn.textContent = 'Run Another Collision';

        if (score >= 5.0) {
            msg.textContent = `Discovery! Reached ${score.toFixed(1)}σ! 🏆`;
            msg.style.color = '#ffd700';
        } else {
            msg.textContent = `Run Ended. Only ${score.toFixed(1)}σ...`;
            msg.style.color = '#FFF';
        }
    }

    function updateUI() {
        const scoreEl = document.getElementById('game-score');
        const timeEl = document.getElementById('game-time');
        if (scoreEl) scoreEl.textContent = `Significance: ${score.toFixed(1)} σ`;
        if (timeEl) timeEl.textContent = `Time: ${timeLeft}s`;
    }

    function handleCanvasClick(e) {
        if (!isPlaying || !canvas) return;
        e.preventDefault();

        const rect = canvas.getBoundingClientRect();

        // Calculate scale factors if CSS scales the canvas
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        // Support both mouse and touch
        let clientX = e.clientX;
        let clientY = e.clientY;
        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        }

        const clickX = (clientX - rect.left) * scaleX;
        const clickY = (clientY - rect.top) * scaleY;

        let hitHiggs = false;

        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            const dist = Math.hypot(p.x - clickX, p.y - clickY);
            // generous hitbox
            if (dist < p.radius + 15) {
                if (p.isHiggs) {
                    hitHiggs = true;
                    break;
                } else {
                    // Penalty for clicking noise
                    timeLeft = Math.max(0, timeLeft - 2);
                    updateUI();
                }
            }
        }

        if (hitHiggs) {
            score += 0.5;
            timeLeft += 2; // Bonus time
            updateUI();
            // Create particle explosion
            createExplosion(clickX, clickY);
            // Respawn harder
            spawnParticles();

            // Win condition early
            if (score >= 5.0 && timeLeft > 0) {
                endGame();
            }
        }
    }

    let explosions = [];
    function createExplosion(x, y) {
        for (let i = 0; i < 15; i++) {
            explosions.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                life: 1.0,
                color: COLORS.higgs
            });
        }
    }

    function updateExplosions() {
        for (let i = explosions.length - 1; i >= 0; i--) {
            const p = explosions[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.05;
            if (p.life <= 0) {
                explosions.splice(i, 1);
            } else {
                ctx.globalAlpha = p.life;
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1.0;
            }
        }
    }

    function gameLoop() {
        if (!isPlaying || !ctx) return;

        // draw background with slight trail
        ctx.fillStyle = 'rgba(17, 17, 17, 0.4)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        particles.forEach(p => {
            p.update();
            p.draw(ctx);
        });

        updateExplosions();

        animationId = requestAnimationFrame(gameLoop);
    }

    return {
        init: () => {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', initGame);
            } else {
                initGame();
            }
        },
        stop: () => {
            isPlaying = false;
            if (animationId) cancelAnimationFrame(animationId);
            if (timerInterval) clearInterval(timerInterval);
        }
    };
})();

window.initPersonalGame = PersonalGame.init;
window.stopPersonalGame = PersonalGame.stop;
