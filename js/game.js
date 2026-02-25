const PersonalGame = (() => {
    let canvas, ctx;
    let score = 0;
    let grid = [];
    let isPlaying = false;
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

        // Input handlers
        document.addEventListener('keydown', handleKeydown);

        // Touch or click on canvas
        canvas.addEventListener('touchstart', (e) => {
            if (!isPlaying) return;
            // e.preventDefault();
            touchStartX = e.changedTouches[0].screenX;
            touchStartY = e.changedTouches[0].screenY;
        }, { passive: false });

        canvas.addEventListener('touchend', (e) => {
            if (!isPlaying) return;
            // e.preventDefault();
            let touchEndX = e.changedTouches[0].screenX;
            let touchEndY = e.changedTouches[0].screenY;
            handleSwipe(touchStartX, touchStartY, touchEndX, touchEndY);
        }, { passive: false });

        const startBtn = document.getElementById('start-game-btn');
        if (startBtn) {
            startBtn.addEventListener('click', startGame);
        }

        drawGrid();
    }

    function startGame() {
        document.getElementById('game-overlay').style.display = 'none';
        isPlaying = true;
        score = 0;

        // Initialize empty grid
        grid = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(0));

        // Add two initial tiles
        addRandomTile();
        addRandomTile();

        updateUI();
        drawGrid();

        // Lock scrolling on mobile when game is active
        document.body.style.overflow = 'hidden';
    }

    function addRandomTile() {
        let emptyCells = [];
        let maxVal = 0;

        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                if (grid[r][c] === 0) {
                    emptyCells.push({ r, c });
                } else if (grid[r][c] > maxVal) {
                    maxVal = grid[r][c];
                }
            }
        }

        if (emptyCells.length === 0) return;

        let randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];

        // User custom rule: "새로운 수가 생길때는 현재 판의 최대 숫자/2 가 나올 수 있는 최대치야"
        let upperLimit = Math.max(2, Math.floor(maxVal / 2));

        // Find valid powers of 2 up to upperLimit
        let possibleValues = [1, 2];
        let p = 4;
        while (p <= upperLimit) {
            possibleValues.push(p);
            p *= 2;
        }

        let newValue = possibleValues[Math.floor(Math.random() * possibleValues.length)];

        // Initialize with 1 or 2 as requested ("처음에 1이나 2가 두개정도 주어지고")
        if (maxVal === 0) {
            newValue = Math.random() < 0.5 ? 1 : 2;
        }

        grid[randomCell.r][randomCell.c] = newValue;
    }

    function handleKeydown(e) {
        if (!isPlaying) return;

        let moved = false;
        switch (e.code) {
            case 'ArrowUp':
                moved = moveUp();
                break;
            case 'ArrowDown':
                moved = moveDown();
                break;
            case 'ArrowLeft':
                moved = moveLeft();
                break;
            case 'ArrowRight':
                moved = moveRight();
                break;
            default:
                return; // Not an arrow key
        }

        if (moved) {
            e.preventDefault(); // Prevent scrolling
            afterMove();
        }
    }

    function handleSwipe(startX, startY, endX, endY) {
        let dx = endX - startX;
        let dy = endY - startY;

        if (Math.abs(dx) < 30 && Math.abs(dy) < 30) return; // Too short

        let moved = false;

        if (Math.abs(dx) > Math.abs(dy)) {
            // Horizontal
            if (dx > 0) moved = moveRight();
            else moved = moveLeft();
        } else {
            // Vertical
            if (dy > 0) moved = moveDown();
            else moved = moveUp();
        }

        if (moved) afterMove();
    }

    function afterMove() {
        addRandomTile();
        updateUI();
        drawGrid();

        if (isGameOver()) {
            endGame();
        }
    }

    // Core game logic: Slide and merge
    function slideArray(row) {
        let newRow = row.filter(val => val !== 0);
        let mergedRow = [];
        let i = 0;
        let scoreGain = 0;

        while (i < newRow.length) {
            if (i < newRow.length - 1 && newRow[i] === newRow[i + 1]) {
                mergedRow.push(newRow[i] * 2);
                scoreGain += newRow[i] * 2;
                i += 2;
            } else {
                mergedRow.push(newRow[i]);
                i++;
            }
        }

        while (mergedRow.length < GRID_SIZE) {
            mergedRow.push(0);
        }

        score += scoreGain;
        return { modifiedRow: mergedRow, changed: row.toString() !== mergedRow.toString() };
    }

    function moveLeft() {
        let moved = false;
        for (let r = 0; r < GRID_SIZE; r++) {
            let res = slideArray(grid[r]);
            grid[r] = res.modifiedRow;
            if (res.changed) moved = true;
        }
        return moved;
    }

    function moveRight() {
        let moved = false;
        for (let r = 0; r < GRID_SIZE; r++) {
            let reversed = [...grid[r]].reverse();
            let res = slideArray(reversed);
            grid[r] = res.modifiedRow.reverse();
            if (res.changed) moved = true;
        }
        return moved;
    }

    function moveUp() {
        let moved = false;
        for (let c = 0; c < GRID_SIZE; c++) {
            let column = [grid[0][c], grid[1][c], grid[2][c], grid[3][c]];
            let res = slideArray(column);
            for (let r = 0; r < GRID_SIZE; r++) {
                grid[r][c] = res.modifiedRow[r];
            }
            if (res.changed) moved = true;
        }
        return moved;
    }

    function moveDown() {
        let moved = false;
        for (let c = 0; c < GRID_SIZE; c++) {
            let column = [grid[3][c], grid[2][c], grid[1][c], grid[0][c]];
            let res = slideArray(column);
            let merged = res.modifiedRow.reverse();
            for (let r = 0; r < GRID_SIZE; r++) {
                grid[r][c] = merged[r];
            }
            if (res.changed) moved = true;
        }
        return moved;
    }

    function isGameOver() {
        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                if (grid[r][c] === 0) return false;
                if (c < GRID_SIZE - 1 && grid[r][c] === grid[r][c + 1]) return false;
                if (r < GRID_SIZE - 1 && grid[r][c] === grid[r + 1][c]) return false;
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
        }, 500);
    }

    function updateUI() {
        const scoreEl = document.getElementById('game-score');
        if (scoreEl) scoreEl.textContent = `Score: ${score}`;
    }

    // Polyfill roundRect for older browsers if needed
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

    function drawGrid() {
        if (!ctx) return;

        // Clear canvas
        ctx.fillStyle = COLORS.background;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                let x = TILE_PADDING + (TILE_SIZE + TILE_PADDING) * c;
                let y = TILE_PADDING + (TILE_SIZE + TILE_PADDING) * r;
                let val = grid.length ? grid[r][c] : 0;

                // Draw tile background
                ctx.fillStyle = val === 0 ? COLORS.emptyTile : (COLORS.tiles[val] || '#3c3a32');

                // Draw rounded rect
                ctx.beginPath();
                drawRoundRect(ctx, x, y, TILE_SIZE, TILE_SIZE, 5);
                ctx.fill();

                // Draw value
                if (val !== 0) {
                    ctx.fillStyle = val <= 4 ? COLORS.textDark : COLORS.textLight;

                    let fontSize = val < 100 ? 46 : (val < 1000 ? 38 : 30);
                    ctx.font = `bold ${fontSize}px var(--font-family, sans-serif)`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(val, x + TILE_SIZE / 2, y + TILE_SIZE / 2);
                }
            }
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
        }
    };
})();

window.initPersonalGame = PersonalGame.init;
window.stopPersonalGame = PersonalGame.stop;
