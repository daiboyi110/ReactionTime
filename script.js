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
const instructionsMode3 = document.getElementById('instructions-mode3');
const instructionsMode4 = document.getElementById('instructions-mode4');
const mode3Btn = document.getElementById('mode3-btn');
const mode4Btn = document.getElementById('mode4-btn');
const langEnBtn = document.getElementById('lang-en');
const langZhBtn = document.getElementById('lang-zh');

let state = 'idle'; // idle, waiting, ready, reach, result, cycling
let testMode = null; // 1 = reaction only, 2 = reaction + movement, 3 = choice reaction, 4 = go/no-go
let startTime;
let reachStartTime;
let timeoutId;
let colorCycleInterval = null; // For mode 4 color cycling
let reactionTimes = { mode1: [], mode2: [], mode3: [], mode4: [] };
let reachTimes = [];
let currentReactionTime;
let clickPosition = null;
let currentLang = 'en'; // Default language
let currentColor = null; // For mode 3 and 4
let mode3Errors = 0; // Track errors in mode 3
let mode4Errors = 0; // Track errors in mode 4

// Translation data
const translations = {
    en: {
        title: 'Reaction Time Test',
        selectMode: 'Select Test Mode:',
        mode1: 'Model 1: Reaction Time Only',
        mode2: 'Model 2: Reaction + Movement Time',
        mode3: 'Model 3: Choice Reaction Time',
        mode4: 'Model 4: Go/No-Go Reaction Time',
        clickToStart: 'Click to start',
        waitForGreen: 'Wait for green...',
        waitForColor: 'Wait for color...',
        watchColors: 'Watch the colors...',
        clickOnGreen: 'Click ONLY on GREEN!',
        clickNow: 'Click now!',
        clickLeft: 'LEFT click now!',
        clickRight: 'RIGHT click now!',
        tooSoon: 'Too soon!',
        tooSoonMsg: 'You clicked too early. Click to try again.',
        wrongButton: 'Wrong button!',
        wrongButtonMsg: 'You clicked the wrong button. Click to try again.',
        wrongColor: 'Wrong color!',
        wrongColorMsg: 'You should only click on GREEN. Click to try again.',
        clickToTryAgain: 'Click to try again',
        reachTarget: 'Now reach and click the target!',
        currentModeLabel1: 'Current Mode: Model 1 (Reaction Time Only)',
        currentModeLabel2: 'Current Mode: Model 2 (Reaction + Movement Time)',
        currentModeLabel3: 'Current Mode: Model 3 (Choice Reaction Time)',
        currentModeLabel4: 'Current Mode: Model 4 (Go/No-Go Reaction Time)',
        reaction: 'Reaction',
        movement: 'Movement',
        errors: 'Errors',
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
        instMode3Title: 'Model 3: Choice Reaction Time',
        instMode3Step1: 'Click the box to start',
        instMode3Step2: 'Wait for the color to change to either green or yellow',
        instMode3Step3: 'If GREEN: Click with LEFT mouse button as fast as you can',
        instMode3Step4: 'If YELLOW: Click with RIGHT mouse button as fast as you can',
        instMode3Step5: 'Your choice reaction time will be displayed',
        instMode3Step6: 'Incorrect button clicks will be marked as errors',
        instMode4Title: 'Model 4: Go/No-Go Reaction Time',
        instMode4Step1: 'Click the box to start',
        instMode4Step2: 'Colors will continuously change (red, yellow, blue, purple, etc.)',
        instMode4Step3: 'ONLY click when the color turns GREEN',
        instMode4Step4: 'DO NOT click on any other colors',
        instMode4Step5: 'Your reaction time will be displayed',
        instMode4Step6: 'Clicking on wrong colors will be marked as errors',
        avg: 'Avg',
        best: 'Best',
        attempts: 'Attempts'
    },
    zh: {
        title: '反应时间测试',
        selectMode: '选择测试模式：',
        mode1: '模式一：仅反应时间',
        mode2: '模式二：反应时间 + 移动时间',
        mode3: '模式三：选择反应时间',
        mode4: '模式四：Go/No-Go反应时间',
        clickToStart: '点击开始',
        waitForGreen: '等待绿色...',
        waitForColor: '等待颜色...',
        watchColors: '观察颜色变化...',
        clickOnGreen: '只在绿色时点击！',
        clickNow: '现在点击！',
        clickLeft: '左键点击！',
        clickRight: '右键点击！',
        tooSoon: '太早了！',
        tooSoonMsg: '您点击得太早了。点击重试。',
        wrongButton: '错误的按钮！',
        wrongButtonMsg: '您点击了错误的按钮。点击重试。',
        wrongColor: '错误的颜色！',
        wrongColorMsg: '您应该只在绿色时点击。点击重试。',
        clickToTryAgain: '点击重试',
        reachTarget: '现在移动并点击目标！',
        currentModeLabel1: '当前模式：模式一（仅反应时间）',
        currentModeLabel2: '当前模式：模式二（反应时间 + 移动时间）',
        currentModeLabel3: '当前模式：模式三（选择反应时间）',
        currentModeLabel4: '当前模式：模式四（Go/No-Go反应时间）',
        reaction: '反应',
        movement: '移动',
        errors: '错误',
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
        instMode3Title: '模式三：选择反应时间',
        instMode3Step1: '点击方框开始',
        instMode3Step2: '等待颜色变为绿色或黄色',
        instMode3Step3: '如果是绿色：尽快用左键点击',
        instMode3Step4: '如果是黄色：尽快用右键点击',
        instMode3Step5: '将显示您的选择反应时间',
        instMode3Step6: '点击错误的按钮将标记为错误',
        instMode4Title: '模式四：Go/No-Go反应时间',
        instMode4Step1: '点击方框开始',
        instMode4Step2: '颜色将持续变化（红色、黄色、蓝色、紫色等）',
        instMode4Step3: '只在颜色变为绿色时点击',
        instMode4Step4: '不要点击其他任何颜色',
        instMode4Step5: '将显示您的反应时间',
        instMode4Step6: '点击错误颜色将标记为错误',
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
    // Add mode3 and mode4 if they don't exist
    if (!reactionTimes.mode3) {
        reactionTimes.mode3 = [];
    }
    if (!reactionTimes.mode4) {
        reactionTimes.mode4 = [];
    }
}
if (localStorage.getItem('reachTimes')) {
    reachTimes = JSON.parse(localStorage.getItem('reachTimes'));
}
if (localStorage.getItem('mode3Errors')) {
    mode3Errors = parseInt(localStorage.getItem('mode3Errors'));
}
if (localStorage.getItem('mode4Errors')) {
    mode4Errors = parseInt(localStorage.getItem('mode4Errors'));
}
if (localStorage.getItem('language')) {
    currentLang = localStorage.getItem('language');
}

// Event listeners
gameArea.addEventListener('click', handleClick);
gameArea.addEventListener('contextmenu', handleRightClick);
resetBtn.addEventListener('click', resetStats);
target.addEventListener('click', handleTargetClick);
mode1Btn.addEventListener('click', () => selectMode(1));
mode2Btn.addEventListener('click', () => selectMode(2));
mode3Btn.addEventListener('click', () => selectMode(3));
mode4Btn.addEventListener('click', () => selectMode(4));
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
    document.getElementById('mode3-text').textContent = t.mode3;
    document.getElementById('mode4-text').textContent = t.mode4;
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

    document.getElementById('inst-mode3-title').textContent = t.instMode3Title;
    document.getElementById('inst-mode3-step1').textContent = t.instMode3Step1;
    document.getElementById('inst-mode3-step2').textContent = t.instMode3Step2;
    document.getElementById('inst-mode3-step3').textContent = t.instMode3Step3;
    document.getElementById('inst-mode3-step4').textContent = t.instMode3Step4;
    document.getElementById('inst-mode3-step5').textContent = t.instMode3Step5;
    document.getElementById('inst-mode3-step6').textContent = t.instMode3Step6;

    document.getElementById('inst-mode4-title').textContent = t.instMode4Title;
    document.getElementById('inst-mode4-step1').textContent = t.instMode4Step1;
    document.getElementById('inst-mode4-step2').textContent = t.instMode4Step2;
    document.getElementById('inst-mode4-step3').textContent = t.instMode4Step3;
    document.getElementById('inst-mode4-step4').textContent = t.instMode4Step4;
    document.getElementById('inst-mode4-step5').textContent = t.instMode4Step5;
    document.getElementById('inst-mode4-step6').textContent = t.instMode4Step6;

    // Update current mode text if mode is selected
    if (testMode === 1) {
        currentModeText.textContent = t.currentModeLabel1;
    } else if (testMode === 2) {
        currentModeText.textContent = t.currentModeLabel2;
    } else if (testMode === 3) {
        currentModeText.textContent = t.currentModeLabel3;
    } else if (testMode === 4) {
        currentModeText.textContent = t.currentModeLabel4;
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
        instructionsMode3.style.display = 'none';
        instructionsMode4.style.display = 'none';
    } else if (mode === 2) {
        currentModeText.textContent = t.currentModeLabel2;
        instructionsMode1.style.display = 'none';
        instructionsMode2.style.display = 'block';
        instructionsMode3.style.display = 'none';
        instructionsMode4.style.display = 'none';
    } else if (mode === 3) {
        currentModeText.textContent = t.currentModeLabel3;
        instructionsMode1.style.display = 'none';
        instructionsMode2.style.display = 'none';
        instructionsMode3.style.display = 'block';
        instructionsMode4.style.display = 'none';
    } else if (mode === 4) {
        currentModeText.textContent = t.currentModeLabel4;
        instructionsMode1.style.display = 'none';
        instructionsMode2.style.display = 'none';
        instructionsMode3.style.display = 'none';
        instructionsMode4.style.display = 'block';
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
    instructionsMode3.style.display = 'none';
    instructionsMode4.style.display = 'none';
    resetGame();
}

function handleClick(e) {
    if (state === 'idle') {
        startGame();
    } else if (state === 'waiting') {
        tooSoon();
    } else if (state === 'cycling') {
        // Mode 4: Check if clicked on green
        if (currentColor === 'green') {
            // Correct - clicked on green
            clearInterval(colorCycleInterval);
            recordReaction();
        } else {
            // Wrong - clicked on wrong color
            clearInterval(colorCycleInterval);
            wrongColor();
        }
    } else if (state === 'ready') {
        if (testMode === 3) {
            // Mode 3: Check if left click is correct
            if (currentColor === 'green') {
                // Correct - left click for green
                recordReaction();
            } else {
                // Wrong - should have right clicked for yellow
                wrongButton();
            }
        } else {
            // Mode 1 and 2: Store click position for Mode 2
            const rect = gameArea.getBoundingClientRect();
            clickPosition = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
            recordReaction();
        }
    } else if (state === 'result' || state === 'too-soon' || state === 'wrong-button' || state === 'wrong-color') {
        resetGame();
    }
}

function handleRightClick(e) {
    e.preventDefault(); // Prevent context menu

    if (state === 'waiting') {
        tooSoon();
    } else if (state === 'ready' && testMode === 3) {
        // Mode 3: Check if right click is correct
        if (currentColor === 'yellow') {
            // Correct - right click for yellow
            recordReaction();
        } else {
            // Wrong - should have left clicked for green
            wrongButton();
        }
    } else if (state === 'result' || state === 'too-soon' || state === 'wrong-button') {
        resetGame();
    }

    return false;
}

function startGame() {
    const t = translations[currentLang];

    if (testMode === 4) {
        // Mode 4: Start color cycling immediately
        state = 'cycling';
        message.textContent = t.watchColors;
        result.textContent = '';
        startColorCycle();
    } else {
        state = 'waiting';
        gameArea.className = 'game-area waiting';
        message.textContent = testMode === 3 ? t.waitForColor : t.waitForGreen;
        result.textContent = '';

        // Random delay between 1 and 4 seconds
        const delay = Math.random() * 3000 + 1000;

        timeoutId = setTimeout(() => {
            showGreen();
        }, delay);
    }
}

function showGreen() {
    const t = translations[currentLang];
    state = 'ready';

    if (testMode === 3) {
        // Mode 3: Randomly choose green or yellow
        currentColor = Math.random() < 0.5 ? 'green' : 'yellow';
        gameArea.className = currentColor === 'green' ? 'game-area ready' : 'game-area choice-yellow';
        message.textContent = currentColor === 'green' ? t.clickLeft : t.clickRight;
    } else {
        // Mode 1 and 2: Always green
        gameArea.className = 'game-area ready';
        message.textContent = t.clickNow;
    }

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

function wrongButton() {
    const t = translations[currentLang];
    state = 'wrong-button';
    gameArea.className = 'game-area too-soon';
    message.textContent = t.wrongButton;
    result.textContent = t.wrongButtonMsg;

    // Increment error count for Mode 3
    mode3Errors++;
    localStorage.setItem('mode3Errors', mode3Errors.toString());
}

function wrongColor() {
    const t = translations[currentLang];
    state = 'wrong-color';
    gameArea.className = 'game-area too-soon';
    message.textContent = t.wrongColor;
    result.textContent = t.wrongColorMsg;

    // Increment error count for Mode 4
    mode4Errors++;
    localStorage.setItem('mode4Errors', mode4Errors.toString());
}

function startColorCycle() {
    const t = translations[currentLang];
    const colors = ['red', 'yellow', 'blue', 'purple', 'orange', 'pink'];
    let cycleCount = 0;
    const minCycles = 3; // Minimum cycles before green can appear
    const maxCycles = 8; // Maximum cycles before green must appear
    const targetCycle = Math.floor(Math.random() * (maxCycles - minCycles + 1)) + minCycles;

    // Initial random color
    currentColor = colors[Math.floor(Math.random() * colors.length)];
    gameArea.className = `game-area color-${currentColor}`;

    colorCycleInterval = setInterval(() => {
        cycleCount++;

        if (cycleCount >= targetCycle) {
            // Time to show green
            currentColor = 'green';
            gameArea.className = 'game-area ready';
            message.textContent = t.clickOnGreen;
            startTime = Date.now();
            clearInterval(colorCycleInterval);
        } else {
            // Show a random non-green color
            currentColor = colors[Math.floor(Math.random() * colors.length)];
            gameArea.className = `game-area color-${currentColor}`;
        }
    }, 500); // Change color every 500ms
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
    } else if (testMode === 2) {
        // Mode 2: Continue to movement test
        state = 'reach';
        gameArea.className = 'game-area';
        message.textContent = t.reachTarget;
        result.textContent = `${t.reaction}: ${reactionTime} ms`;

        // Show target 200px away from click position
        showTarget();
    } else if (testMode === 3) {
        // Mode 3: Choice reaction time, end test
        state = 'result';
        gameArea.className = 'game-area';
        message.textContent = t.clickToTryAgain;
        result.textContent = `${t.reaction}: ${reactionTime} ms`;

        // Save reaction time
        reactionTimes.mode3.push(reactionTime);
        localStorage.setItem('reactionTimes', JSON.stringify(reactionTimes));

        updateAverage();
        resetBtn.style.display = 'inline-block';
    } else if (testMode === 4) {
        // Mode 4: Go/No-Go reaction time, end test
        state = 'result';
        gameArea.className = 'game-area';
        message.textContent = t.clickToTryAgain;
        result.textContent = `${t.reaction}: ${reactionTime} ms`;

        // Save reaction time
        reactionTimes.mode4.push(reactionTime);
        localStorage.setItem('reactionTimes', JSON.stringify(reactionTimes));

        updateAverage();
        resetBtn.style.display = 'inline-block';
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
    } else if (testMode === 3 && reactionTimes.mode3.length > 0) {
        const avgReaction = reactionTimes.mode3.reduce((a, b) => a + b, 0) / reactionTimes.mode3.length;
        const bestReaction = Math.min(...reactionTimes.mode3);
        text = `${t.reaction} - ${t.avg}: ${Math.round(avgReaction)} ms | ${t.best}: ${bestReaction} ms | ${t.attempts}: ${reactionTimes.mode3.length} | ${t.errors}: ${mode3Errors}`;
    } else if (testMode === 4 && reactionTimes.mode4.length > 0) {
        const avgReaction = reactionTimes.mode4.reduce((a, b) => a + b, 0) / reactionTimes.mode4.length;
        const bestReaction = Math.min(...reactionTimes.mode4);
        text = `${t.reaction} - ${t.avg}: ${Math.round(avgReaction)} ms | ${t.best}: ${bestReaction} ms | ${t.attempts}: ${reactionTimes.mode4.length} | ${t.errors}: ${mode4Errors}`;
    }

    average.innerHTML = text;
}

function resetGame() {
    const t = translations[currentLang];
    state = 'idle';
    gameArea.className = 'game-area';
    message.textContent = t.clickToStart;
    target.style.display = 'none';

    // Clear any active intervals or timeouts
    if (colorCycleInterval) {
        clearInterval(colorCycleInterval);
        colorCycleInterval = null;
    }
    if (timeoutId) {
        clearTimeout(timeoutId);
    }
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
        } else if (testMode === 3) {
            reactionTimes.mode3 = [];
            mode3Errors = 0;
            localStorage.setItem('mode3Errors', '0');
        } else if (testMode === 4) {
            reactionTimes.mode4 = [];
            mode4Errors = 0;
            localStorage.setItem('mode4Errors', '0');
        }
        localStorage.setItem('reactionTimes', JSON.stringify(reactionTimes));
        average.textContent = '';
        result.textContent = '';
        resetBtn.style.display = 'none';
        resetGame();
    }
}
