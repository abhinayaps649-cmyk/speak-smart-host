/* script.js */

// Global State
const GameState = {
    level: 1,
    xp: 0,
    xpMax: 100,
    timeLimit: 60, // in seconds
    isRecording: false,
    timerInt: null,
    duration: 0,
    badges: {
        first: false,
        fast: false,
        clean: false
    }
};

const TOPICS = [
    "self introduction.",
    "Explain about your favorite food.",
    "explain about your favorite movie.",
    "explain about your favorite book.",
    "explain about your favorite song.",
    "explain about your favorite game.",
    "explain about your favorite sport.",
    "If you had to eat one meal for the rest of your life, what would it be?"
];

// DOM Elements
const DOM = {
    levelText: document.getElementById('levelValue'),
    xpText: document.getElementById('xpText'),
    xpFill: document.getElementById('xpFill'),
    levelSelect: document.getElementById('levelSelector'),
    topicDisplay: document.getElementById('topicDisplay'),
    btnTopic: document.getElementById('btnTopic'),
    btnStart: document.getElementById('btnStart'),
    btnStop: document.getElementById('btnStop'),
    timerText: document.getElementById('timerDisplay'),
    liveIndic: document.getElementById('liveIndicator'),
    valDur: document.getElementById('valDuration'),
    valWpm: document.getElementById('valWpm'),
    valFill: document.getElementById('valFillers'),
    valConfidence: document.getElementById('valConfidence'),
    speechText: document.getElementById('speechText'),
    feedbackBox: document.getElementById('feedbackBox'),
    coachFeedback: document.getElementById('coachFeedback'),
    improvementsList: document.getElementById('improvementsList'),
    badgeFirst: document.getElementById('badge-first'),
    badgeFast: document.getElementById('badge-fast'),
    badgeClean: document.getElementById('badge-clean'),
    toastCon: document.getElementById('toastContainer')
};

let currentTopic = "No topic selected";

// Audio Recording Variables
let mediaRecorder;
let audioChunks = [];

// Events
DOM.btnTopic.addEventListener('click', () => {
    currentTopic = TOPICS[Math.floor(Math.random() * TOPICS.length)];
    DOM.topicDisplay.innerHTML = currentTopic;
    DOM.topicDisplay.style.opacity = 0;
    setTimeout(() => {
        DOM.topicDisplay.style.opacity = 1;
        DOM.topicDisplay.style.transform = 'scale(1.02)';
        setTimeout(() => DOM.topicDisplay.style.transform = 'scale(1)', 200);
    }, 150);
});

DOM.levelSelect.addEventListener('change', (e) => {
    GameState.timeLimit = parseInt(e.target.value) * 60;
    updateTimerUI(GameState.timeLimit);
});

DOM.btnStart.addEventListener('click', startMission);
DOM.btnStop.addEventListener('click', stopMission);

// Core Logic
async function startMission() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        showToast("Microphone not supported by your browser.", "error");
        return;
    }

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];

        mediaRecorder.ondataavailable = event => {
            if (event.data.size > 0) audioChunks.push(event.data);
        };

        mediaRecorder.onstop = processAudio;
        mediaRecorder.start();

        GameState.isRecording = true;
        GameState.duration = 0;

        // UI state
        DOM.btnStart.disabled = true;
        DOM.btnStop.disabled = false;
        DOM.liveIndic.classList.add('active');
        DOM.timerText.classList.add('timer-active');
        DOM.speechText.innerHTML = '<span style="color: #00f0ff;">Recording in progress... Speak clearly!</span>';
        DOM.feedbackBox.style.display = 'none';
        DOM.valDur.innerText = '0.0s';
        DOM.valWpm.innerText = '0';
        DOM.valFill.innerText = '0';
        DOM.valConfidence.innerText = '-';

        let timeLeft = GameState.timeLimit;
        GameState.timerInt = setInterval(() => {
            GameState.duration++;
            timeLeft--;
            DOM.valDur.innerText = GameState.duration + '.0s';
            updateTimerUI(timeLeft);

            if (timeLeft <= 0) stopMission();
        }, 1000);

    } catch (err) {
        console.error("Mic Error:", err);
        showToast("Microphone access denied!", "error");
    }
}

function stopMission() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }

    GameState.isRecording = false;
    if (GameState.timerInt) {
        clearInterval(GameState.timerInt);
        GameState.timerInt = null;
    }

    DOM.btnStart.disabled = false;
    DOM.btnStop.disabled = true;
    DOM.liveIndic.classList.remove('active');
    DOM.timerText.classList.remove('timer-active');

    DOM.speechText.innerHTML = '<span style="color: #ffd700;">Processing audio... sending to AI.</span>';
}

