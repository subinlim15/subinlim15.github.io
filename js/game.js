const PersonalGame = (() => {
    let canvas, ctx;
    let score = 0;

    let grid = []; // 2D array of tile objects or null
    let activeTiles = []; // tiles currently on board
    let deletedTiles = []; // tiles sliding to merge and then disappear
    let nextTileId = 1;
    let anyTileMoving = false;
    let animationId = null;

    let isPlaying = false;
    let isTouchMoved = false;
    let touchStartX = 0;
    let touchStartY = 0;

    const GRID_SIZE = 4;
    const TILE_PADDING = 10;
    const CANVAS_SIZE = 400; // Expected canvas size
    let TILE_SIZE = (CANVAS_SIZE - TILE_PADDING * (GRID_SIZE + 1)) / GRID_SIZE;

    const COLORS = {
        background: '#bbada0',
        emptyTile: '#ccc0b3',
        textDark: '#776e65',
        textLight: '#f9f6f2',
        tiles: {
            1: '#eee4da',
            2: '#eee4da',
            4: '#ede0c8',
            8: '#f2b179',
            16: '#f59563',
            32: '#f67c5f',
            64: '#f65e3b',
            128: '#edcf72',
            256: '#edcc61',
            512: '#edc850',
            1024: '#edc53f',
            2048: '#edc22e'
        }
    };

    function initGame() {
        canvas = document.getElementById('higgs-game-canvas');
        if (!canvas) return;
        ctx = canvas.getContext('2d');

        TILE_SIZE = (canvas.width - TILE_PADDING * (GRID_SIZE + 1)) / GRID_SIZE;

        // Event Listeners
        document.addEventListener('keydown', handleKeydown);

        canvas.addEventListener('touchstart', (e) => {
            if (!isPlaying) return;
            touchStartX = e.changedTouches[0].screenX;
            touchStartY = e.changedTouches[0].screenY;
            isTouchMoved = false;
        }, { passive: false });

        canvas.addEventListener('touchmove', (e) => {
            if (!isPlaying) return;
            let touchEndX = e.changedTouches[0].screenX;
            let touchEndY = e.changedTouches[0].screenY;

            let dx = touchEndX - touchStartX;
            let dy = touchEndY - touchStartY;

            if (Math.abs(dx) > 20 || Math.abs(dy) > 20) {
                e.preventDefault(); // Prevent scrolling once we surpass a threshold
                isTouchMoved = true;
            }
        }, { passive: false });

        canvas.addEventListener('touchend', (e) => {
            if (!isPlaying || !isTouchMoved) return;
            let touchEndX = e.changedTouches[0].screenX;
            let touchEndY = e.changedTouches[0].screenY;
            handleSwipe(touchStartX, touchStartY, touchEndX, touchEndY);
        }, { passive: false });

        const startBtn = document.getElementById('start-game-btn');
        if (startBtn) {
            startBtn.addEventListener('click', startGame);
        }

        drawStaticBoard();
    }

    function startGame() {
        document.getElementById('game-overlay').style.display = 'none';
        isPlaying = true;
        score = 0;
        activeTiles = [];
        deletedTiles = [];
        nextTileId = 1;

        // Initialize empty grid
        grid = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(null));

        // Add two initial tiles
        addRandomTile();
        addRandomTile();

        updateUI();

        // Lock scrolling on mobile when game is active
        document.body.style.overflow = 'hidden';

        if (animationId) cancelAnimationFrame(animationId);
        animationLoop();
    }

    function addRandomTile() {
        let emptyCells = [];

        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                if (!grid[r][c]) {
                    emptyCells.push({ r, c });
                }
            }
        }

        if (emptyCells.length === 0) return;

        let randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];

        // Classic 2048 rule: 90% chance of 2, 10% chance of 4
        let newValue = Math.random() < 0.9 ? 2 : 4;

        let CURRENT_TILE_SIZE = (canvas.width - TILE_PADDING * (GRID_SIZE + 1)) / GRID_SIZE;
        let t = {
            id: nextTileId++,
            r: randomCell.r,
            c: randomCell.c,
            val: newValue,
            x: TILE_PADDING + (CURRENT_TILE_SIZE + TILE_PADDING) * randomCell.c,
            y: TILE_PADDING + (CURRENT_TILE_SIZE + TILE_PADDING) * randomCell.r,
            scale: 0,
            animatingScale: 'up',
            isPop: false
        };

        grid[randomCell.r][randomCell.c] = t;
        activeTiles.push(t);
    }

    function handleKeydown(e) {
        if (!isPlaying) return;

        // Avoid handling multiple moves if already heavily animating
        // but typically 2048 allows fast queued moves. We'll allow it.
        let moved = false;
        switch (e.code) {
            case 'ArrowUp': moved = moveUp(); break;
            case 'ArrowDown': moved = moveDown(); break;
            case 'ArrowLeft': moved = moveLeft(); break;
            case 'ArrowRight': moved = moveRight(); break;
            default: return; // Not an arrow key
        }

        if (moved) {
            e.preventDefault();
            afterMove();
        }
    }

    function handleSwipe(startX, startY, endX, endY) {
        let dx = endX - startX;
        let dy = endY - startY;

        if (Math.abs(dx) < 30 && Math.abs(dy) < 30) return; // Too short

        let moved = false;
        if (Math.abs(dx) > Math.abs(dy)) {
            if (dx > 0) moved = moveRight();
            else moved = moveLeft();
        } else {
            if (dy > 0) moved = moveDown();
            else moved = moveUp();
        }

        if (moved) afterMove();
    }

    function afterMove() {
        addRandomTile();
        updateUI();

        if (isGameOver()) {
            endGame();
        }
    }

    // Abstracting movement logic
    function moveLeft() {
        let moved = false;
        for (let r = 0; r < GRID_SIZE; r++) {
            let rowTiles = [];
            for (let c = 0; c < GRID_SIZE; c++) if (grid[r][c]) rowTiles.push(grid[r][c]);
            for (let c = 0; c < GRID_SIZE; c++) grid[r][c] = null;

            let targetCol = 0;
            let i = 0;
            while (i < rowTiles.length) {
                let t1 = rowTiles[i];
                if (i < rowTiles.length - 1 && t1.val === rowTiles[i + 1].val) {
                    let t2 = rowTiles[i + 1];
                    t2.toBeDeleted = true;
                    t2.targetR = r;
                    t2.targetC = targetCol;
                    deletedTiles.push(t2);
                    activeTiles = activeTiles.filter(at => at.id !== t2.id);

                    t1.r = r;
                    t1.c = targetCol;
                    t1.val = t1.val * 2;
                    t1.isPop = true;

                    score += t1.val;
                    grid[r][targetCol] = t1;
                    targetCol++; i += 2; moved = true;
                } else {
                    if (t1.r !== r || t1.c !== targetCol) moved = true;
                    t1.r = r; t1.c = targetCol;
                    grid[r][targetCol] = t1;
                    targetCol++; i++;
                }
            }
        }
        return moved;
    }

    function moveRight() {
        let moved = false;
        for (let r = 0; r < GRID_SIZE; r++) {
            let rowTiles = [];
            for (let c = GRID_SIZE - 1; c >= 0; c--) if (grid[r][c]) rowTiles.push(grid[r][c]);
            for (let c = 0; c < GRID_SIZE; c++) grid[r][c] = null;

            let targetCol = GRID_SIZE - 1;
            let i = 0;
            while (i < rowTiles.length) {
                let t1 = rowTiles[i];
                if (i < rowTiles.length - 1 && t1.val === rowTiles[i + 1].val) {
                    let t2 = rowTiles[i + 1];
                    t2.toBeDeleted = true;
                    t2.targetR = r; t2.targetC = targetCol;
                    deletedTiles.push(t2);
                    activeTiles = activeTiles.filter(at => at.id !== t2.id);

                    t1.r = r; t1.c = targetCol;
                    t1.val = t1.val * 2;
                    t1.isPop = true;

                    score += t1.val;
                    grid[r][targetCol] = t1;
                    targetCol--; i += 2; moved = true;
                } else {
                    if (t1.r !== r || t1.c !== targetCol) moved = true;
                    t1.r = r; t1.c = targetCol;
                    grid[r][targetCol] = t1;
                    targetCol--; i++;
                }
            }
        }
        return moved;
    }

    function moveUp() {
        let moved = false;
        for (let c = 0; c < GRID_SIZE; c++) {
            let colTiles = [];
            for (let r = 0; r < GRID_SIZE; r++) if (grid[r][c]) colTiles.push(grid[r][c]);
            for (let r = 0; r < GRID_SIZE; r++) grid[r][c] = null;

            let targetRow = 0;
            let i = 0;
            while (i < colTiles.length) {
                let t1 = colTiles[i];
                if (i < colTiles.length - 1 && t1.val === colTiles[i + 1].val) {
                    let t2 = colTiles[i + 1];
                    t2.toBeDeleted = true;
                    t2.targetR = targetRow; t2.targetC = c;
                    deletedTiles.push(t2);
                    activeTiles = activeTiles.filter(at => at.id !== t2.id);

                    t1.r = targetRow; t1.c = c;
                    t1.val = t1.val * 2;
                    t1.isPop = true;

                    score += t1.val;
                    grid[targetRow][c] = t1;
                    targetRow++; i += 2; moved = true;
                } else {
                    if (t1.r !== targetRow || t1.c !== c) moved = true;
                    t1.r = targetRow; t1.c = c;
                    grid[targetRow][c] = t1;
                    targetRow++; i++;
                }
            }
        }
        return moved;
    }

    function moveDown() {
        let moved = false;
        for (let c = 0; c < GRID_SIZE; c++) {
            let colTiles = [];
            for (let r = GRID_SIZE - 1; r >= 0; r--) if (grid[r][c]) colTiles.push(grid[r][c]);
            for (let r = 0; r < GRID_SIZE; r++) grid[r][c] = null;

            let targetRow = GRID_SIZE - 1;
            let i = 0;
            while (i < colTiles.length) {
                let t1 = colTiles[i];
                if (i < colTiles.length - 1 && t1.val === colTiles[i + 1].val) {
                    let t2 = colTiles[i + 1];
                    t2.toBeDeleted = true;
                    t2.targetR = targetRow; t2.targetC = c;
                    deletedTiles.push(t2);
                    activeTiles = activeTiles.filter(at => at.id !== t2.id);

                    t1.r = targetRow; t1.c = c;
                    t1.val = t1.val * 2;
                    t1.isPop = true;

                    score += t1.val;
                    grid[targetRow][c] = t1;
                    targetRow--; i += 2; moved = true;
                } else {
                    if (t1.r !== targetRow || t1.c !== c) moved = true;
                    t1.r = targetRow; t1.c = c;
                    grid[targetRow][c] = t1;
                    targetRow--; i++;
                }
            }
        }
        return moved;
    }

    function isGameOver() {
        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                if (!grid[r][c]) return false;
                if (c < GRID_SIZE - 1 && grid[r][c].val === (grid[r][c + 1] ? grid[r][c + 1].val : -1)) return false;
                if (r < GRID_SIZE - 1 && grid[r][c].val === (grid[r + 1][c] ? grid[r + 1][c].val : -1)) return false;
            }
        }
        return true;
    }

    function endGame() {
        isPlaying = false;
        document.body.style.overflow = ''; // Release scroll block

        const overlay = document.getElementById('game-overlay');
        const msg = document.getElementById('game-message');
        const btn = document.getElementById('start-game-btn');

        setTimeout(() => {
            overlay.style.backgroundColor = 'rgba(238, 228, 218, 0.73)';
            overlay.style.display = 'flex';
            msg.innerHTML = `Game Over!<br><span style="font-size:1.2rem;color:#776e65">Score: ${score}</span>`;
            btn.textContent = 'Try Again';
            btn.style.background = '#8f7a66';
            msg.style.color = '#776e65';
        }, 1000);
    }

    function updateUI() {
        const scoreEl = document.getElementById('game-score');
        if (scoreEl) scoreEl.textContent = `Score: ${score}`;
    }

    function drawRoundRect(ctx, x, y, width, height, radius) {
        if (ctx.roundRect) {
            ctx.roundRect(x, y, width, height, radius);
            return;
        }
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
    }

    function drawStaticBoard() {
        if (!ctx) return;
        let CURRENT_TILE_SIZE = (canvas.width - TILE_PADDING * (GRID_SIZE + 1)) / GRID_SIZE;
        ctx.fillStyle = COLORS.background;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                let x = TILE_PADDING + (CURRENT_TILE_SIZE + TILE_PADDING) * c;
                let y = TILE_PADDING + (CURRENT_TILE_SIZE + TILE_PADDING) * r;
                ctx.fillStyle = COLORS.emptyTile;
                ctx.beginPath(); drawRoundRect(ctx, x, y, CURRENT_TILE_SIZE, CURRENT_TILE_SIZE, 5); ctx.fill();
            }
        }
    }

    function drawTile(t) {
        let CURRENT_TILE_SIZE = (canvas.width - TILE_PADDING * (GRID_SIZE + 1)) / GRID_SIZE;
        // Find center for scaling pop effect
        let cx = t.x + CURRENT_TILE_SIZE / 2;
        let cy = t.y + CURRENT_TILE_SIZE / 2;
        let ts = CURRENT_TILE_SIZE * t.scale;

        ctx.fillStyle = COLORS.tiles[t.val] || '#3c3a32';
        ctx.beginPath();
        drawRoundRect(ctx, cx - ts / 2, cy - ts / 2, ts, ts, 5 * t.scale);
        ctx.fill();

        ctx.fillStyle = t.val <= 4 ? COLORS.textDark : COLORS.textLight;

        // Increase font size proportionally to canvas
        let baseFont = CURRENT_TILE_SIZE * 0.7; // Very large base font
        let fontSize = t.val < 100 ? baseFont * t.scale : (t.val < 1000 ? (baseFont * 0.8) * t.scale : (baseFont * 0.6) * t.scale);
        ctx.font = `bold ${fontSize}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        // Add a slight vertical offset for better visual centering in some fonts
        ctx.fillText(t.val, cx, cy + (fontSize * 0.05));
    }

    function animationLoop() {
        if (!ctx) return;

        let CURRENT_TILE_SIZE = (canvas.width - TILE_PADDING * (GRID_SIZE + 1)) / GRID_SIZE;

        const LERP_SPEED = 0.35;
        anyTileMoving = false;

        // Process physics
        activeTiles.forEach(t => {
            let tx = TILE_PADDING + (CURRENT_TILE_SIZE + TILE_PADDING) * t.c;
            let ty = TILE_PADDING + (CURRENT_TILE_SIZE + TILE_PADDING) * t.r;

            if (Math.abs(tx - t.x) > 1 || Math.abs(ty - t.y) > 1) {
                t.x += (tx - t.x) * LERP_SPEED;
                t.y += (ty - t.y) * LERP_SPEED;
                anyTileMoving = true;
            } else {
                t.x = tx; t.y = ty;
                if (t.isPop) {
                    t.isPop = false;
                    t.animatingScale = 'down';
                    t.scale = 1.25;
                }
            }

            if (t.animatingScale === 'up') {
                t.scale += (1 - t.scale) * 0.2;
                if (t.scale > 0.95) { t.scale = 1; t.animatingScale = false; }
                anyTileMoving = true;
            } else if (t.animatingScale === 'down') {
                t.scale += (1 - t.scale) * 0.2;
                if (t.scale < 1.05) { t.scale = 1; t.animatingScale = false; }
                anyTileMoving = true;
            }
        });

        for (let i = deletedTiles.length - 1; i >= 0; i--) {
            let t = deletedTiles[i];
            let tx = TILE_PADDING + (CURRENT_TILE_SIZE + TILE_PADDING) * t.targetC;
            let ty = TILE_PADDING + (CURRENT_TILE_SIZE + TILE_PADDING) * t.targetR;

            if (Math.abs(tx - t.x) > 1 || Math.abs(ty - t.y) > 1) {
                t.x += (tx - t.x) * LERP_SPEED;
                t.y += (ty - t.y) * LERP_SPEED;
                anyTileMoving = true;
            } else {
                deletedTiles.splice(i, 1);
            }
        }

        // Draw Layer
        drawStaticBoard();

        // Draw deleted tiles below active ones so they slide "into" the merging tile
        deletedTiles.forEach(t => drawTile(t));
        activeTiles.forEach(t => drawTile(t));

        if (isPlaying || anyTileMoving || deletedTiles.length > 0) {
            animationId = requestAnimationFrame(animationLoop);
        }
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
            document.body.style.overflow = '';
            if (animationId) cancelAnimationFrame(animationId);
        }
    };
})();

window.initPersonalGame = PersonalGame.init;
window.stopPersonalGame = PersonalGame.stop;
