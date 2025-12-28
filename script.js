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
const langEnBtn = document.getElementById('lang-en');
const langZhBtn = document.getElementById('lang-zh');

let state = 'idle'; // idle, waiting, ready, reach, result
let testMode = null; // 1 = reaction only, 2 = reaction + movement
let startTime;
let reachStartTime;
let timeoutId;
let reactionTimes = { mode1: [], mode2: [] };
let reachTimes = [];
let currentReactionTime;
let clickPosition = null;
let currentLang = 'en'; // Default language

// Translation data
const translations = {
    en: {
        title: 'Reaction Time Test',
        selectMode: 'Select Test Mode:',
        mode1: 'Model 1: Reaction Time Only',
        mode2: 'Model 2: Reaction + Movement Time',
        clickToStart: 'Click to start',
        waitForGreen: 'Wait for green...',
        clickNow: 'Click now!',
        tooSoon: 'Too soon!',
        tooSoonMsg: 'You clicked too early. Click to try again.',
        clickToTryAgain: 'Click to try again',
        reachTarget: 'Now reach and click the target!',
        currentModeLabel1: 'Current Mode: Model 1 (Reaction Time Only)',
        currentModeLabel2: 'Current Mode: Model 2 (Reaction + Movement Time)',
        reaction: 'Reaction',
        movement: 'Movement',
        resetStats: 'Reset Stats',
        changeMode: 'Change Mode',
        resetConfirm: 'Are you sure you want to reset all your stats for the current mode?',
        instructionsTitle: 'How to play:',
        instMode1Title: 'Model 1: Reaction Time Only',
        instMode1Step1: 'Click the box to start',
        instMode1Step2: 'Wait for the color to change to green',
        instMode1Step3: 'Click as fast as you can when it turns green',
        instMode1Step4: 'Your reaction time will be displayed',
        instMode2Title: 'Model 2: Reaction + Movement Time',
        instMode2Step1: 'Click the box to start',
        instMode2Step2: 'Wait for the color to change to green',
        instMode2Step3: 'Click as fast as you can when it turns green',
        instMode2Step4: 'A target will appear 200 pixels away from your click',
        instMode2Step5: 'Reach and click the target as fast as possible',
        instMode2Step6: 'Both reaction and movement times will be displayed',
        avg: 'Avg',
        best: 'Best',
        attempts: 'Attempts'
    },
    zh: {
        title: '反应时间测试',
        selectMode: '选择测试模式：',
        mode1: '模式一：仅反应时间',
        mode2: '模式二：反应时间 + 移动时间',
        clickToStart: '点击开始',
        waitForGreen: '等待绿色...',
        clickNow: '现在点击！',
        tooSoon: '太早了！',
        tooSoonMsg: '您点击得太早了。点击重试。',
        clickToTryAgain: '点击重试',
        reachTarget: '现在移动并点击目标！',
        currentModeLabel1: '当前模式：模式一（仅反应时间）',
        currentModeLabel2: '当前模式：模式二（反应时间 + 移动时间）',
        reaction: '反应',
        movement: '移动',
        resetStats: '重置统计',
        changeMode: '切换模式',
        resetConfirm: '您确定要重置当前模式的所有统计数据吗？',
        instructionsTitle: '如何游戏：',
        instMode1Title: '模式一：仅反应时间',
        instMode1Step1: '点击方框开始',
        instMode1Step2: '等待颜色变为绿色',
        instMode1Step3: '当变成绿色时尽快点击',
        instMode1Step4: '将显示您的反应时间',
        instMode2Title: '模式二：反应时间 + 移动时间',
        instMode2Step1: '点击方框开始',
        instMode2Step2: '等待颜色变为绿色',
        instMode2Step3: '当变成绿色时尽快点击',
        instMode2Step4: '目标将出现在距离您点击位置200像素的地方',
        instMode2Step5: '尽快移动并点击目标',
        instMode2Step6: '将显示反应时间和移动时间',
        avg: '平均',
        best: '最佳',
        attempts: '尝试次数'
    }
};

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
if (localStorage.getItem('language')) {
    currentLang = localStorage.getItem('language');
}

// Event listeners
gameArea.addEventListener('click', handleClick);
resetBtn.addEventListener('click', resetStats);
target.addEventListener('click', handleTargetClick);
mode1Btn.addEventListener('click', () => selectMode(1));
mode2Btn.addEventListener('click', () => selectMode(2));
changeModeBtn.addEventListener('click', changeMode);
langEnBtn.addEventListener('click', () => setLanguage('en'));
langZhBtn.addEventListener('click', () => setLanguage('zh'));

// Initialize language on load
setLanguage(currentLang);

function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('language', lang);

    // Update language button states
    langEnBtn.classList.toggle('active', lang === 'en');
    langZhBtn.classList.toggle('active', lang === 'zh');

    // Update all text content
    updateLanguage();
}