async function processAudio() {
    const webmBlob = new Blob(audioChunks, { type: 'audio/webm' });

    try {
        // Audio Context to decode blob (created on user gesture / recording end)
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const arrayBuffer = await webmBlob.arrayBuffer();
        const decodedAudio = await audioContext.decodeAudioData(arrayBuffer);
        const wavBlob = audioBufferToWav(decodedAudio);

        const formData = new FormData();
        formData.append('audio', wavBlob, 'recording.wav');
        formData.append('topic', currentTopic);
        formData.append('duration', GameState.duration);

        // Call Flask Backend
        const response = await fetch('http://localhost:5000/api/analyze', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) throw new Error("Server Error");

        const result = await response.json();

        handleAnalysisResult(result);

    } catch (err) {
        console.error("Processing Error:", err);
        DOM.speechText.innerHTML = '<span style="color: #ff3333;">Error processing your speech. Is the backend running?</span>';
        showToast("Analysis failed.", "error");
    }
}

function handleAnalysisResult(data) {
    DOM.valWpm.innerText = data.wpm;
    DOM.valFill.innerText = data.fillers;

    if (data.transcript) {
        DOM.speechText.innerHTML = `<span class="final">${data.transcript}</span>`;
    } else {
        DOM.speechText.innerHTML = `<span style="color: #aaa;">(No speech detected)</span>`;
    }

    const ai = data.analysis;
    if (ai) {
        const score = ai.confidence_score || 0;
        animateCounter(DOM.valConfidence, 0, score, 1500);

        // Show Feedback
        DOM.coachFeedback.innerText = ai.feedback || "Good effort.";
        DOM.improvementsList.innerHTML = '';
        if (ai.improvements && Array.isArray(ai.improvements)) {
            ai.improvements.forEach(imp => {
                const li = document.createElement('li');
                li.innerText = imp;
                DOM.improvementsList.appendChild(li);
            });
        }
        DOM.feedbackBox.style.display = 'block';

        // Read Feedback Aloud
        if ('speechSynthesis' in window && ai.feedback) {
            // Cancel any ongoing speech
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(ai.feedback);
            utterance.rate = 1.0;
            utterance.pitch = 1.0;
            // Optionally select a specific voice if available
            const voices = window.speechSynthesis.getVoices();
            const preferredVoice = voices.find(v => v.name.includes('Google') || v.lang === 'en-US');
            if (preferredVoice) utterance.voice = preferredVoice;
            window.speechSynthesis.speak(utterance);
        }

        // Calculate XP based on duration and confidence score
        let xpGained = Math.floor(GameState.duration * 0.5) + Math.floor(score * 0.3);
        if (data.fillers === 0 && GameState.duration > 10) xpGained += 20;

        grantXP(xpGained);
        checkAchievements(score);
    }
}

// XP & Progression
function grantXP(amount) {
    if (amount <= 0) return;
    GameState.xp += amount;
    showToast(`+${amount} XP Gained!`, 'success');

    while (GameState.xp >= GameState.xpMax) {
        GameState.xp -= GameState.xpMax;
        GameState.level++;
        GameState.xpMax = Math.floor(GameState.xpMax * 1.5);
        triggerLevelUp();
    }
    updateHudXP();
}

function updateHudXP() {
    DOM.levelText.innerText = GameState.level;
    DOM.xpText.innerText = `${GameState.xp} / ${GameState.xpMax} XP`;
    const pct = Math.min(100, (GameState.xp / GameState.xpMax) * 100);
    DOM.xpFill.style.width = pct + '%';
}

function triggerLevelUp() {
    showToast(`LEVEL UP! Now Level ${GameState.level}`, 'level-up');
    fireConfetti();
    DOM.levelText.style.animation = 'pop 0.5s';
    setTimeout(() => DOM.levelText.style.animation = 'none', 500);
}

// Achievements
function checkAchievements(confidenceScore) {
    if (!GameState.badges.first && GameState.level >= 1 && confidenceScore > 30) {
        unlockBadge('first');
    }
    if (!GameState.badges.fast && GameState.level >= 2 && confidenceScore > 50) {
        unlockBadge('fast');
    }
    if (!GameState.badges.clean && GameState.level >= 3 && confidenceScore > 75) {
        unlockBadge('clean');
    }
}

