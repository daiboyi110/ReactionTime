const gameArea = document.getElementById('game-area');
const message = document.getElementById('message');
const result = document.getElementById('result');
const average = document.getElementById('average');
const resetBtn = document.getElementById('reset-btn');
const target = document.getElementById('target');
const modeSelection = document.getElementById('mode-selection');
const mode1Btn = document.getElementById('mode1-btn');
const mode2Btn = document.getElementById('mode2-btn');
const changeModeBtn = document.getElementById('change-mode-btn');
const currentModeText = document.getElementById('current-mode');
const instructionsMode1 = document.getElementById('instructions-mode1');
const instructionsMode2 = document.getElementById('instructions-mode2');

let state = 'idle'; // idle, waiting, ready, reach, result
let testMode = null; // 1 = reaction only, 2 = reaction + movement
let startTime;
let reachStartTime;
let timeoutId;
let reactionTimes = { mode1: [], mode2: [] };
let reachTimes = [];
let currentReactionTime;
let clickPosition = null;

// Load saved data from localStorage
if (localStorage.getItem('reactionTimes')) {
    const saved = JSON.parse(localStorage.getItem('reactionTimes'));
    if (saved.mode1 && saved.mode2) {
        reactionTimes = saved;
    }
}
if (localStorage.getItem('reachTimes')) {
    reachTimes = JSON.parse(localStorage.getItem('reachTimes'));
}

// Event listeners
gameArea.addEventListener('click', handleClick);
resetBtn.addEventListener('click', resetStats);
target.addEventListener('click', handleTargetClick);
mode1Btn.addEventListener('click', () => selectMode(1));
mode2Btn.addEventListener('click', () => selectMode(2));
changeModeBtn.addEventListener('click', changeMode);

function selectMode(mode) {
    testMode = mode;
    modeSelection.style.display = 'none';
    gameArea.style.display = 'flex';
    changeModeBtn.style.display = 'inline-block';

    if (mode === 1) {
        currentModeText.textContent = 'Current Mode: Model 1 (Reaction Time Only)';
        instructionsMode1.style.display = 'block';
        instructionsMode2.style.display = 'none';
    } else {
        currentModeText.textContent = 'Current Mode: Model 2 (Reaction + Movement Time)';
        instructionsMode1.style.display = 'none';
        instructionsMode2.style.display = 'block';
    }

    updateAverage();
}

function changeMode() {
    modeSelection.style.display = 'block';
    gameArea.style.display = 'none';
    changeModeBtn.style.display = 'none';
    currentModeText.textContent = '';
    instructionsMode1.style.display = 'none';
    instructionsMode2.style.display = 'none';
    resetGame();
}

function handleClick(e) {
    if (state === 'idle') {
        startGame();
    } else if (state === 'waiting') {
        tooSoon();
    } else if (state === 'ready') {
        // Store click position for Mode 2
        const rect = gameArea.getBoundingClientRect();
        clickPosition = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
        recordReaction();
    } else if (state === 'result' || state === 'too-soon') {
        resetGame();
    }
}

function startGame() {
    state = 'waiting';
    gameArea.className = 'game-area waiting';
    message.textContent = 'Wait for green...';
    result.textContent = '';

    // Random delay between 1 and 4 seconds
    const delay = Math.random() * 3000 + 1000;

    timeoutId = setTimeout(() => {
        showGreen();
    }, delay);
}

function showGreen() {
    state = 'ready';
    gameArea.className = 'game-area ready';
    message.textContent = 'Click now!';
    startTime = Date.now();
}

function tooSoon() {
    clearTimeout(timeoutId);
    state = 'too-soon';
    gameArea.className = 'game-area too-soon';
    message.textContent = 'Too soon!';
    result.textContent = 'You clicked too early. Click to try again.';
}

function recordReaction() {
    const reactionTime = Date.now() - startTime;
    currentReactionTime = reactionTime;

    if (testMode === 1) {
        // Mode 1: Reaction time only, end test
        state = 'result';
        gameArea.className = 'game-area';
        message.textContent = 'Click to try again';
        result.textContent = `Reaction: ${reactionTime} ms`;

        // Save reaction time
        reactionTimes.mode1.push(reactionTime);
        localStorage.setItem('reactionTimes', JSON.stringify(reactionTimes));

        updateAverage();
        resetBtn.style.display = 'inline-block';
    } else {
        // Mode 2: Continue to movement test
        state = 'reach';
        gameArea.className = 'game-area';
        message.textContent = 'Now reach and click the target!';
        result.textContent = `Reaction: ${reactionTime} ms`;

        // Show target 200px away from click position
        showTarget();
    }
}

