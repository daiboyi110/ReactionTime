const gameArea = document.getElementById('game-area');
const message = document.getElementById('message');
const result = document.getElementById('result');
const average = document.getElementById('average');
const resetBtn = document.getElementById('reset-btn');

let state = 'idle'; // idle, waiting, ready, result
let startTime;
let timeoutId;
let reactionTimes = [];

// Load saved reaction times from localStorage
if (localStorage.getItem('reactionTimes')) {
    reactionTimes = JSON.parse(localStorage.getItem('reactionTimes'));
    updateAverage();
    resetBtn.style.display = 'block';
}

gameArea.addEventListener('click', handleClick);
resetBtn.addEventListener('click', resetStats);

function handleClick() {
    if (state === 'idle') {
        startGame();
    } else if (state === 'waiting') {
        tooSoon();
    } else if (state === 'ready') {
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
    state = 'result';
    gameArea.className = 'game-area';
    message.textContent = 'Click to try again';
    result.textContent = `${reactionTime} ms`;

    // Save reaction time
    reactionTimes.push(reactionTime);
    localStorage.setItem('reactionTimes', JSON.stringify(reactionTimes));

    updateAverage();
    resetBtn.style.display = 'block';
}

function updateAverage() {
    if (reactionTimes.length > 0) {
        const avg = reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length;
        const best = Math.min(...reactionTimes);
        average.textContent = `Average: ${Math.round(avg)} ms | Best: ${best} ms | Attempts: ${reactionTimes.length}`;
    }
}

function resetGame() {
    state = 'idle';
    gameArea.className = 'game-area';
    message.textContent = 'Click to start';
}

function resetStats() {
    if (confirm('Are you sure you want to reset all your stats?')) {
        reactionTimes = [];
        localStorage.removeItem('reactionTimes');
        average.textContent = '';
        result.textContent = '';
        resetBtn.style.display = 'none';
        resetGame();
    }
}