function unlockBadge(id) {
    GameState.badges[id] = true;
    let el;
    if (id === 'first') el = DOM.badgeFirst;
    if (id === 'fast') el = DOM.badgeFast;
    if (id === 'clean') el = DOM.badgeClean;

    if (el) {
        el.classList.remove('locked');
        el.classList.add('unlocked');
        showToast('Achievement Unlocked!', 'success');
        fireConfetti(true);
    }
}

// Utils
function updateTimerUI(seconds) {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    DOM.timerText.innerText = `${m}:${s}`;
}

function showToast(msg, type = '') {
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.innerText = msg;
    DOM.toastCon.appendChild(t);

    requestAnimationFrame(() => requestAnimationFrame(() => t.classList.add('show')));

    setTimeout(() => {
        t.classList.remove('show');
        setTimeout(() => t.remove(), 400);
    }, 3500);
}

function fireConfetti(small = false) {
    if (!window.confetti) return;
    if (small) {
        confetti({ particleCount: 40, spread: 60, origin: { y: 0.8 }, colors: ['#00f0ff', '#ffd700'] });
    } else {
        const dur = 3000;
        const end = Date.now() + dur;
        (function frame() {
            confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#00f0ff', '#9d00ff', '#00ff66'] });
            confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#00f0ff', '#9d00ff', '#00ff66'] });
            if (Date.now() < end) requestAnimationFrame(frame);
        }());
    }
}

function animateCounter(el, start, end, duration) {
    let startTime = null;
    const step = (t) => {
        if (!startTime) startTime = t;
        const progress = Math.min((t - startTime) / duration, 1);
        el.innerText = Math.floor(progress * (end - start) + start);
        if (progress < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
}

// Audio Format converter WebM/OGG -> WAV (PCM)
function audioBufferToWav(buffer) {
    let numOfChan = buffer.numberOfChannels,
        length = buffer.length * numOfChan * 2 + 44,
        bufferArr = new ArrayBuffer(length),
        view = new DataView(bufferArr),
        channels = [], i, sample,
        offset = 0,
        pos = 0;

    // write WAVE header
    setUint32(0x46464952);
    setUint32(length - 8);
    setUint32(0x45564157);
    setUint32(0x20746d66);
    setUint32(16);
    setUint16(1);
    setUint16(numOfChan);
    setUint32(buffer.sampleRate);
    setUint32(buffer.sampleRate * 2 * numOfChan);
    setUint16(numOfChan * 2);
    setUint16(16);
    setUint32(0x61746164);
    setUint32(length - pos - 4);

    for (i = 0; i < buffer.numberOfChannels; i++)
        channels.push(buffer.getChannelData(i));

    while (pos < length) {
        for (i = 0; i < numOfChan; i++) {
            sample = Math.max(-1, Math.min(1, channels[i][offset]));
            sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
            view.setInt16(pos, sample, true);
            pos += 2;
        }
        offset++;
    }

    return new Blob([bufferArr], { type: "audio/wav" });

    function setUint16(data) {
        view.setUint16(pos, data, true);
        pos += 2;
    }

    function setUint32(data) {
        view.setUint32(pos, data, true);
        pos += 4;
    }
}

// Audio Format converter WebM/OGG -> WAV (PCM)
function audioBufferToWav(buffer) {
    let numOfChan = buffer.numberOfChannels,
        length = buffer.length * numOfChan * 2 + 44,
        bufferArr = new ArrayBuffer(length),
        view = new DataView(bufferArr),
        channels = [], i, sample,
        offset = 0,
        pos = 0;

    // write WAVE header
    setUint32(0x46464952);
    setUint32(length - 8);
    setUint32(0x45564157);
    setUint32(0x20746d66);
    setUint32(16);
    setUint16(1);
    setUint16(numOfChan);
    setUint32(buffer.sampleRate);
    setUint32(buffer.sampleRate * 2 * numOfChan);
    setUint16(numOfChan * 2);
    setUint16(16);
    setUint32(0x61746164);
    setUint32(length - pos - 4);

    for (i = 0; i < buffer.numberOfChannels; i++)
        channels.push(buffer.getChannelData(i));

    while (pos < length) {
        for (i = 0; i < numOfChan; i++) {
            sample = Math.max(-1, Math.min(1, channels[i][offset]));
            sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
            view.setInt16(pos, sample, true);
            pos += 2;
        }
        offset++;
    }

    return new Blob([bufferArr], { type: "audio/wav" });

    function setUint16(data) {
        view.setUint16(pos, data, true);
        pos += 2;
    }

    function setUint32(data) {
        view.setUint32(pos, data, true);
        pos += 4;
    }
}

// Init
updateTimerUI(GameState.timeLimit);
updateHudXP();