function updateLanguage() {
    const t = translations[currentLang];

    // Update static text
    document.getElementById('title').textContent = t.title;
    document.getElementById('select-mode-text').textContent = t.selectMode;
    document.getElementById('mode1-text').textContent = t.mode1;
    document.getElementById('mode2-text').textContent = t.mode2;
    document.getElementById('reset-btn-text').textContent = t.resetStats;
    document.getElementById('change-mode-btn-text').textContent = t.changeMode;
    document.getElementById('instructions-title').textContent = t.instructionsTitle;

    // Update instructions
    document.getElementById('inst-mode1-title').textContent = t.instMode1Title;
    document.getElementById('inst-mode1-step1').textContent = t.instMode1Step1;
    document.getElementById('inst-mode1-step2').textContent = t.instMode1Step2;
    document.getElementById('inst-mode1-step3').textContent = t.instMode1Step3;
    document.getElementById('inst-mode1-step4').textContent = t.instMode1Step4;

    document.getElementById('inst-mode2-title').textContent = t.instMode2Title;
    document.getElementById('inst-mode2-step1').textContent = t.instMode2Step1;
    document.getElementById('inst-mode2-step2').textContent = t.instMode2Step2;
    document.getElementById('inst-mode2-step3').textContent = t.instMode2Step3;
    document.getElementById('inst-mode2-step4').textContent = t.instMode2Step4;
    document.getElementById('inst-mode2-step5').textContent = t.instMode2Step5;
    document.getElementById('inst-mode2-step6').textContent = t.instMode2Step6;

    // Update current mode text if mode is selected
    if (testMode === 1) {
        currentModeText.textContent = t.currentModeLabel1;
    } else if (testMode === 2) {
        currentModeText.textContent = t.currentModeLabel2;
    }

    // Update message based on current state
    if (state === 'idle') {
        message.textContent = t.clickToStart;
    } else if (state === 'waiting') {
        message.textContent = t.waitForGreen;
    } else if (state === 'ready') {
        message.textContent = t.clickNow;
    } else if (state === 'too-soon') {
        message.textContent = t.tooSoon;
    } else if (state === 'result') {
        message.textContent = t.clickToTryAgain;
    } else if (state === 'reach') {
        message.textContent = t.reachTarget;
    }

    // Update statistics display
    updateAverage();
}

function selectMode(mode) {
    const t = translations[currentLang];
    testMode = mode;
    modeSelection.style.display = 'none';
    gameArea.style.display = 'flex';
    changeModeBtn.style.display = 'inline-block';

    if (mode === 1) {
        currentModeText.textContent = t.currentModeLabel1;
        instructionsMode1.style.display = 'block';
        instructionsMode2.style.display = 'none';
    } else {
        currentModeText.textContent = t.currentModeLabel2;
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
    const t = translations[currentLang];
    state = 'waiting';
    gameArea.className = 'game-area waiting';
    message.textContent = t.waitForGreen;
    result.textContent = '';

    // Random delay between 1 and 4 seconds
    const delay = Math.random() * 3000 + 1000;

    timeoutId = setTimeout(() => {
        showGreen();
    }, delay);
}

function showGreen() {
    const t = translations[currentLang];
    state = 'ready';
    gameArea.className = 'game-area ready';
    message.textContent = t.clickNow;
    startTime = Date.now();
}

function tooSoon() {
    const t = translations[currentLang];
    clearTimeout(timeoutId);
    state = 'too-soon';
    gameArea.className = 'game-area too-soon';
    message.textContent = t.tooSoon;
    result.textContent = t.tooSoonMsg;
}

function recordReaction() {
    const t = translations[currentLang];
    const reactionTime = Date.now() - startTime;
    currentReactionTime = reactionTime;

    if (testMode === 1) {
        // Mode 1: Reaction time only, end test
        state = 'result';
        gameArea.className = 'game-area';
        message.textContent = t.clickToTryAgain;
        result.textContent = `${t.reaction}: ${reactionTime} ms`;

        // Save reaction time
        reactionTimes.mode1.push(reactionTime);
        localStorage.setItem('reactionTimes', JSON.stringify(reactionTimes));

        updateAverage();
        resetBtn.style.display = 'inline-block';
    } else {
        // Mode 2: Continue to movement test
        state = 'reach';
        gameArea.className = 'game-area';
        message.textContent = t.reachTarget;
        result.textContent = `${t.reaction}: ${reactionTime} ms`;

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
    const t = translations[currentLang];
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

        message.textContent = t.clickToTryAgain;
        result.textContent = `${t.reaction}: ${currentReactionTime} ms | ${t.movement}: ${movementTime} ms`;

        updateAverage();
        resetBtn.style.display = 'inline-block';
    }
}

function updateAverage() {
    const t = translations[currentLang];
    let text = '';

    if (testMode === 1 && reactionTimes.mode1.length > 0) {
        const avgReaction = reactionTimes.mode1.reduce((a, b) => a + b, 0) / reactionTimes.mode1.length;
        const bestReaction = Math.min(...reactionTimes.mode1);
        text = `${t.reaction} - ${t.avg}: ${Math.round(avgReaction)} ms | ${t.best}: ${bestReaction} ms | ${t.attempts}: ${reactionTimes.mode1.length}`;
    } else if (testMode === 2 && reactionTimes.mode2.length > 0) {
        const avgReaction = reactionTimes.mode2.reduce((a, b) => a + b, 0) / reactionTimes.mode2.length;
        const bestReaction = Math.min(...reactionTimes.mode2);
        text = `${t.reaction} - ${t.avg}: ${Math.round(avgReaction)} ms | ${t.best}: ${bestReaction} ms`;

        if (reachTimes.length > 0) {
            const avgMovement = reachTimes.reduce((a, b) => a + b, 0) / reachTimes.length;
            const bestMovement = Math.min(...reachTimes);
            text += `<br>${t.movement} - ${t.avg}: ${Math.round(avgMovement)} ms | ${t.best}: ${bestMovement} ms`;
        }

        text += ` | ${t.attempts}: ${reactionTimes.mode2.length}`;
    }

    average.innerHTML = text;
}

function resetGame() {
    const t = translations[currentLang];
    state = 'idle';
    gameArea.className = 'game-area';
    message.textContent = t.clickToStart;
    target.style.display = 'none';
}

function resetStats() {
    const t = translations[currentLang];
    if (confirm(t.resetConfirm)) {
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
