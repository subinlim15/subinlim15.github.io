const PersonalGame = (() => {
    let canvas, ctx;
    let animationId;
    let isPlaying = false;
    let score = 0;
    let frameCount = 0;

    const GRAVITY = 0.6;
    const JUMP_FORCE = -10;
    const GROUND_HEIGHT = 20;

    let player = {
        x: 50,
        y: 150,
        width: 20,
        height: 20,
        vy: 0,
        isGrounded: true,
        jumps: 0,
        color: '#ff4757'
    };

    let obstacles = [];
    let particles = [];

    const COLORS = {
        background: '#111',
        ground: '#333',
        player: '#ff4757',
        obstacle: '#2ed573',
        text: '#fff'
    };

    function initGame() {
        canvas = document.getElementById('higgs-game-canvas');
        if (!canvas) return;
        ctx = canvas.getContext('2d');

        // Input handlers
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && !e.repeat) {
                e.preventDefault();
                handleJump();
            }
        });

        // Touch or click on canvas
        canvas.addEventListener('mousedown', (e) => {
            e.preventDefault();
            handleJump();
        });
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            handleJump();
        }, { passive: false });

        const startBtn = document.getElementById('start-game-btn');
        if (startBtn) {
            startBtn.addEventListener('click', startGame);
        }

        drawInitialState();
    }

    function handleJump() {
        if (!isPlaying) {
            // Start game on first jump if overlay is visible
            const overlay = document.getElementById('game-overlay');
            if (overlay.style.display !== 'none') {
                startGame();
            }
            return;
        }

        if (player.jumps < 2) {
            // Apply jump force
            player.vy = JUMP_FORCE;
            player.isGrounded = false;
            player.jumps++;

            // Create jump particles
            createParticles(player.x, player.y + player.height, 5, player.jumps === 2 ? '#2ed573' : '#ddd');
        }
    }

    function createParticles(x, y, count, color) {
        for (let i = 0; i < count; i++) {
            particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 1) * 4,
                life: 1.0,
                color: color
            });
        }
    }

    function updateParticles() {
        for (let i = particles.length - 1; i >= 0; i--) {
            let p = particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.05;
            if (p.life <= 0) {
                particles.splice(i, 1);
            } else {
                ctx.globalAlpha = p.life;
                ctx.fillStyle = p.color;
                ctx.fillRect(p.x, p.y, 3, 3);
                ctx.globalAlpha = 1.0;
            }
        }
    }

    function startGame() {
        if (isPlaying) return;

        document.getElementById('game-overlay').style.display = 'none';

        // Reset state
        score = 0;
        frameCount = 0;
        obstacles = [];
        particles = [];
        player.y = canvas.height - GROUND_HEIGHT - player.height;
        player.vy = 0;
        player.isGrounded = true;
        player.jumps = 0;
        isPlaying = true;

        updateUI();

        if (animationId) cancelAnimationFrame(animationId);
        gameLoop();
    }

    function endGame() {
        isPlaying = false;
        createParticles(player.x + player.width / 2, player.y + player.height / 2, 20, COLORS.player);

        const overlay = document.getElementById('game-overlay');
        const msg = document.getElementById('game-message');
        const btn = document.getElementById('start-game-btn');

        setTimeout(() => {
            overlay.style.display = 'flex';
            msg.innerHTML = `Collision Detected!<br><span style="font-size:1.2rem;color:#ccc">Score: ${Math.floor(score)}</span>`;
            btn.textContent = 'Restart Dash';
        }, 500);
    }

    function updateUI() {
        const scoreEl = document.getElementById('game-score');
        if (scoreEl) scoreEl.textContent = `Score: ${Math.floor(score)}`;
    }

    function drawInitialState() {
        if (!ctx) return;
        ctx.fillStyle = COLORS.background;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = COLORS.ground;
        ctx.fillRect(0, canvas.height - GROUND_HEIGHT, canvas.width, GROUND_HEIGHT);

        ctx.fillStyle = COLORS.player;
        ctx.fillRect(player.x, canvas.height - GROUND_HEIGHT - player.height, player.width, player.height);
    }

    function gameLoop() {
        if (!isPlaying) {
            // Render one last frame for death particles
            ctx.fillStyle = COLORS.background;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = COLORS.ground;
            ctx.fillRect(0, canvas.height - GROUND_HEIGHT, canvas.width, GROUND_HEIGHT);
            updateParticles();
            if (particles.length > 0) {
                animationId = requestAnimationFrame(gameLoop);
            }
            return;
        }

        frameCount++;
        score += 0.05;

        if (frameCount % 10 === 0) updateUI();

        // Clear canvas
        ctx.fillStyle = COLORS.background;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw ground
        ctx.fillStyle = COLORS.ground;
        ctx.fillRect(0, canvas.height - GROUND_HEIGHT, canvas.width, GROUND_HEIGHT);

        // Player physics
        player.vy += GRAVITY;
        player.y += player.vy;

        const groundY = canvas.height - GROUND_HEIGHT - player.height;
        if (player.y > groundY) {
            player.y = groundY;
            player.vy = 0;
            player.isGrounded = true;
            player.jumps = 0;
        }

        // Draw Player with glow
        ctx.shadowBlur = 10;
        ctx.shadowColor = COLORS.player;
        ctx.fillStyle = COLORS.player;
        ctx.fillRect(player.x, player.y, player.width, player.height);
        ctx.shadowBlur = 0;

        // Manage Obstacles
        // Speed up over time
        const gameSpeed = 5 + (score * 0.02);

        // Spawn
        if (frameCount % Math.max(40, Math.floor(120 - score)) === 0) {
            obstacles.push({
                x: canvas.width,
                y: canvas.height - GROUND_HEIGHT - (Math.random() > 0.7 ? 40 : 25), // Occasional high obstacles
                width: 15,
                height: Math.random() > 0.7 ? 40 : 25,
                color: COLORS.obstacle
            });
        }

        // Update & Draw Obstacles
        for (let i = obstacles.length - 1; i >= 0; i--) {
            let obs = obstacles[i];
            obs.x -= gameSpeed;

            ctx.fillStyle = obs.color;
            ctx.fillRect(obs.x, obs.y, obs.width, obs.height);

            // Collision Detection (AABB)
            if (
                player.x < obs.x + obs.width &&
                player.x + player.width > obs.x &&
                player.y < obs.y + obs.height &&
                player.y + player.height > obs.y
            ) {
                // Hit!
                endGame();
            }

            // Remove off-screen
            if (obs.x + obs.width < 0) {
                obstacles.splice(i, 1);
            }
        }

        updateParticles();

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
        }
    };
})();

window.initPersonalGame = PersonalGame.init;
window.stopPersonalGame = PersonalGame.stop;