function showTarget() {
    const container = document.querySelector('.container');
    const containerRect = container.getBoundingClientRect();
    const gameAreaRect = gameArea.getBoundingClientRect();

    // Calculate position 200px away from click at a random angle
    const distance = 200; // Fixed distance in pixels
    const angle = Math.random() * 2 * Math.PI; // Random angle in radians

    // Calculate target position relative to container
    const gameAreaOffsetX = gameAreaRect.left - containerRect.left;
    const gameAreaOffsetY = gameAreaRect.top - containerRect.top;

    // Calculate initial target position (200px from click)
    let targetX = gameAreaOffsetX + clickPosition.x + distance * Math.cos(angle) - 30; // -30 for centering (half of 60px)
    let targetY = gameAreaOffsetY + clickPosition.y + distance * Math.sin(angle) - 30;

    // Ensure target stays within container bounds
    const maxX = containerRect.width - 60; // 60px is target width
    const maxY = containerRect.height - 60; // 60px is target height

    targetX = Math.max(0, Math.min(targetX, maxX));
    targetY = Math.max(0, Math.min(targetY, maxY));

    target.style.left = `${targetX}px`;
    target.style.top = `${targetY}px`;
    target.style.display = 'block';

    reachStartTime = Date.now();
}

function handleTargetClick(e) {
    e.stopPropagation();
    if (state === 'reach') {
        const movementTime = Date.now() - reachStartTime;
        state = 'result';

        // Hide target
        target.style.display = 'none';

        // Save both times for Mode 2
        reactionTimes.mode2.push(currentReactionTime);
        reachTimes.push(movementTime);
        localStorage.setItem('reactionTimes', JSON.stringify(reactionTimes));
        localStorage.setItem('reachTimes', JSON.stringify(reachTimes));

        message.textContent = 'Click to try again';
        result.textContent = `Reaction: ${currentReactionTime} ms | Movement: ${movementTime} ms`;

        updateAverage();
        resetBtn.style.display = 'inline-block';
    }
}

function updateAverage() {
    let text = '';

    if (testMode === 1 && reactionTimes.mode1.length > 0) {
        const avgReaction = reactionTimes.mode1.reduce((a, b) => a + b, 0) / reactionTimes.mode1.length;
        const bestReaction = Math.min(...reactionTimes.mode1);
        text = `Reaction Time - Avg: ${Math.round(avgReaction)} ms | Best: ${bestReaction} ms | Attempts: ${reactionTimes.mode1.length}`;
    } else if (testMode === 2 && reactionTimes.mode2.length > 0) {
        const avgReaction = reactionTimes.mode2.reduce((a, b) => a + b, 0) / reactionTimes.mode2.length;
        const bestReaction = Math.min(...reactionTimes.mode2);
        text = `Reaction Time - Avg: ${Math.round(avgReaction)} ms | Best: ${bestReaction} ms`;

        if (reachTimes.length > 0) {
            const avgMovement = reachTimes.reduce((a, b) => a + b, 0) / reachTimes.length;
            const bestMovement = Math.min(...reachTimes);
            text += `<br>Movement Time - Avg: ${Math.round(avgMovement)} ms | Best: ${bestMovement} ms`;
        }

        text += ` | Attempts: ${reactionTimes.mode2.length}`;
    }

    average.innerHTML = text;
}

function resetGame() {
    state = 'idle';
    gameArea.className = 'game-area';
    message.textContent = 'Click to start';
    target.style.display = 'none';
}

function resetStats() {
    if (confirm('Are you sure you want to reset all your stats for the current mode?')) {
        if (testMode === 1) {
            reactionTimes.mode1 = [];
        } else if (testMode === 2) {
            reactionTimes.mode2 = [];
            reachTimes = [];
            localStorage.setItem('reachTimes', JSON.stringify(reachTimes));
        }
        localStorage.setItem('reactionTimes', JSON.stringify(reactionTimes));
        average.textContent = '';
        result.textContent = '';
        resetBtn.style.display = 'none';
        resetGame();
    }
}
