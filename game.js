// ============================================================
// ArtsFisker - Spillmotor
// ============================================================

// --- Canvas roundRect polyfill ---
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
        if (typeof r === 'number') r = [r, r, r, r];
        const [tl, tr, br, bl] = r;
        this.moveTo(x + tl, y);
        this.lineTo(x + w - tr, y);
        this.quadraticCurveTo(x + w, y, x + w, y + tr);
        this.lineTo(x + w, y + h - br);
        this.quadraticCurveTo(x + w, y + h, x + w - br, y + h);
        this.lineTo(x + bl, y + h);
        this.quadraticCurveTo(x, y + h, x, y + h - bl);
        this.lineTo(x, y + tl);
        this.quadraticCurveTo(x, y, x + tl, y);
        this.closePath();
    };
}

// --- Save/Load ---
const Save = {
    data: null,
    load() {
        try {
            const raw = localStorage.getItem('artsfisker_save');
            this.data = raw ? { ...DEFAULT_SAVE, ...JSON.parse(raw) } : { ...DEFAULT_SAVE };
        } catch { this.data = { ...DEFAULT_SAVE }; }
        if (!this.data.highscores) this.data.highscores = { bestDayPoints: [], bestDaySpecies: [], biggestCatch: [] };
        if (!this.data.caughtSpecies) this.data.caughtSpecies = {};
        // Migrate new fields for existing saves
        if (this.data.totalWeight === undefined) this.data.totalWeight = 0;
        if (!this.data.locationHistory) this.data.locationHistory = {};
        if (this.data.soundEnabled === undefined) this.data.soundEnabled = true;
        if (this.data.dailyChallengeCompleted === undefined) this.data.dailyChallengeCompleted = null;
        if (!this.data.avatar) this.data.avatar = { skinTone: 'light', hair: 'brown', hat: 'cap', jacket: 'vest', pants: 'jeans', accessory: 'none' };
        if (this.data.avatar && !this.data.avatar.accessory) this.data.avatar.accessory = 'none';
    },
    save() {
        localStorage.setItem('artsfisker_save', JSON.stringify(this.data));
    }
};

// --- Sound Effects (Web Audio API) ---
const SFX = {
    ctx: null,
    enabled: true,
    initialized: false,

    init() {
        if (this.initialized) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.initialized = true;
            this.enabled = Save.data.soundEnabled;
        } catch (e) { /* no audio support */ }
    },

    toggle() {
        this.enabled = !this.enabled;
        Save.data.soundEnabled = this.enabled;
        Save.save();
        return this.enabled;
    },

    play(name) {
        if (!this.enabled || !this.ctx) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();
        try { this[name](); } catch (e) { /* ignore */ }
    },

    // Helper: create oscillator + gain
    _osc(type, freq, duration, vol = 0.15) {
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = type;
        o.frequency.value = freq;
        g.gain.value = vol;
        o.connect(g);
        g.connect(this.ctx.destination);
        g.gain.setValueAtTime(vol, this.ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
        o.start();
        o.stop(this.ctx.currentTime + duration);
    },

    // Helper: noise burst
    _noise(duration, vol = 0.1) {
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1);
        const src = this.ctx.createBufferSource();
        src.buffer = buffer;
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(vol, this.ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
        const bp = this.ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.value = 800;
        bp.Q.value = 1;
        src.connect(bp);
        bp.connect(g);
        g.connect(this.ctx.destination);
        src.start();
        src.stop(this.ctx.currentTime + duration);
    },

    splash() {
        this._noise(0.3, 0.12);
    },

    biteBeep() {
        const t = this.ctx.currentTime;
        for (let i = 0; i < 3; i++) {
            const o = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            o.type = 'square';
            o.frequency.value = 800;
            o.connect(g);
            g.connect(this.ctx.destination);
            g.gain.setValueAtTime(0.08, t + i * 0.12);
            g.gain.setValueAtTime(0, t + i * 0.12 + 0.06);
            o.start(t + i * 0.12);
            o.stop(t + i * 0.12 + 0.06);
        }
    },

    fishCaught() {
        const notes = [262, 330, 392, 523]; // C-E-G-C
        const t = this.ctx.currentTime;
        notes.forEach((freq, i) => {
            const o = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            o.type = 'sine';
            o.frequency.value = freq;
            o.connect(g);
            g.connect(this.ctx.destination);
            g.gain.setValueAtTime(0.12, t + i * 0.12);
            g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.12 + 0.2);
            o.start(t + i * 0.12);
            o.stop(t + i * 0.12 + 0.2);
        });
    },

    medalFanfare() {
        const notes = [523, 659, 784, 880, 1047]; // C5-E5-G5-A5-C6
        const t = this.ctx.currentTime;
        notes.forEach((freq, i) => {
            const o = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            o.type = 'sine';
            o.frequency.value = freq;
            o.connect(g);
            g.connect(this.ctx.destination);
            g.gain.setValueAtTime(0.1, t + i * 0.15);
            g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.15 + 0.25);
            o.start(t + i * 0.15);
            o.stop(t + i * 0.15 + 0.25);
        });
    },

    lineSnap() {
        this._noise(0.15, 0.15);
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(600, this.ctx.currentTime);
        o.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.3);
        o.connect(g);
        g.connect(this.ctx.destination);
        g.gain.setValueAtTime(0.1, this.ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
        o.start();
        o.stop(this.ctx.currentTime + 0.3);
    },

    coinDing() {
        this._osc('sine', 1200, 0.15, 0.1);
    },

    castWhoosh() {
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(400, this.ctx.currentTime);
        o.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.25);
        o.connect(g);
        g.connect(this.ctx.destination);
        g.gain.setValueAtTime(0.08, this.ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);
        o.start();
        o.stop(this.ctx.currentTime + 0.25);
    },

    sadTrombone() {
        const notes = [233, 220, 208, 196]; // Bb-A-Ab-G
        const t = this.ctx.currentTime;
        notes.forEach((freq, i) => {
            const o = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            o.type = 'sawtooth';
            o.frequency.value = freq;
            o.connect(g);
            g.connect(this.ctx.destination);
            g.gain.setValueAtTime(0.06, t + i * 0.15);
            g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.15 + 0.2);
            o.start(t + i * 0.15);
            o.stop(t + i * 0.15 + 0.2);
        });
    },

    purchaseDing() {
        const t = this.ctx.currentTime;
        this._osc('sine', 880, 0.12, 0.1);
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = 'sine';
        o.frequency.value = 1100;
        o.connect(g);
        g.connect(this.ctx.destination);
        g.gain.setValueAtTime(0.1, t + 0.1);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
        o.start(t + 0.1);
        o.stop(t + 0.25);
    },

    uiClick() {
        this._osc('sine', 600, 0.06, 0.06);
    },

    knotStep() {
        this._osc('sine', 700, 0.08, 0.1);
    },

    knotComplete() {
        const notes = [523, 659, 784, 1047]; // C5-E5-G5-C6
        const t = this.ctx.currentTime;
        notes.forEach((freq, i) => {
            const o = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            o.type = 'sine';
            o.frequency.value = freq;
            o.connect(g);
            g.connect(this.ctx.destination);
            g.gain.setValueAtTime(0.1, t + i * 0.1);
            g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.1 + 0.2);
            o.start(t + i * 0.1);
            o.stop(t + i * 0.1 + 0.2);
        });
    }
};

// --- Knot-Tying Mini-Game ---
const KnotGame = {
    active: false,
    canvas: null,
    ctx: null,
    step: 0,          // 0-3 (4 steps)
    totalSteps: 4,
    stepNames: ['Løkke', 'Omvikling', 'Tråding', 'Stramming'],
    markerPos: 0,      // 0-1 oscillation position
    markerDir: 1,
    markerSpeed: 0,    // increases per step
    sweetSpotCenter: 0.5,
    sweetSpotWidth: 0.2,
    stepResults: [],    // accuracy per step (0-1)
    animFrame: null,
    lastTime: 0,
    showingResult: false,
    resultTimer: 0,
    finalScore: 0,

    start() {
        this.canvas = document.getElementById('knot-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.step = 0;
        this.stepResults = [];
        this.markerPos = 0;
        this.markerDir = 1;
        this.markerSpeed = 0.8; // base speed (units per second)
        this.sweetSpotCenter = 0.4 + Math.random() * 0.2; // vary the target slightly
        this.sweetSpotWidth = 0.2;
        this.active = true;
        this.showingResult = false;
        this.resultTimer = 0;
        this.finalScore = 0;
        this.lastTime = performance.now();

        document.getElementById('knot-prompt').textContent = `Steg 1/4: ${this.stepNames[0]} — Trykk MELLOMROM i grønn sone!`;
        document.getElementById('knot-result').textContent = '';
        document.getElementById('knot-skip').style.display = '';

        UI.showOverlay('overlay-knot');
        this.loop();
    },

    loop() {
        if (!this.active) return;
        const now = performance.now();
        const dt = (now - this.lastTime) / 1000;
        this.lastTime = now;

        if (this.showingResult) {
            this.resultTimer -= dt;
            if (this.resultTimer <= 0) {
                this.finish();
                return;
            }
        } else {
            this.update(dt);
        }
        this.render();
        this.animFrame = requestAnimationFrame(() => this.loop());
    },

    update(dt) {
        // Speed increases each step
        const speed = this.markerSpeed + this.step * 0.35;
        this.markerPos += this.markerDir * speed * dt;
        if (this.markerPos >= 1) { this.markerPos = 1; this.markerDir = -1; }
        if (this.markerPos <= 0) { this.markerPos = 0; this.markerDir = 1; }
    },

    handleInput() {
        if (!this.active || this.showingResult) return;
        if (this.step >= this.totalSteps) return;

        // Calculate accuracy: distance from sweet spot center, normalized
        const dist = Math.abs(this.markerPos - this.sweetSpotCenter);
        const halfWidth = this.sweetSpotWidth / 2;
        let accuracy;
        if (dist <= halfWidth) {
            accuracy = 1 - (dist / halfWidth) * 0.3; // 0.7-1.0 in green zone
        } else {
            accuracy = Math.max(0, 0.7 - (dist - halfWidth) * 1.4); // falls off outside
        }

        this.stepResults.push(accuracy);
        SFX.play('knotStep');

        this.step++;
        // Randomize sweet spot slightly for next step
        this.sweetSpotCenter = 0.35 + Math.random() * 0.3;

        if (this.step >= this.totalSteps) {
            this.calculateScore();
        } else {
            document.getElementById('knot-prompt').textContent =
                `Steg ${this.step + 1}/4: ${this.stepNames[this.step]} — Trykk MELLOMROM i grønn sone!`;
        }
    },

    calculateScore() {
        const sum = this.stepResults.reduce((a, b) => a + b, 0);
        // Each step: accuracy 0-1 maps to 5-25 points
        this.finalScore = Math.round(this.stepResults.reduce((total, acc) => total + 5 + acc * 20, 0));
        this.finalScore = Math.min(100, Math.max(0, this.finalScore));

        let tier, color;
        if (this.finalScore >= 80) { tier = 'Perfekt knute!'; color = '#FFD700'; }
        else if (this.finalScore >= 50) { tier = 'God knute'; color = '#C0C0C0'; }
        else { tier = 'Svak knute'; color = '#E74C3C'; }

        document.getElementById('knot-prompt').textContent = '';
        document.getElementById('knot-result').innerHTML = `<span style="color:${color}">${tier}</span> — ${this.finalScore}%`;
        document.getElementById('knot-skip').style.display = 'none';

        SFX.play('knotComplete');

        this.showingResult = true;
        this.resultTimer = 1.5;
    },

    skip() {
        if (!this.active || this.showingResult) return;
        this.stepResults = [0.5, 0.5, 0.5, 0.5];
        this.step = this.totalSteps;
        this.finalScore = 50;

        document.getElementById('knot-prompt').textContent = '';
        document.getElementById('knot-result').innerHTML = `<span style="color:#C0C0C0">God knute</span> — 50%`;
        document.getElementById('knot-skip').style.display = 'none';

        this.showingResult = true;
        this.resultTimer = 1.0;
    },

    finish() {
        this.active = false;
        if (this.animFrame) cancelAnimationFrame(this.animFrame);
        UI.hideOverlay('overlay-knot');
        Game.knotQuality = this.finalScore;
        Game.startFishingDay();
    },

    render() {
        const c = this.canvas;
        const ctx = this.ctx;
        const W = c.width;
        const H = c.height;

        ctx.clearRect(0, 0, W, H);

        // Background
        ctx.fillStyle = '#1A1A1A';
        ctx.fillRect(0, 0, W, H);

        // Draw rope/knot illustration (top half)
        this.drawRope(ctx, W, H);

        // Meter bar (bottom section)
        if (!this.showingResult && this.step < this.totalSteps) {
            const barX = 40;
            const barY = H - 60;
            const barW = W - 80;
            const barH = 20;

            // Bar background
            ctx.fillStyle = '#333';
            ctx.beginPath();
            ctx.roundRect(barX, barY, barW, barH, 4);
            ctx.fill();

            // Sweet spot (green zone)
            const ssLeft = barX + (this.sweetSpotCenter - this.sweetSpotWidth / 2) * barW;
            const ssWidth = this.sweetSpotWidth * barW;
            ctx.fillStyle = 'rgba(39, 174, 96, 0.5)';
            ctx.beginPath();
            ctx.roundRect(ssLeft, barY, ssWidth, barH, 4);
            ctx.fill();

            // Marker
            const markerX = barX + this.markerPos * barW;
            ctx.fillStyle = '#FFDE17';
            ctx.beginPath();
            ctx.arc(markerX, barY + barH / 2, 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#1A1A1A';
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        // Step indicators (dots at bottom)
        const dotY = H - 20;
        for (let i = 0; i < this.totalSteps; i++) {
            const dotX = W / 2 + (i - 1.5) * 30;
            ctx.beginPath();
            ctx.arc(dotX, dotY, 8, 0, Math.PI * 2);
            if (i < this.stepResults.length) {
                // Completed step — color by accuracy
                const acc = this.stepResults[i];
                if (acc >= 0.7) ctx.fillStyle = '#27AE60';
                else if (acc >= 0.4) ctx.fillStyle = '#F39C12';
                else ctx.fillStyle = '#E74C3C';
            } else if (i === this.step && !this.showingResult) {
                ctx.fillStyle = '#FFDE17';
            } else {
                ctx.fillStyle = '#444';
            }
            ctx.fill();

            // Step label
            ctx.fillStyle = '#999';
            ctx.font = '10px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(this.stepNames[i], dotX, dotY + 20);
        }
    },

    drawRope(ctx, W, H) {
        const ropeY = 90;
        const completed = this.stepResults.length;

        ctx.strokeStyle = '#8B6914';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';

        // Base rope line
        ctx.beginPath();
        ctx.moveTo(40, ropeY);
        ctx.lineTo(W - 40, ropeY);
        ctx.stroke();

        // Progressive knot illustration
        const cx = W / 2;

        if (completed >= 1) {
            // Step 1: Loop
            ctx.strokeStyle = '#B8860B';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(cx - 30, ropeY);
            ctx.bezierCurveTo(cx - 30, ropeY - 35, cx + 30, ropeY - 35, cx + 30, ropeY);
            ctx.stroke();
        }

        if (completed >= 2) {
            // Step 2: Wrap
            ctx.strokeStyle = '#DAA520';
            ctx.lineWidth = 3.5;
            ctx.beginPath();
            ctx.moveTo(cx + 20, ropeY + 5);
            ctx.bezierCurveTo(cx + 10, ropeY - 20, cx - 10, ropeY - 20, cx - 20, ropeY + 5);
            ctx.bezierCurveTo(cx - 10, ropeY + 20, cx + 10, ropeY + 20, cx + 20, ropeY + 5);
            ctx.stroke();
        }

        if (completed >= 3) {
            // Step 3: Thread through
            ctx.strokeStyle = '#CD853F';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(cx, ropeY - 30);
            ctx.bezierCurveTo(cx + 5, ropeY - 10, cx - 5, ropeY + 10, cx, ropeY + 25);
            ctx.stroke();
        }

        if (completed >= 4) {
            // Step 4: Tightened knot (filled center)
            ctx.fillStyle = 'rgba(218, 165, 32, 0.6)';
            ctx.beginPath();
            ctx.arc(cx, ropeY, 12, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#B8860B';
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        // Step label above rope
        if (!this.showingResult && completed < this.totalSteps) {
            ctx.fillStyle = '#FFDE17';
            ctx.font = 'bold 14px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(this.stepNames[completed], cx, ropeY + 55);
        }
    }
};

// --- Daily Challenge ---
const DailyChallenge = {
    current: null,

    seededRandom(seed) {
        let h = 0;
        for (let i = 0; i < seed.length; i++) {
            h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
        }
        return function() {
            h = (h * 16807 + 0) % 2147483647;
            return (h & 0x7fffffff) / 2147483647;
        };
    },

    generate() {
        const today = new Date().toISOString().slice(0, 10);
        const rng = this.seededRandom(today);

        const typeIdx = Math.floor(rng() * CHALLENGE_TYPES.length);
        const type = CHALLENGE_TYPES[typeIdx];
        let challenge = { type: type.id, date: today, progress: 0, target: 0, reward: 0, description: '' };

        switch (type.id) {
            case 'catch_at_location': {
                const locIdx = Math.floor(rng() * LOCATIONS.length);
                const loc = LOCATIONS[locIdx];
                const n = 2 + Math.floor(rng() * 4);
                challenge.target = n;
                challenge.locationId = loc.id;
                challenge.description = type.template.replace('{n}', n).replace('{location}', loc.name);
                challenge.reward = type.rewardBase + n * 10;
                break;
            }
            case 'gold_medal': {
                const easyFish = FISH_SPECIES.filter(f => f.difficulty <= 6);
                const fishIdx = Math.floor(rng() * easyFish.length);
                const fish = easyFish[fishIdx];
                challenge.target = 1;
                challenge.fishId = fish.id;
                challenge.description = type.template.replace('{species}', fish.name);
                challenge.reward = type.rewardBase + fish.difficulty * 15;
                break;
            }
            case 'total_weight': {
                const kg = 5 + Math.floor(rng() * 20);
                challenge.target = kg * 1000;
                challenge.description = type.template.replace('{weight}', kg);
                challenge.reward = type.rewardBase + kg * 5;
                break;
            }
            case 'catch_n_fish': {
                const n = 3 + Math.floor(rng() * 6);
                challenge.target = n;
                challenge.description = type.template.replace('{n}', n);
                challenge.reward = type.rewardBase + n * 10;
                break;
            }
        }

        this.current = challenge;
        return challenge;
    },

    isCompleted() {
        const today = new Date().toISOString().slice(0, 10);
        return Save.data.dailyChallengeCompleted === today;
    },

    checkProgress(dayCatches, selectedLocation) {
        if (!this.current || this.isCompleted()) return false;
        const c = this.current;

        switch (c.type) {
            case 'catch_at_location':
                c.progress = dayCatches.filter(ct => ct.fish.locations.includes(c.locationId) &&
                    selectedLocation === c.locationId).length;
                break;
            case 'gold_medal':
                c.progress = dayCatches.some(ct => ct.fish.id === c.fishId &&
                    ct.weight >= ct.fish.goldLimit) ? 1 : 0;
                break;
            case 'total_weight':
                c.progress = dayCatches.reduce((sum, ct) => sum + ct.weight, 0);
                break;
            case 'catch_n_fish':
                c.progress = dayCatches.length;
                break;
        }

        if (c.progress >= c.target) {
            this.complete();
            return true;
        }
        return false;
    },

    complete() {
        if (!this.current || this.isCompleted()) return;
        const today = new Date().toISOString().slice(0, 10);
        Save.data.dailyChallengeCompleted = today;
        Save.data.coins += this.current.reward;
        Save.data.totalCoins += this.current.reward;
        Save.save();
    }
};

// --- UI Controller ---
const UI = {
    showScreen(id) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.querySelectorAll('.overlay').forEach(o => o.classList.remove('active'));
        const el = document.getElementById(id);
        if (el) el.classList.add('active');

        if (id === 'screen-collection') this.renderCollection();
        if (id === 'screen-highscores') this.showHighscoreTab('points');
        if (id === 'screen-shop') this.renderShop();
        if (id === 'screen-stats') this.renderStats();
        SFX.init();
    },

    showOverlay(id) {
        const el = document.getElementById(id);
        if (el) el.classList.add('active');
    },

    hideOverlay(id) {
        const el = document.getElementById(id);
        if (el) el.classList.remove('active');
    },

    setPrompt(text, visible = true) {
        const el = document.getElementById('fishing-prompt');
        el.textContent = text;
        el.classList.toggle('visible', visible);
    },

    renderSetup() {
        // Steder
        const locGrid = document.getElementById('location-options');
        locGrid.innerHTML = LOCATIONS.map(loc => {
            const unlocked = Save.data.unlockedLocations.includes(loc.id);
            const canUnlock = !unlocked && Save.data.coins >= (loc.unlockCost || 0) &&
                Object.keys(Save.data.caughtSpecies).length >= (loc.unlockSpecies || 0);
            return `<div class="option-card ${!unlocked ? 'locked' : ''}" data-type="location" data-id="${loc.id}"
                onclick="UI.selectOption('location', '${loc.id}', ${unlocked}, ${!unlocked && canUnlock})">
                <div class="option-icon">${loc.icon}</div>
                <div class="option-name">${loc.name}</div>
                <div class="option-sub">${loc.type === 'fw' ? 'Ferskvann' : 'Saltvann'}</div>
                ${!unlocked ? `<div class="option-cost">${loc.unlockCost} mynter + ${loc.unlockSpecies} arter</div>` : ''}
            </div>`;
        }).join('');

        // Agn
        const baitGrid = document.getElementById('bait-options');
        baitGrid.innerHTML = BAITS.map(b => {
            const unlocked = Save.data.unlockedBaits.includes(b.id);
            const canBuy = !unlocked && Save.data.coins >= b.cost;
            return `<div class="option-card ${!unlocked ? 'locked' : ''}" data-type="bait" data-id="${b.id}"
                onclick="UI.selectOption('bait', '${b.id}', ${unlocked}, ${canBuy})">
                <div class="option-icon">${b.icon}</div>
                <div class="option-name">${b.name}</div>
                <div class="option-sub">${b.description}</div>
                ${!unlocked ? `<div class="option-cost">${b.cost} mynter</div>` : ''}
            </div>`;
        }).join('');

        // Tid
        const timeGrid = document.getElementById('time-options');
        timeGrid.innerHTML = TIME_OF_DAY.map(t => {
            return `<div class="option-card" data-type="time" data-id="${t.id}"
                onclick="UI.selectOption('time', '${t.id}', true, false)">
                <div class="option-icon">${t.icon}</div>
                <div class="option-name">${t.name}</div>
                <div class="option-sub">${t.description}</div>
            </div>`;
        }).join('');

        // Stats
        document.getElementById('player-coins').textContent = Save.data.coins;
        document.getElementById('player-species').textContent = Object.keys(Save.data.caughtSpecies).length;

        // Show current equipment summary
        const gear = Game.getGear();
        const eqSummary = document.getElementById('equipment-summary');
        if (eqSummary) {
            eqSummary.innerHTML =
                `${EQUIPMENT.rod.icon} ${gear.rod.name} &nbsp; ` +
                `${EQUIPMENT.line.icon} ${gear.line.name} &nbsp; ` +
                `${EQUIPMENT.reel.icon} ${gear.reel.name} &nbsp; ` +
                `${EQUIPMENT.hook.icon} ${gear.hook.name}` +
                (gear.finder.biteBonus > 0 ? ` &nbsp; ${EQUIPMENT.finder.icon} ${gear.finder.name}` : '');
        }

        // Auto-select defaults
        Game.selectedLocation = Save.data.unlockedLocations[0];
        Game.selectedBait = Save.data.unlockedBaits[0];
        Game.selectedTime = 'dawn';
        this.highlightOption('location', Game.selectedLocation);
        this.highlightOption('bait', Game.selectedBait);
        this.highlightOption('time', Game.selectedTime);
        this.updateSetupInfo();
    },

    selectOption(type, id, unlocked, canUnlockOrBuy) {
        if (!unlocked && !canUnlockOrBuy) return;

        if (!unlocked && canUnlockOrBuy) {
            // Unlock/buy
            if (type === 'location') {
                const loc = LOCATIONS.find(l => l.id === id);
                if (Save.data.coins >= loc.unlockCost) {
                    Save.data.coins -= loc.unlockCost;
                    Save.data.unlockedLocations.push(id);
                    Save.save();
                    this.renderSetup();
                }
            } else if (type === 'bait') {
                const bait = BAITS.find(b => b.id === id);
                if (Save.data.coins >= bait.cost) {
                    Save.data.coins -= bait.cost;
                    Save.data.unlockedBaits.push(id);
                    Save.save();
                    this.renderSetup();
                }
            }
            return;
        }

        if (type === 'location') Game.selectedLocation = id;
        if (type === 'bait') Game.selectedBait = id;
        if (type === 'time') Game.selectedTime = id;

        this.highlightOption(type, id);
        this.updateSetupInfo();
    },

    highlightOption(type, id) {
        document.querySelectorAll(`.option-card[data-type="${type}"]`).forEach(c => c.classList.remove('selected'));
        const card = document.querySelector(`.option-card[data-type="${type}"][data-id="${id}"]`);
        if (card && !card.classList.contains('locked')) card.classList.add('selected');
    },

    updateSetupInfo() {
        const loc = LOCATIONS.find(l => l.id === Game.selectedLocation);
        const bait = BAITS.find(b => b.id === Game.selectedBait);
        const time = TIME_OF_DAY.find(t => t.id === Game.selectedTime);
        if (!loc || !bait || !time) return;

        const fishHere = FISH_SPECIES.filter(f => f.locations.includes(loc.id));
        const eff = bait.effectiveness[loc.type] * 100;

        document.getElementById('setup-info-text').innerHTML =
            `<strong>${loc.name}</strong> — ${loc.description}<br>` +
            `<span style="color:var(--text-muted)">${fishHere.length} arter tilgjengelig. ` +
            `Agn-effektivitet: <span style="color:${eff > 60 ? 'var(--success)' : eff > 30 ? 'var(--warning)' : 'var(--danger)'}">${eff.toFixed(0)}%</span>. ` +
            `${time.description}</span>`;
    },

    renderCollection(filter = 'all') {
        const grid = document.getElementById('collection-grid');
        const caught = Save.data.caughtSpecies;
        const caughtCount = Object.keys(caught).length;
        const total = FISH_SPECIES.length;

        document.getElementById('collection-stats').innerHTML =
            `<strong>${caughtCount}</strong> / ${total} arter oppdaget &nbsp;|&nbsp; ` +
            `Totalt fanget: <strong>${Save.data.totalCatches}</strong> &nbsp;|&nbsp; ` +
            `Totale poeng: <strong>${Save.data.totalPoints.toFixed(2)}</strong>`;

        let species = [...FISH_SPECIES];
        if (filter === 'caught') species = species.filter(f => caught[f.id]);
        if (filter === 'uncaught') species = species.filter(f => !caught[f.id]);
        if (filter === 'fw') species = species.filter(f => f.type === 'fw');
        if (filter === 'sw') species = species.filter(f => f.type === 'sw');

        grid.innerHTML = species.map(fish => {
            const data = caught[fish.id];
            const isCaught = !!data;
            const medal = data ? this.getMedalForFish(fish, data.bestWeight) : '';
            const formatW = (g) => g >= 1000 ? (g / 1000).toFixed(2) + ' kg' : g.toFixed(0) + ' g';

            return `<div class="collection-card ${isCaught ? '' : 'uncaught'}" ${isCaught ? `onclick="UI.showFishDetail('${fish.id}')" style="cursor:pointer"` : ''}>
                <div class="fish-preview"><canvas data-fish-id="${fish.id}" width="180" height="60"></canvas></div>
                <div class="fish-name">${isCaught ? fish.name : '???'}</div>
                <div class="fish-name-en">${isCaught ? (fish.type === 'fw' ? 'Ferskvann' : 'Saltvann') : 'Uoppdaget'}</div>
                <div class="fish-type">${fish.locations.map(l => LOCATIONS.find(lo => lo.id === l).name).join(', ')}</div>
                ${isCaught ? `
                    <div class="fish-best">Beste: <strong>${formatW(data.bestWeight)}</strong> — <strong>${data.bestPoints.toFixed(2)} poeng</strong></div>
                    <div class="fish-count">Fanget ${data.count}x. Rekord: ${formatW(fish.recordWeight)}</div>
                    ${medal ? `<div class="fish-medal">${medal}</div>` : ''}
                ` : `<div class="fish-best">Rekord: ${formatW(fish.recordWeight)}</div>`}
            </div>`;
        }).join('');

        // Draw fish on collection cards
        requestAnimationFrame(() => {
            grid.querySelectorAll('canvas[data-fish-id]').forEach(canvas => {
                const fish = FISH_SPECIES.find(f => f.id === canvas.dataset.fishId);
                if (fish) FishRenderer.draw(canvas.getContext('2d'), fish, canvas.width, canvas.height);
            });
        });
    },

    filterCollection(filter, btn) {
        document.querySelectorAll('.collection-filters .btn-filter').forEach(b => b.classList.remove('active'));
        if (btn) btn.classList.add('active');
        this.renderCollection(filter);
    },

    getMedalForFish(fish, weightInGrams) {
        if (fish.goldLimit && weightInGrams >= fish.goldLimit) return '🥇';
        if (fish.silverLimit && weightInGrams >= fish.silverLimit) return '🥈';
        if (fish.bronzeLimit && weightInGrams >= fish.bronzeLimit) return '🥉';
        return '';
    },

    getMedalName(fish, weightInGrams) {
        if (fish.goldLimit && weightInGrams >= fish.goldLimit) return 'Gull';
        if (fish.silverLimit && weightInGrams >= fish.silverLimit) return 'Sølv';
        if (fish.bronzeLimit && weightInGrams >= fish.bronzeLimit) return 'Bronse';
        return '';
    },

    showHighscoreTab(tab, btn) {
        document.querySelectorAll('.highscore-tabs .btn-filter').forEach(b => b.classList.remove('active'));
        if (btn) btn.classList.add('active');
        else document.querySelector('.highscore-tabs .btn-filter')?.classList.add('active');

        const list = document.getElementById('highscore-list');
        const hs = Save.data.highscores;

        const formatW = (g) => g >= 1000 ? (g / 1000).toFixed(2) + ' kg' : g.toFixed(0) + ' g';
        let items = [];
        if (tab === 'points') {
            items = (hs.bestDayPoints || []).slice(0, 10).map((entry, i) => ({
                rank: i + 1,
                value: entry.points.toFixed(2) + ' poeng',
                label: `${entry.location} — ${entry.catches} fangster`
            }));
        } else if (tab === 'species') {
            items = (hs.bestDaySpecies || []).slice(0, 10).map((entry, i) => ({
                rank: i + 1,
                value: entry.species + ' arter',
                label: `${entry.location} — ${entry.catches} fangster`
            }));
        } else if (tab === 'biggest') {
            items = (hs.biggestCatch || []).slice(0, 10).map((entry, i) => ({
                rank: i + 1,
                value: formatW(entry.weight),
                label: `${entry.name} — ${entry.points.toFixed(2)} poeng`
            }));
        }

        if (items.length === 0) {
            list.innerHTML = '<div class="highscore-empty">Ingen rekorder ennå. Dra ut og fisk!</div>';
            return;
        }

        list.innerHTML = items.map(it => `
            <div class="highscore-item">
                <div class="highscore-rank ${it.rank <= 3 ? 'rank-' + it.rank : ''}">#${it.rank}</div>
                <div class="highscore-detail">
                    <div class="highscore-value">${it.value}</div>
                    <div class="label">${it.label}</div>
                </div>
            </div>
        `).join('');
    },

    showGuideTab(tabId, btn) {
        document.querySelectorAll('.guide-tabs .btn-filter').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.guide-tab').forEach(t => t.classList.remove('active'));
        if (btn) btn.classList.add('active');
        const tab = document.getElementById('guide-' + tabId);
        if (tab) tab.classList.add('active');
    },

    renderShop() {
        const grid = document.getElementById('shop-grid');
        const eq = Save.data.equipment || { rod: 0, line: 0, reel: 0, hook: 0, finder: 0 };
        document.getElementById('shop-coins').textContent = Save.data.coins;

        let html = '';
        for (const [key, cat] of Object.entries(EQUIPMENT)) {
            const currentTier = eq[key] || 0;
            const nextTier = currentTier + 1;
            const current = cat.tiers[currentTier];
            const next = nextTier < cat.tiers.length ? cat.tiers[nextTier] : null;
            const canBuy = next && Save.data.coins >= next.cost;
            const maxed = !next;

            html += `<div class="shop-category">
                <div class="shop-cat-header">
                    <span class="shop-cat-icon">${cat.icon}</span>
                    <div class="shop-cat-info">
                        <div class="shop-cat-name">${cat.name}</div>
                        <div class="shop-cat-desc">${cat.description}</div>
                    </div>
                </div>
                <div class="shop-tiers">
                    ${cat.tiers.map((tier, i) => {
                        const owned = i <= currentTier;
                        const isNext = i === nextTier;
                        const affordable = isNext && canBuy;
                        return `<div class="shop-tier ${owned ? 'owned' : ''} ${isNext ? 'next' : ''} ${affordable ? 'affordable' : ''}">
                            <div class="shop-tier-name">${tier.name}</div>
                            <div class="shop-tier-stat">${this.getStatLabel(key, tier)}</div>
                            ${owned ? '<div class="shop-tier-badge">Eid</div>' :
                              isNext ? `<button class="btn btn-small ${affordable ? 'btn-primary' : 'btn-secondary'}"
                                onclick="UI.buyEquipment('${key}', ${i})" ${!affordable ? 'disabled' : ''}>
                                ${tier.cost} mynter</button>` :
                              `<div class="shop-tier-cost">${tier.cost} mynter</div>`}
                        </div>`;
                    }).join('')}
                </div>
            </div>`;
        }
        grid.innerHTML = html;
    },

    getStatLabel(key, tier) {
        switch (key) {
            case 'rod': return `Fart: ${(tier.reelSpeed * 100).toFixed(0)}%`;
            case 'line': return `Tåler: ${(tier.snapThreshold * 100).toFixed(0)}% | Sone: ${((tier.greenEnd - tier.greenStart) * 100).toFixed(0)}%`;
            case 'reel': return `Avkjøling: ${(tier.tensionDecay * 100).toFixed(0)}%`;
            case 'hook': return `Vindu: ${(tier.biteWindow / 1000).toFixed(1)}s | Feste: ${((1 - tier.escapeThreshold / 0.08) * 100).toFixed(0)}%`;
            case 'finder': return tier.biteBonus > 0 ? `Napp +${(tier.biteBonus * 100).toFixed(0)}%` : 'Ingen bonus';
            default: return '';
        }
    },

    renderStats() {
        const s = Save.data;
        const caughtIds = Object.keys(s.caughtSpecies);
        const totalSpecies = FISH_SPECIES.length;
        const avgPoints = s.totalCatches > 0 ? (s.totalPoints / s.totalCatches).toFixed(2) : '0';

        // Favorite location
        let favLoc = '—';
        if (s.locationHistory) {
            let maxVisits = 0;
            for (const [locId, count] of Object.entries(s.locationHistory)) {
                if (count > maxVisits) {
                    maxVisits = count;
                    const loc = LOCATIONS.find(l => l.id === locId);
                    favLoc = loc ? loc.name : locId;
                }
            }
        }

        // Best catch
        let bestCatch = '—';
        if (s.highscores.biggestCatch && s.highscores.biggestCatch.length > 0) {
            const bc = s.highscores.biggestCatch[0];
            const w = bc.weight >= 1000 ? (bc.weight / 1000).toFixed(2) + ' kg' : bc.weight.toFixed(0) + ' g';
            bestCatch = `${bc.name} (${w})`;
        }

        // Medal count
        let gold = 0, silver = 0, bronze = 0;
        for (const fishId of caughtIds) {
            const fish = FISH_SPECIES.find(f => f.id === fishId);
            const data = s.caughtSpecies[fishId];
            if (!fish || !data) continue;
            if (data.bestWeight >= fish.goldLimit) gold++;
            else if (data.bestWeight >= fish.silverLimit) silver++;
            else if (data.bestWeight >= fish.bronzeLimit) bronze++;
        }

        const formatW = (g) => g >= 1000 ? (g / 1000).toFixed(2) + ' kg' : g.toFixed(0) + ' g';

        const container = document.getElementById('stats-content');
        container.innerHTML = `
            <div class="stats-grid">
                <div class="summary-stat"><div class="summary-stat-value">${s.daysPlayed}</div><div class="summary-stat-label">Dager fisket</div></div>
                <div class="summary-stat"><div class="summary-stat-value">${s.totalCatches}</div><div class="summary-stat-label">Totale fangster</div></div>
                <div class="summary-stat"><div class="summary-stat-value">${s.totalPoints.toFixed(1)}</div><div class="summary-stat-label">Totale poeng</div></div>
                <div class="summary-stat"><div class="summary-stat-value">${s.totalCoins}</div><div class="summary-stat-label">Mynter tjent</div></div>
                <div class="summary-stat"><div class="summary-stat-value">${avgPoints}</div><div class="summary-stat-label">Snitt poeng/fangst</div></div>
                <div class="summary-stat"><div class="summary-stat-value">${favLoc}</div><div class="summary-stat-label">Favorittsted</div></div>
                <div class="summary-stat"><div class="summary-stat-value">${bestCatch}</div><div class="summary-stat-label">Beste fangst</div></div>
                <div class="summary-stat"><div class="summary-stat-value">${formatW(s.totalWeight)}</div><div class="summary-stat-label">Total vekt</div></div>
                <div class="summary-stat"><div class="summary-stat-value">${caughtIds.length} / ${totalSpecies}</div><div class="summary-stat-label">Unike arter</div></div>
                <div class="summary-stat">
                    <div class="summary-stat-value">🥇${gold} 🥈${silver} 🥉${bronze}</div>
                    <div class="summary-stat-label">Medaljer</div>
                </div>
            </div>
        `;
    },

    showFishDetail(fishId) {
        const fish = FISH_SPECIES.find(f => f.id === fishId);
        if (!fish) return;
        const data = Save.data.caughtSpecies[fishId];
        const formatW = (g) => g >= 1000 ? (g / 1000).toFixed(2) + ' kg' : g.toFixed(0) + ' g';

        // Draw large fish
        const fishCanvas = document.getElementById('detail-fish-canvas');
        if (fishCanvas) {
            fishCanvas.width = 400;
            fishCanvas.height = 200;
            FishRenderer.draw(fishCanvas.getContext('2d'), fish, 400, 200, 1.5);
        }

        document.getElementById('detail-fish-name').textContent = fish.name;
        document.getElementById('detail-fish-type').textContent = fish.type === 'fw' ? 'Ferskvann' : 'Saltvann';

        // Stats
        const statsEl = document.getElementById('detail-stats');
        if (data) {
            const firstDate = new Date(data.firstCaught).toLocaleDateString('no-NO');
            statsEl.innerHTML = `
                <div class="catch-stat"><span class="catch-label">Beste vekt</span><span class="catch-value">${formatW(data.bestWeight)}</span></div>
                <div class="catch-stat"><span class="catch-label">Beste lengde</span><span class="catch-value">${data.bestLength.toFixed(1)} cm</span></div>
                <div class="catch-stat"><span class="catch-label">Beste poeng</span><span class="catch-value highlight">${data.bestPoints.toFixed(2)}</span></div>
                <div class="catch-stat"><span class="catch-label">Antall fanget</span><span class="catch-value">${data.count}</span></div>
                <div class="catch-stat"><span class="catch-label">Første fangst</span><span class="catch-value">${firstDate}</span></div>
            `;
        } else {
            statsEl.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:10px;">Ikke fanget ennå</p>';
        }

        // Medal progress bar
        const medalBar = document.getElementById('detail-medal-bar');
        const bestW = data ? data.bestWeight : 0;
        const maxLimit = fish.goldLimit;
        const pct = Math.min(100, (bestW / maxLimit) * 100);
        const bronzePct = (fish.bronzeLimit / maxLimit) * 100;
        const silverPct = (fish.silverLimit / maxLimit) * 100;
        medalBar.innerHTML = `
            <div class="medal-progress-bar">
                <div class="medal-progress-fill" style="width:${pct}%"></div>
                <div class="medal-marker bronze" style="left:${bronzePct}%">🥉</div>
                <div class="medal-marker silver" style="left:${silverPct}%">🥈</div>
                <div class="medal-marker gold" style="left:100%">🥇</div>
            </div>
            <div class="medal-limits">
                <span>${formatW(fish.bronzeLimit)}</span>
                <span>${formatW(fish.silverLimit)}</span>
                <span>${formatW(fish.goldLimit)}</span>
            </div>
        `;

        // Locations
        const locsEl = document.getElementById('detail-locations');
        locsEl.textContent = fish.locations.map(l => {
            const loc = LOCATIONS.find(lo => lo.id === l);
            return loc ? `${loc.icon} ${loc.name}` : l;
        }).join(', ');

        // Baits that attract this fish
        const baitsEl = document.getElementById('detail-baits');
        const attracting = BAITS.filter(b => b.attracts.includes(fish.id));
        baitsEl.textContent = attracting.length > 0
            ? attracting.map(b => `${b.icon} ${b.name}`).join(', ')
            : 'Ingen spesielt agn';

        // Difficulty
        const diffEl = document.getElementById('detail-difficulty');
        diffEl.innerHTML = '';
        for (let i = 1; i <= 10; i++) {
            const dot = document.createElement('span');
            dot.className = 'diff-dot' + (i <= fish.difficulty ? ' active' : '');
            diffEl.appendChild(dot);
        }

        UI.showOverlay('overlay-fishdetail');
        SFX.play('uiClick');
    },

    updateSoundButton() {
        const btn = document.getElementById('btn-sound');
        if (btn) btn.textContent = SFX.enabled ? '🔊 Lyd på' : '🔇 Lyd av';
        const hudBtn = document.getElementById('hud-sound');
        if (hudBtn) hudBtn.textContent = SFX.enabled ? '🔊' : '🔇';
    },

    buyEquipment(key, tierIndex) {
        const cat = EQUIPMENT[key];
        if (!cat) return;
        const tier = cat.tiers[tierIndex];
        if (!tier) return;
        const eq = Save.data.equipment;
        if (tierIndex !== (eq[key] || 0) + 1) return; // Must buy in order
        if (Save.data.coins < tier.cost) return;

        Save.data.coins -= tier.cost;
        eq[key] = tierIndex;
        Save.save();
        SFX.play('purchaseDing');
        this.renderShop();
    }
};

// --- Fish Renderer (Canvas) ---
const FishRenderer = {
    draw(ctx, fish, w, h, scale = 1) {
        ctx.clearRect(0, 0, w, h);
        ctx.save();
        const cx = w / 2, cy = h / 2;
        const size = Math.min(w, h) * 0.35 * scale;

        switch (fish.bodyShape) {
            case 'shark': this.drawShark(ctx, cx, cy, size, fish); break;
            case 'flat': this.drawFlatfish(ctx, cx, cy, size, fish); break;
            case 'eel': this.drawEel(ctx, cx, cy, size, fish); break;
            case 'pike': this.drawPike(ctx, cx, cy, size, fish); break;
            case 'sleek': this.drawSleek(ctx, cx, cy, size, fish); break;
            case 'deep': this.drawDeep(ctx, cx, cy, size, fish); break;
            default: this.drawDefault(ctx, cx, cy, size, fish);
        }
        ctx.restore();
    },

    drawDefault(ctx, cx, cy, s, fish) {
        // Standard fish body
        ctx.fillStyle = fish.color;
        ctx.beginPath();
        ctx.ellipse(cx, cy, s * 1.6, s * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();

        // Tail
        ctx.beginPath();
        ctx.moveTo(cx - s * 1.5, cy);
        ctx.lineTo(cx - s * 2.2, cy - s * 0.6);
        ctx.lineTo(cx - s * 2.2, cy + s * 0.6);
        ctx.closePath();
        ctx.fill();

        // Dorsal fin
        ctx.fillStyle = fish.stripeColor || fish.color;
        ctx.beginPath();
        ctx.moveTo(cx - s * 0.3, cy - s * 0.65);
        ctx.quadraticCurveTo(cx + s * 0.2, cy - s * 1.2, cx + s * 0.8, cy - s * 0.65);
        ctx.closePath();
        ctx.fill();

        // Stripes
        if (fish.hasStripes) {
            ctx.strokeStyle = fish.stripeColor;
            ctx.lineWidth = 2;
            for (let i = -2; i <= 2; i++) {
                ctx.beginPath();
                ctx.moveTo(cx + i * s * 0.3, cy - s * 0.5);
                ctx.lineTo(cx + i * s * 0.3, cy + s * 0.5);
                ctx.stroke();
            }
        }

        // Spots
        if (fish.hasSpots) {
            ctx.fillStyle = fish.stripeColor;
            for (let i = 0; i < 8; i++) {
                const x = cx + (Math.random() - 0.3) * s * 2;
                const y = cy + (Math.random() - 0.5) * s * 0.8;
                ctx.beginPath();
                ctx.arc(x, y, s * 0.08, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Eye
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(cx + s * 1.1, cy - s * 0.15, s * 0.18, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#111';
        ctx.beginPath();
        ctx.arc(cx + s * 1.15, cy - s * 0.15, s * 0.1, 0, Math.PI * 2);
        ctx.fill();
    },

    drawPike(ctx, cx, cy, s, fish) {
        ctx.fillStyle = fish.color;
        ctx.beginPath();
        ctx.moveTo(cx + s * 2.2, cy);
        ctx.quadraticCurveTo(cx + s * 0.5, cy - s * 0.55, cx - s * 1.5, cy - s * 0.45);
        ctx.lineTo(cx - s * 2, cy - s * 0.7);
        ctx.lineTo(cx - s * 1.8, cy);
        ctx.lineTo(cx - s * 2, cy + s * 0.7);
        ctx.lineTo(cx - s * 1.5, cy + s * 0.45);
        ctx.quadraticCurveTo(cx + s * 0.5, cy + s * 0.55, cx + s * 2.2, cy);
        ctx.fill();

        // Spots
        ctx.fillStyle = fish.stripeColor;
        for (let i = 0; i < 12; i++) {
            const x = cx + (Math.random() - 0.3) * s * 2.5;
            const y = cy + (Math.random() - 0.5) * s * 0.6;
            ctx.beginPath();
            ctx.arc(x, y, s * 0.06, 0, Math.PI * 2);
            ctx.fill();
        }

        // Eye
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(cx + s * 1.6, cy - s * 0.1, s * 0.15, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#111';
        ctx.beginPath();
        ctx.arc(cx + s * 1.63, cy - s * 0.1, s * 0.08, 0, Math.PI * 2);
        ctx.fill();
    },

    drawShark(ctx, cx, cy, s, fish) {
        ctx.fillStyle = fish.color;
        ctx.beginPath();
        ctx.moveTo(cx + s * 2, cy);
        ctx.quadraticCurveTo(cx + s, cy - s * 0.5, cx, cy - s * 0.35);
        ctx.lineTo(cx - s, cy - s * 0.3);
        ctx.lineTo(cx - s * 1.8, cy - s * 0.5);
        ctx.lineTo(cx - s * 1.6, cy);
        ctx.lineTo(cx - s * 1.8, cy + s * 0.5);
        ctx.lineTo(cx - s, cy + s * 0.3);
        ctx.quadraticCurveTo(cx + s, cy + s * 0.5, cx + s * 2, cy);
        ctx.fill();

        // Dorsal fin
        ctx.beginPath();
        ctx.moveTo(cx + s * 0.2, cy - s * 0.35);
        ctx.lineTo(cx + s * 0.5, cy - s * 1.1);
        ctx.lineTo(cx + s * 0.9, cy - s * 0.3);
        ctx.closePath();
        ctx.fill();

        // Belly
        ctx.fillStyle = fish.stripeColor;
        ctx.beginPath();
        ctx.ellipse(cx, cy + s * 0.15, s * 1.4, s * 0.2, 0, 0, Math.PI);
        ctx.fill();

        // Eye
        ctx.fillStyle = '#111';
        ctx.beginPath();
        ctx.arc(cx + s * 1.4, cy - s * 0.1, s * 0.1, 0, Math.PI * 2);
        ctx.fill();
    },

    drawFlatfish(ctx, cx, cy, s, fish) {
        ctx.fillStyle = fish.color;
        ctx.beginPath();
        ctx.ellipse(cx, cy, s * 1.6, s * 1.0, 0, 0, Math.PI * 2);
        ctx.fill();

        // Edge fin
        ctx.strokeStyle = fish.stripeColor;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(cx, cy, s * 1.6, s * 1.0, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Spots
        if (fish.hasSpots) {
            ctx.fillStyle = fish.stripeColor;
            for (let i = 0; i < 6; i++) {
                const angle = Math.random() * Math.PI * 2;
                const r = Math.random() * s * 0.8;
                ctx.beginPath();
                ctx.arc(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r, s * 0.12, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Eyes
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(cx + s * 0.3, cy - s * 0.15, s * 0.16, 0, Math.PI * 2);
        ctx.fill();
        ctx.arc(cx + s * 0.6, cy - s * 0.08, s * 0.14, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#111';
        ctx.beginPath();
        ctx.arc(cx + s * 0.33, cy - s * 0.15, s * 0.08, 0, Math.PI * 2);
        ctx.fill();
        ctx.arc(cx + s * 0.63, cy - s * 0.08, s * 0.07, 0, Math.PI * 2);
        ctx.fill();
    },

    drawEel(ctx, cx, cy, s, fish) {
        ctx.fillStyle = fish.color;
        ctx.beginPath();
        ctx.moveTo(cx + s * 2, cy);
        for (let i = 0; i <= 20; i++) {
            const t = i / 20;
            const x = cx + s * 2 - t * s * 4;
            const y = cy + Math.sin(t * Math.PI * 3) * s * 0.25;
            const w = s * 0.25 * (1 - t * 0.7);
            if (i === 0) { ctx.moveTo(x, y - w); }
            ctx.lineTo(x, y - w);
        }
        for (let i = 20; i >= 0; i--) {
            const t = i / 20;
            const x = cx + s * 2 - t * s * 4;
            const y = cy + Math.sin(t * Math.PI * 3) * s * 0.25;
            const w = s * 0.25 * (1 - t * 0.7);
            ctx.lineTo(x, y + w);
        }
        ctx.closePath();
        ctx.fill();

        // Eye
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(cx + s * 1.7, cy - s * 0.05, s * 0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#111';
        ctx.beginPath();
        ctx.arc(cx + s * 1.72, cy - s * 0.05, s * 0.05, 0, Math.PI * 2);
        ctx.fill();
    },

    drawSleek(ctx, cx, cy, s, fish) {
        ctx.fillStyle = fish.color;
        ctx.beginPath();
        ctx.moveTo(cx + s * 2, cy);
        ctx.quadraticCurveTo(cx + s, cy - s * 0.45, cx - s * 0.5, cy - s * 0.35);
        ctx.lineTo(cx - s * 1.8, cy - s * 0.15);
        ctx.lineTo(cx - s * 2.2, cy - s * 0.5);
        ctx.lineTo(cx - s * 2, cy);
        ctx.lineTo(cx - s * 2.2, cy + s * 0.5);
        ctx.lineTo(cx - s * 1.8, cy + s * 0.15);
        ctx.lineTo(cx - s * 0.5, cy + s * 0.35);
        ctx.quadraticCurveTo(cx + s, cy + s * 0.45, cx + s * 2, cy);
        ctx.fill();

        // Stripes
        if (fish.hasStripes) {
            ctx.strokeStyle = fish.stripeColor;
            ctx.lineWidth = 2;
            for (let i = 0; i < 6; i++) {
                const x = cx - s + i * s * 0.5;
                ctx.beginPath();
                ctx.moveTo(x, cy - s * 0.25);
                ctx.quadraticCurveTo(x + s * 0.15, cy, x, cy + s * 0.25);
                ctx.stroke();
            }
        }

        // Eye
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(cx + s * 1.4, cy - s * 0.08, s * 0.12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#111';
        ctx.beginPath();
        ctx.arc(cx + s * 1.43, cy - s * 0.08, s * 0.06, 0, Math.PI * 2);
        ctx.fill();
    },

    drawDeep(ctx, cx, cy, s, fish) {
        // Tall/deep bodied fish like bream
        ctx.fillStyle = fish.color;
        ctx.beginPath();
        ctx.ellipse(cx, cy, s * 1.3, s * 1.0, 0, 0, Math.PI * 2);
        ctx.fill();

        // Tail
        ctx.beginPath();
        ctx.moveTo(cx - s * 1.2, cy);
        ctx.lineTo(cx - s * 2, cy - s * 0.7);
        ctx.lineTo(cx - s * 2, cy + s * 0.7);
        ctx.closePath();
        ctx.fill();

        // Fin
        ctx.fillStyle = fish.stripeColor;
        ctx.beginPath();
        ctx.moveTo(cx, cy - s * 0.95);
        ctx.quadraticCurveTo(cx + s * 0.5, cy - s * 1.3, cx + s, cy - s * 0.9);
        ctx.closePath();
        ctx.fill();

        // Eye
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(cx + s * 0.7, cy - s * 0.2, s * 0.18, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#111';
        ctx.beginPath();
        ctx.arc(cx + s * 0.73, cy - s * 0.2, s * 0.1, 0, Math.PI * 2);
        ctx.fill();
    }
};

// --- Scene Renderer ---
const Scene = {
    canvas: null,
    ctx: null,
    width: 900,
    height: 550,
    time: 0,
    particles: [],

    init() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        window.addEventListener('resize', () => this.resize());
    },

    resize() {
        const maxW = Math.min(900, window.innerWidth);
        const ratio = 550 / 900;
        this.canvas.width = maxW;
        this.canvas.height = maxW * ratio;
        this.width = this.canvas.width;
        this.height = this.canvas.height;
    },

    render(state) {
        const ctx = this.ctx;
        const w = this.width;
        const h = this.height;
        this.time += 0.016;

        const loc = LOCATIONS.find(l => l.id === Game.selectedLocation) || LOCATIONS[0];
        const timeOfDay = TIME_OF_DAY.find(t => t.id === Game.selectedTime) || TIME_OF_DAY[0];
        const waterLine = h * 0.42;

        // Sky
        this.drawSky(ctx, w, h, waterLine, loc, timeOfDay);

        // Mountains/trees
        if (loc.mountains) this.drawMountains(ctx, w, waterLine);
        if (loc.treeLine) this.drawTrees(ctx, w, waterLine);

        // Water
        this.drawWater(ctx, w, h, waterLine, loc);

        // Weather effects
        const weather = Game.currentWeather;
        if (weather) {
            if (weather.visual === 'rain') this.drawRain(ctx, w, h);
            else if (weather.visual === 'fog') this.drawFog(ctx, w, h, waterLine);
            else if (weather.visual === 'storm') {
                this.drawHeavyRain(ctx, w, h);
                this.drawLightning(ctx, w, h);
            }
        }

        // Shoreline and avatar
        this.drawShoreline(ctx, w, h, waterLine, loc, timeOfDay);
        this.drawAvatar(ctx, w, h, waterLine);

        // Game elements based on state
        if (state.phase === 'idle') {
            this.drawRodIdle(ctx, w, h, waterLine);
        } else if (state.phase === 'casting') {
            this.drawPowerMeter(ctx, w, h, state.power);
            this.drawRodCasting(ctx, w, h, waterLine, state.power);
        } else if (state.phase === 'waiting') {
            this.drawRodCast(ctx, w, h, waterLine, state.castDistance);
            this.drawBobber(ctx, w, h, waterLine, state.castDistance, false);
            this.drawLine(ctx, w, h, waterLine, state.castDistance);
        } else if (state.phase === 'bite') {
            this.drawRodCast(ctx, w, h, waterLine, state.castDistance);
            this.drawBobber(ctx, w, h, waterLine, state.castDistance, true);
            this.drawLine(ctx, w, h, waterLine, state.castDistance);
            this.drawBiteAlert(ctx, w, h);
        } else if (state.phase === 'fighting') {
            this.drawRodFighting(ctx, w, h, waterLine, state.fishProgress);
            this.drawFishFight(ctx, w, h, waterLine, state);
            this.drawTensionMeter(ctx, w, h, state.tension, state.reeling);
            this.drawProgressBar(ctx, w, h, state.fishProgress);
        } else if (state.phase === 'catchAnim') {
            this.drawRodIdle(ctx, w, h, waterLine);
            this.drawCatchAnimation(ctx, w, h, waterLine, state.catchAnimProgress, state.activeFish);
        }

        // Particles
        this.updateParticles(ctx);
    },

    drawSky(ctx, w, h, wl, loc, tod) {
        const grad = ctx.createLinearGradient(0, 0, 0, wl);
        let topColor = loc.skyColor;
        let botColor = '#DDE8F0';

        if (tod.id === 'dawn') { topColor = '#FF9A76'; botColor = '#FFC3A0'; }
        else if (tod.id === 'dusk') { topColor = '#D4556B'; botColor = '#FF8C42'; }
        else if (tod.id === 'night') { topColor = '#0C1445'; botColor = '#1B2A5E'; }

        grad.addColorStop(0, topColor);
        grad.addColorStop(1, botColor);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, wl);

        // Clouds (not at night)
        if (tod.id !== 'night') {
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            for (let i = 0; i < 4; i++) {
                const x = ((this.time * 8 + i * 250) % (w + 200)) - 100;
                const y = 30 + i * 35;
                this.drawCloud(ctx, x, y, 40 + i * 10);
            }
        } else {
            // Stars
            ctx.fillStyle = 'rgba(255,255,255,0.6)';
            for (let i = 0; i < 30; i++) {
                const x = (i * 137.5) % w;
                const y = (i * 73.1) % (wl * 0.7);
                const brightness = 0.3 + 0.7 * Math.sin(this.time * 2 + i);
                ctx.globalAlpha = brightness;
                ctx.fillRect(x, y, 2, 2);
            }
            ctx.globalAlpha = 1;
        }
    },

    drawCloud(ctx, x, y, s) {
        ctx.beginPath();
        ctx.arc(x, y, s * 0.5, 0, Math.PI * 2);
        ctx.arc(x + s * 0.4, y - s * 0.2, s * 0.4, 0, Math.PI * 2);
        ctx.arc(x + s * 0.8, y, s * 0.45, 0, Math.PI * 2);
        ctx.arc(x + s * 0.4, y + s * 0.1, s * 0.35, 0, Math.PI * 2);
        ctx.fill();
    },

    drawMountains(ctx, w, wl) {
        ctx.fillStyle = '#3A506B';
        ctx.beginPath();
        ctx.moveTo(0, wl);
        ctx.lineTo(0, wl * 0.5);
        ctx.lineTo(w * 0.15, wl * 0.2);
        ctx.lineTo(w * 0.3, wl * 0.55);
        ctx.lineTo(w * 0.45, wl * 0.15);
        ctx.lineTo(w * 0.6, wl * 0.5);
        ctx.lineTo(w * 0.75, wl * 0.25);
        ctx.lineTo(w * 0.9, wl * 0.6);
        ctx.lineTo(w, wl * 0.35);
        ctx.lineTo(w, wl);
        ctx.fill();

        // Snow caps
        ctx.fillStyle = '#E8E8E8';
        ctx.beginPath();
        ctx.moveTo(w * 0.45, wl * 0.15);
        ctx.lineTo(w * 0.42, wl * 0.25);
        ctx.lineTo(w * 0.48, wl * 0.25);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(w * 0.15, wl * 0.2);
        ctx.lineTo(w * 0.12, wl * 0.3);
        ctx.lineTo(w * 0.18, wl * 0.3);
        ctx.fill();
    },

    drawTrees(ctx, w, wl) {
        ctx.fillStyle = '#2D5016';
        for (let i = 0; i < 20; i++) {
            const x = i * (w / 20) + 10;
            const h = 20 + Math.sin(i * 1.5) * 12;
            ctx.beginPath();
            ctx.moveTo(x, wl);
            ctx.lineTo(x - 8, wl);
            ctx.lineTo(x - 4, wl - h);
            ctx.lineTo(x, wl - h - 8);
            ctx.lineTo(x + 4, wl - h);
            ctx.lineTo(x + 8, wl);
            ctx.fill();
        }
    },

    drawWater(ctx, w, h, wl, loc) {
        // Water gradient
        const grad = ctx.createLinearGradient(0, wl, 0, h);
        grad.addColorStop(0, loc.waterColor);
        grad.addColorStop(1, loc.waterDeepColor);
        ctx.fillStyle = grad;
        ctx.fillRect(0, wl, w, h - wl);

        // Waves
        ctx.strokeStyle = 'rgba(255,255,255,0.12)';
        ctx.lineWidth = 1.5;
        for (let layer = 0; layer < 3; layer++) {
            ctx.beginPath();
            const y = wl + layer * 25 + 10;
            for (let x = 0; x < w; x += 3) {
                const wave = Math.sin(x * 0.02 + this.time * (1.5 - layer * 0.3) + layer * 2) * (4 - layer);
                if (x === 0) ctx.moveTo(x, y + wave);
                else ctx.lineTo(x, y + wave);
            }
            ctx.stroke();
        }

        // Currents for rivers
        if (loc.hasCurrents) {
            ctx.strokeStyle = 'rgba(255,255,255,0.08)';
            ctx.lineWidth = 2;
            for (let i = 0; i < 5; i++) {
                const y = wl + 30 + i * 30;
                const offset = (this.time * 40 + i * 60) % (w + 100) - 50;
                ctx.beginPath();
                ctx.moveTo(offset, y);
                ctx.lineTo(offset + 40, y + Math.sin(this.time + i) * 3);
                ctx.stroke();
            }
        }
    },

    drawShoreline(ctx, w, h, wl, loc, tod) {
        // Earth/ground on the left side where the fisherman stands
        // Slopes from bottom-left up to the waterline, creating a natural bank

        const bankRight = w * 0.22; // how far the shore extends right
        const bankTop = wl - 8;     // shore starts just above waterline

        // Ground color based on time of day
        let groundColor = '#5A4A32';
        let groundDark = '#3E3222';
        let grassColor = '#4A6B2A';
        if (tod.id === 'night') {
            groundColor = '#2E2518';
            groundDark = '#1E1810';
            grassColor = '#2A3D16';
        } else if (tod.id === 'dusk') {
            groundColor = '#4A3A28';
            groundDark = '#352A1C';
            grassColor = '#3D5522';
        }

        // Main shore shape — curves from bottom-left to waterline
        ctx.fillStyle = groundColor;
        ctx.beginPath();
        ctx.moveTo(0, h);                          // bottom-left
        ctx.lineTo(0, bankTop);                     // up the left edge
        ctx.bezierCurveTo(
            bankRight * 0.3, bankTop - 4,           // slight rise
            bankRight * 0.7, bankTop + 2,           // gentle curve
            bankRight, wl + 15                      // meets water at an angle
        );
        ctx.bezierCurveTo(
            bankRight + w * 0.04, wl + 30,          // continues sloping into water
            bankRight + w * 0.06, h * 0.7,
            w * 0.05, h                             // bottom edge
        );
        ctx.closePath();
        ctx.fill();

        // Darker edge along the waterline (wet dirt)
        ctx.fillStyle = groundDark;
        ctx.beginPath();
        ctx.moveTo(0, wl + 2);
        ctx.bezierCurveTo(
            bankRight * 0.4, wl,
            bankRight * 0.8, wl + 8,
            bankRight, wl + 15
        );
        ctx.bezierCurveTo(
            bankRight + w * 0.03, wl + 25,
            bankRight + w * 0.04, wl + 35,
            w * 0.04, h * 0.72
        );
        ctx.lineTo(0, h * 0.72);
        ctx.closePath();
        ctx.fill();

        // Grass tufts along the top edge
        ctx.fillStyle = grassColor;
        for (let gx = 2; gx < bankRight - 5; gx += 8 + Math.sin(gx) * 3) {
            const gy = bankTop - 2 + Math.sin(gx * 0.5) * 3;
            ctx.beginPath();
            ctx.moveTo(gx, gy);
            ctx.lineTo(gx - 3, gy - 7 - Math.random() * 4);
            ctx.lineTo(gx + 1, gy - 3);
            ctx.lineTo(gx + 4, gy - 8 - Math.random() * 3);
            ctx.lineTo(gx + 6, gy);
            ctx.closePath();
            ctx.fill();
        }

        // Small pebbles/rocks near waterline
        ctx.fillStyle = '#7A7060';
        const pebbles = [
            [bankRight * 0.6, wl + 4, 3],
            [bankRight * 0.8, wl + 10, 2.5],
            [bankRight * 0.4, wl + 1, 2],
            [bankRight * 0.9, wl + 16, 2],
            [bankRight * 0.2, wl + 2, 1.5]
        ];
        pebbles.forEach(([px, py, pr]) => {
            ctx.beginPath();
            ctx.ellipse(px, py, pr * 1.3, pr, 0.3, 0, Math.PI * 2);
            ctx.fill();
        });
    },

    drawAvatar(ctx, w, h, wl) {
        const avatarH = Math.min(h * 0.35, 100);
        const avatarW = avatarH * 0.6;
        const ax = w * 0.08;
        const ay = h * 0.92 - avatarH;

        // Cache avatar rendering
        const avKey = JSON.stringify(Save.data.avatar);
        if (!this._avatarCache || this._avatarCacheKey !== avKey || this._avatarCacheH !== Math.ceil(avatarH)) {
            const offscreen = document.createElement('canvas');
            offscreen.width = Math.ceil(avatarW);
            offscreen.height = Math.ceil(avatarH);
            AvatarRenderer.draw(offscreen.getContext('2d'), offscreen.width, offscreen.height, Save.data.avatar);
            this._avatarCache = offscreen;
            this._avatarCacheKey = avKey;
            this._avatarCacheH = Math.ceil(avatarH);
        }
        ctx.drawImage(this._avatarCache, ax - avatarW / 2, ay);
    },

    _getRodColors() {
        const gear = Game.getGear();
        return { rod: gear.rod.color || '#5D4E37', handle: gear.rod.handleColor || '#3A2F1E', reel: gear.rod.reelColor || '#888' };
    },

    drawRodIdle(ctx, w, h, wl) {
        const baseX = w * 0.15;
        const baseY = h * 0.92;
        const tipX = w * 0.35;
        const tipY = wl - 10;
        const colors = this._getRodColors();

        ctx.strokeStyle = colors.rod;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(baseX, baseY);
        ctx.quadraticCurveTo(w * 0.2, h * 0.6, tipX, tipY);
        ctx.stroke();

        // Rod handle
        ctx.strokeStyle = colors.handle;
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(baseX, baseY);
        ctx.lineTo(baseX + 15, baseY - 20);
        ctx.stroke();

        // Reel
        ctx.fillStyle = colors.reel;
        ctx.beginPath();
        ctx.arc(baseX + 8, baseY - 12, 6, 0, Math.PI * 2);
        ctx.fill();
    },

    drawRodCasting(ctx, w, h, wl, power) {
        const baseX = w * 0.15;
        const baseY = h * 0.92;
        const angle = -0.6 - (power / 100) * 0.8;
        const tipX = baseX + Math.cos(angle) * 200;
        const tipY = baseY + Math.sin(angle) * 200;

        ctx.strokeStyle = this._getRodColors().rod;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(baseX, baseY);
        ctx.quadraticCurveTo(baseX + 50, baseY - 100, tipX, tipY);
        ctx.stroke();
    },

    drawRodCast(ctx, w, h, wl, dist) {
        const baseX = w * 0.15;
        const baseY = h * 0.92;
        const tipX = w * 0.3;
        const tipY = wl - 20;

        ctx.strokeStyle = this._getRodColors().rod;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(baseX, baseY);
        ctx.quadraticCurveTo(w * 0.18, h * 0.55, tipX, tipY);
        ctx.stroke();
    },

    drawRodFighting(ctx, w, h, wl, progress) {
        const baseX = w * 0.15;
        const baseY = h * 0.92;
        const bend = 0.15 + (1 - progress) * 0.25;
        const tipX = w * 0.28;
        const tipY = wl + 10;

        ctx.strokeStyle = this._getRodColors().rod;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(baseX, baseY);
        ctx.quadraticCurveTo(w * 0.15 + bend * 40, h * 0.5 + bend * 80, tipX, tipY);
        ctx.stroke();
    },

    drawBobber(ctx, w, h, wl, dist, biting) {
        const bobX = w * 0.15 + dist * w * 0.007;
        const bobY = wl + (biting ? 12 + Math.sin(this.time * 15) * 5 : Math.sin(this.time * 2) * 3);

        // Bobber
        ctx.fillStyle = '#E74C3C';
        ctx.beginPath();
        ctx.arc(bobX, bobY, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(bobX, bobY - 7, 4, 0, Math.PI * 2);
        ctx.fill();

        // Splash when biting
        if (biting) {
            ctx.strokeStyle = 'rgba(255,255,255,0.5)';
            ctx.lineWidth = 2;
            for (let i = 0; i < 4; i++) {
                const angle = (this.time * 8 + i * Math.PI / 2) % (Math.PI * 2);
                const r = 12 + Math.sin(this.time * 10) * 5;
                ctx.beginPath();
                ctx.arc(bobX + Math.cos(angle) * r, bobY + Math.sin(angle) * r * 0.3, 2, 0, Math.PI * 2);
                ctx.stroke();
            }
        }
    },

    drawLine(ctx, w, h, wl, dist) {
        const tipX = w * 0.3;
        const tipY = wl - 20;
        const bobX = w * 0.15 + dist * w * 0.007;
        const bobY = wl + Math.sin(this.time * 2) * 3;
        const gear = Game.getGear();

        ctx.strokeStyle = gear.line.lineColor || 'rgba(200,200,200,0.5)';
        ctx.lineWidth = gear.line.lineWidth || 1;
        ctx.beginPath();
        ctx.moveTo(tipX, tipY);
        ctx.quadraticCurveTo((tipX + bobX) / 2, wl - 5, bobX, bobY);
        ctx.stroke();
    },

    drawBiteAlert(ctx, w, h) {
        const alpha = 0.5 + Math.sin(this.time * 12) * 0.5;
        ctx.fillStyle = `rgba(231, 76, 60, ${alpha})`;
        ctx.font = `bold ${Math.min(w * 0.06, 48)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('NAPP! Trykk MELLOMROM!', w / 2, h * 0.3);
        ctx.textAlign = 'start';
    },

    drawFishFight(ctx, w, h, wl, state) {
        // Fish silhouette underwater
        const fishX = w * 0.5 - state.fishProgress * w * 0.3;
        const fishY = wl + 40 + Math.sin(this.time * 5) * 10;
        const fishSize = 15 + (state.fishDifficulty || 5) * 3;

        ctx.globalAlpha = 0.5;
        ctx.fillStyle = '#fff';
        // Simple fish shape
        ctx.beginPath();
        ctx.moveTo(fishX + fishSize, fishY);
        ctx.quadraticCurveTo(fishX, fishY - fishSize * 0.4, fishX - fishSize, fishY);
        ctx.quadraticCurveTo(fishX, fishY + fishSize * 0.4, fishX + fishSize, fishY);
        ctx.fill();
        // Tail
        ctx.beginPath();
        ctx.moveTo(fishX - fishSize, fishY);
        ctx.lineTo(fishX - fishSize * 1.4, fishY - fishSize * 0.35);
        ctx.lineTo(fishX - fishSize * 1.4, fishY + fishSize * 0.35);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;

        // Line from rod to fish
        const tipX = w * 0.28;
        const tipY = wl + 10;
        const lineGear = Game.getGear().line;
        const baseAlpha = 0.3 + state.tension * 0.7;
        // Use gear line color with tension-based alpha
        const lc = lineGear.lineColor || 'rgba(200,200,200,0.5)';
        const lcMatch = lc.match(/rgba?\((\d+),(\d+),(\d+)/);
        ctx.strokeStyle = lcMatch ? `rgba(${lcMatch[1]},${lcMatch[2]},${lcMatch[3]},${baseAlpha})` : lc;
        ctx.lineWidth = lineGear.lineWidth || 1.5;
        ctx.beginPath();
        ctx.moveTo(tipX, tipY);
        ctx.quadraticCurveTo(fishX, wl + 5, fishX, fishY);
        ctx.stroke();
    },

    drawTensionMeter(ctx, w, h, tension, reeling) {
        const meterX = w - 60;
        const meterY = h * 0.15;
        const meterH = h * 0.55;
        const meterW = 24;

        // Background
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.beginPath();
        ctx.roundRect(meterX - 4, meterY - 4, meterW + 8, meterH + 8, 6);
        ctx.fill();

        // Green zone from line equipment
        const gear = Game.getGear();
        const greenStart = gear.line.greenStart;
        const greenEnd = gear.line.greenEnd;

        // Red zone (top - too much tension)
        ctx.fillStyle = 'rgba(231, 76, 60, 0.4)';
        ctx.fillRect(meterX, meterY, meterW, meterH * (1 - greenEnd));

        // Green zone
        ctx.fillStyle = 'rgba(39, 174, 96, 0.3)';
        ctx.fillRect(meterX, meterY + meterH * (1 - greenEnd), meterW, meterH * (greenEnd - greenStart));

        // Red zone (bottom - too little)
        ctx.fillStyle = 'rgba(231, 76, 60, 0.4)';
        ctx.fillRect(meterX, meterY + meterH * (1 - greenStart), meterW, meterH * greenStart);

        // Current tension indicator
        const indicatorY = meterY + meterH * (1 - tension);
        ctx.fillStyle = reeling ? '#FFDE17' : '#FFFFFF';
        ctx.fillRect(meterX - 6, indicatorY - 3, meterW + 12, 6);

        // Labels
        ctx.font = '10px sans-serif';
        ctx.fillStyle = '#E74C3C';
        ctx.textAlign = 'center';
        ctx.fillText('RYKER', meterX + meterW / 2, meterY - 8);
        ctx.fillText('SLAKK', meterX + meterW / 2, meterY + meterH + 14);
        ctx.textAlign = 'start';

        // "SPENNING" label
        ctx.save();
        ctx.translate(meterX - 12, meterY + meterH / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.font = '11px sans-serif';
        ctx.fillStyle = '#999';
        ctx.textAlign = 'center';
        ctx.fillText('SPENNING', 0, 0);
        ctx.restore();
    },

    drawProgressBar(ctx, w, h, progress) {
        const barW = w * 0.4;
        const barH = 16;
        const barX = (w - barW) / 2;
        const barY = h - 40;

        // Background
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.beginPath();
        ctx.roundRect(barX - 2, barY - 2, barW + 4, barH + 4, 4);
        ctx.fill();

        // Progress
        ctx.fillStyle = progress > 0.8 ? '#27AE60' : progress > 0.5 ? '#F39C12' : '#3498DB';
        ctx.beginPath();
        ctx.roundRect(barX, barY, Math.max(0, barW * progress), barH, 3);
        ctx.fill();

        // Text
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`Drar inn... ${(progress * 100).toFixed(0)}%`, w / 2, barY + 12);
        ctx.textAlign = 'start';
    },

    drawPowerMeter(ctx, w, h, power) {
        const barW = w * 0.35;
        const barH = 22;
        const barX = (w - barW) / 2;
        const barY = h * 0.12;

        // Background
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.beginPath();
        ctx.roundRect(barX - 4, barY - 4, barW + 8, barH + 8, 6);
        ctx.fill();

        // Power bar gradient
        const grad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
        grad.addColorStop(0, '#27AE60');
        grad.addColorStop(0.5, '#F39C12');
        grad.addColorStop(1, '#E74C3C');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(barX, barY, Math.max(0, barW * (power / 100)), barH, 4);
        ctx.fill();

        // Sweet spot indicator
        const sweetX = barX + barW * 0.65;
        ctx.strokeStyle = 'rgba(255,222,23,0.8)';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(sweetX, barY - 6);
        ctx.lineTo(sweetX, barY + barH + 6);
        ctx.stroke();
        ctx.setLineDash([]);

        // Label
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 13px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('KASTKRAFT', w / 2, barY - 10);
        ctx.textAlign = 'start';
    },

    _initRain(count) {
        if (this._rainDrops && this._rainDrops.length === count) return;
        this._rainDrops = [];
        for (let i = 0; i < count; i++) {
            this._rainDrops.push({
                x: Math.random(),
                y: Math.random(),
                speed: 0.6 + Math.random() * 0.4,
                len: 0.8 + Math.random() * 0.5
            });
        }
        // Gentle wind that slowly shifts direction
        this._rainWind = (Math.random() - 0.5) * 0.6;
        this._rainWindTarget = this._rainWind;
        this._rainWindTimer = 0;
    },

    _updateWind(dt) {
        this._rainWindTimer -= dt;
        if (this._rainWindTimer <= 0) {
            this._rainWindTarget = (Math.random() - 0.5) * 0.8;
            this._rainWindTimer = 2 + Math.random() * 4;
        }
        this._rainWind += (this._rainWindTarget - this._rainWind) * 0.02;
    },

    drawRain(ctx, w, h) {
        this._initRain(100);
        this._updateWind(0.016);
        const wind = this._rainWind;

        ctx.lineWidth = 1;
        for (const drop of this._rainDrops) {
            // Move drop
            drop.y += drop.speed * 0.018;
            drop.x += wind * 0.005 * drop.speed;

            // Wrap around
            if (drop.y > 1.05) { drop.y = -0.05; drop.x = Math.random(); }
            if (drop.x > 1.1) drop.x = -0.1;
            if (drop.x < -0.1) drop.x = 1.1;

            const px = drop.x * w;
            const py = drop.y * h;
            const len = 10 * drop.len;
            const dx = wind * 3;

            // Varying opacity for depth
            const alpha = 0.15 + drop.speed * 0.25;
            ctx.strokeStyle = `rgba(180, 210, 240, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.lineTo(px + dx, py + len);
            ctx.stroke();
        }
    },

    drawFog(ctx, w, h, waterLine) {
        // Semi-transparent fog overlay, thicker near water
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, 'rgba(200, 210, 220, 0.05)');
        grad.addColorStop(waterLine / h - 0.05, 'rgba(200, 210, 220, 0.15)');
        grad.addColorStop(waterLine / h, 'rgba(200, 210, 220, 0.35)');
        grad.addColorStop(1, 'rgba(200, 210, 220, 0.2)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        // Drifting fog wisps
        ctx.fillStyle = 'rgba(220, 225, 230, 0.12)';
        for (let i = 0; i < 5; i++) {
            const x = ((this.time * 15 + i * 200) % (w + 300)) - 150;
            const y = waterLine - 20 + i * 15 + Math.sin(this.time + i) * 8;
            ctx.beginPath();
            ctx.ellipse(x, y, 120, 15, 0, 0, Math.PI * 2);
            ctx.fill();
        }
    },

    drawHeavyRain(ctx, w, h) {
        this._initRain(200);
        this._updateWind(0.016);
        // Storm has stronger, more consistent wind
        const wind = this._rainWind + (this._rainWind > 0 ? 0.5 : -0.5);

        ctx.lineWidth = 1.5;
        for (const drop of this._rainDrops) {
            drop.y += drop.speed * 0.024;
            drop.x += wind * 0.007 * drop.speed;

            if (drop.y > 1.05) { drop.y = -0.05; drop.x = Math.random(); }
            if (drop.x > 1.1) drop.x = -0.1;
            if (drop.x < -0.1) drop.x = 1.1;

            const px = drop.x * w;
            const py = drop.y * h;
            const len = 16 * drop.len;
            const dx = wind * 5;

            const alpha = 0.2 + drop.speed * 0.3;
            ctx.strokeStyle = `rgba(180, 210, 240, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.lineTo(px + dx, py + len);
            ctx.stroke();
        }

        // Darken overlay for storm
        ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.fillRect(0, 0, w, h);
    },

    drawLightning(ctx, w, h) {
        if (Math.random() < 0.003) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.fillRect(0, 0, w, h);
            // Lightning bolt
            ctx.strokeStyle = 'rgba(255, 255, 200, 0.9)';
            ctx.lineWidth = 3;
            const x = w * 0.2 + Math.random() * w * 0.6;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            let cy = 0;
            while (cy < h * 0.4) {
                cy += 20 + Math.random() * 30;
                ctx.lineTo(x + (Math.random() - 0.5) * 40, cy);
            }
            ctx.stroke();
        }
    },

    // Catch animation - fish jumping out of water
    drawCatchAnimation(ctx, w, h, waterLine, t, fish) {
        // t goes from 0 to 1 over 1500ms
        // Parabolic arc: rise 0-0.4, peak 0.4-0.6, fall 0.6-1.0
        let arcY;
        const arcHeight = h * 0.3;
        if (t < 0.4) {
            const p = t / 0.4;
            arcY = waterLine - arcHeight * p;
        } else if (t < 0.6) {
            arcY = waterLine - arcHeight;
        } else {
            const p = (t - 0.6) / 0.4;
            arcY = waterLine - arcHeight * (1 - p);
        }

        const fishX = w * 0.4 + (t * 0.2) * w;
        const fishY = arcY;

        // Draw the fish using the cached canvas
        if (this._catchFishCanvas) {
            const fw = this._catchFishCanvas.width;
            const fh = this._catchFishCanvas.height;
            // Rotate fish based on arc phase
            ctx.save();
            ctx.translate(fishX, fishY);
            const angle = t < 0.4 ? -0.4 : t < 0.6 ? 0 : 0.4;
            ctx.rotate(angle);
            ctx.drawImage(this._catchFishCanvas, -fw / 2, -fh / 2);
            ctx.restore();
        }

        // Splash at start
        if (t < 0.15) {
            ctx.fillStyle = `rgba(200, 230, 255, ${0.6 * (1 - t / 0.15)})`;
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                const r = 20 * (t / 0.15);
                ctx.beginPath();
                ctx.arc(w * 0.4 + Math.cos(angle) * r, waterLine + Math.sin(angle) * r * 0.3, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Sparkle at peak
        if (t > 0.3 && t < 0.7) {
            const sparkle = (t - 0.3) / 0.4;
            ctx.fillStyle = `rgba(255, 222, 23, ${0.8 * Math.sin(sparkle * Math.PI)})`;
            for (let i = 0; i < 6; i++) {
                const a = (i / 6) * Math.PI * 2 + this.time * 3;
                const r = 25 + Math.sin(this.time * 8 + i) * 8;
                ctx.beginPath();
                ctx.arc(fishX + Math.cos(a) * r, fishY + Math.sin(a) * r, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Splash at landing
        if (t > 0.85) {
            const p = (t - 0.85) / 0.15;
            ctx.fillStyle = `rgba(200, 230, 255, ${0.6 * (1 - p)})`;
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                const r = 25 * p;
                ctx.beginPath();
                ctx.arc(fishX + Math.cos(angle) * r, waterLine + Math.sin(angle) * r * 0.3, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    },

    addSplash(x, y) {
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x, y,
                vx: (Math.random() - 0.5) * 4,
                vy: -Math.random() * 4 - 2,
                life: 1,
                size: 2 + Math.random() * 3,
                color: 'rgba(200, 230, 255,'
            });
        }
    },

    updateParticles(ctx) {
        this.particles = this.particles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.15;
            p.life -= 0.025;
            if (p.life <= 0) return false;

            ctx.fillStyle = p.color + p.life + ')';
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            ctx.fill();
            return true;
        });
    }
};

// --- Avatar Renderer ---
const AvatarRenderer = {
    draw(ctx, w, h, avatarData) {
        const av = avatarData || (Save.data && Save.data.avatar) || { skinTone: 'light', hair: 'brown', hat: 'cap', jacket: 'vest', pants: 'jeans', accessory: 'none' };

        const skin = (AVATAR_OPTIONS.skinTone.find(s => s.id === av.skinTone) || AVATAR_OPTIONS.skinTone[0]).color;
        const hairOpt = AVATAR_OPTIONS.hair.find(h => h.id === av.hair) || AVATAR_OPTIONS.hair[1];
        const hatOpt = AVATAR_OPTIONS.hat.find(h => h.id === av.hat) || AVATAR_OPTIONS.hat[0];
        const jacketOpt = AVATAR_OPTIONS.jacket.find(j => j.id === av.jacket) || AVATAR_OPTIONS.jacket[0];
        const pantsOpt = AVATAR_OPTIONS.pants.find(p => p.id === av.pants) || AVATAR_OPTIONS.pants[0];
        const accOpt = AVATAR_OPTIONS.accessory.find(a => a.id === av.accessory) || AVATAR_OPTIONS.accessory[0];

        const cx = w / 2;
        const scale = h / 200;

        ctx.save();
        ctx.translate(cx, 0);
        ctx.scale(scale, scale);

        // Long hair behind body (drawn first so it's behind shoulders)
        if (hairOpt.long && hairOpt.color) {
            ctx.fillStyle = hairOpt.color;
            // Hair flowing down behind shoulders
            ctx.beginPath();
            ctx.moveTo(-20, 40);
            ctx.bezierCurveTo(-26, 60, -28, 90, -22, 110);
            ctx.lineTo(-14, 110);
            ctx.bezierCurveTo(-18, 85, -18, 60, -16, 40);
            ctx.closePath();
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(20, 40);
            ctx.bezierCurveTo(26, 60, 28, 90, 22, 110);
            ctx.lineTo(14, 110);
            ctx.bezierCurveTo(18, 85, 18, 60, 16, 40);
            ctx.closePath();
            ctx.fill();
        }

        // Legs / pants / skirt
        if (pantsOpt.skirt) {
            // Skirt - A-line shape
            ctx.fillStyle = pantsOpt.color;
            ctx.beginPath();
            ctx.moveTo(-20, 130);
            ctx.lineTo(-26, 162);
            ctx.lineTo(26, 162);
            ctx.lineTo(20, 130);
            ctx.closePath();
            ctx.fill();
            // Legs below skirt
            ctx.fillStyle = skin;
            ctx.fillRect(-10, 160, 8, 14);
            ctx.fillRect(2, 160, 8, 14);
        } else {
            ctx.fillStyle = pantsOpt.color;
            ctx.fillRect(-14, 130, 12, 45);
            ctx.fillRect(2, 130, 12, 45);
        }

        // Shoes
        ctx.fillStyle = '#333';
        const shoeY = pantsOpt.skirt ? 172 : 172;
        ctx.fillRect(-16, shoeY, 16, 8);
        ctx.fillRect(0, shoeY, 16, 8);

        // Body / jacket
        ctx.fillStyle = jacketOpt.color;
        ctx.beginPath();
        ctx.roundRect(-20, 75, 40, 58, 4);
        ctx.fill();

        // Striped pattern for striped shirt
        if (av.jacket === 'striped') {
            ctx.strokeStyle = 'rgba(255,255,255,0.25)';
            ctx.lineWidth = 2;
            for (let sy = 80; sy < 130; sy += 6) {
                ctx.beginPath();
                ctx.moveTo(-18, sy);
                ctx.lineTo(18, sy);
                ctx.stroke();
            }
        }

        // Arms
        ctx.fillStyle = jacketOpt.color;
        ctx.save();
        ctx.translate(-20, 82);
        ctx.rotate(-0.15);
        ctx.fillRect(-10, 0, 10, 40);
        ctx.restore();
        ctx.save();
        ctx.translate(20, 82);
        ctx.rotate(0.15);
        ctx.fillRect(0, 0, 10, 40);
        ctx.restore();

        // Hands
        ctx.fillStyle = skin;
        ctx.beginPath();
        ctx.arc(-32, 123, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(32, 123, 5, 0, Math.PI * 2);
        ctx.fill();

        // Scarf accessory (behind head, over jacket)
        if (accOpt.id === 'scarf') {
            ctx.fillStyle = accOpt.color;
            ctx.beginPath();
            ctx.roundRect(-12, 66, 24, 12, 3);
            ctx.fill();
            // Trailing end
            ctx.beginPath();
            ctx.moveTo(10, 72);
            ctx.bezierCurveTo(16, 80, 14, 95, 18, 105);
            ctx.lineTo(12, 105);
            ctx.bezierCurveTo(10, 92, 12, 80, 8, 74);
            ctx.closePath();
            ctx.fill();
        }

        // Necklace accessory
        if (accOpt.id === 'necklace') {
            ctx.strokeStyle = accOpt.color;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(0, 74, 10, 0.1 * Math.PI, 0.9 * Math.PI);
            ctx.stroke();
            // Pendant
            ctx.fillStyle = accOpt.color;
            ctx.beginPath();
            ctx.arc(0, 84, 3, 0, Math.PI * 2);
            ctx.fill();
        }

        // Neck
        ctx.fillStyle = skin;
        ctx.fillRect(-6, 65, 12, 14);

        // Head
        ctx.fillStyle = skin;
        ctx.beginPath();
        ctx.arc(0, 48, 22, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#1A1A1A';
        ctx.beginPath();
        ctx.arc(-7, 46, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(7, 46, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Mouth
        ctx.strokeStyle = '#1A1A1A';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 54, 5, 0.1 * Math.PI, 0.9 * Math.PI);
        ctx.stroke();

        // Sunglasses accessory
        if (accOpt.id === 'sunglasses') {
            ctx.fillStyle = 'rgba(0,0,0,0.7)';
            // Left lens
            ctx.beginPath();
            ctx.roundRect(-13, 42, 11, 8, 2);
            ctx.fill();
            // Right lens
            ctx.beginPath();
            ctx.roundRect(2, 42, 11, 8, 2);
            ctx.fill();
            // Bridge
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(-2, 46);
            ctx.lineTo(2, 46);
            ctx.stroke();
            // Arms
            ctx.beginPath();
            ctx.moveTo(-13, 44);
            ctx.lineTo(-22, 43);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(13, 44);
            ctx.lineTo(22, 43);
            ctx.stroke();
        }

        // Earrings accessory
        if (accOpt.id === 'earrings') {
            ctx.fillStyle = accOpt.color;
            ctx.beginPath();
            ctx.arc(-22, 54, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(22, 54, 3, 0, Math.PI * 2);
            ctx.fill();
        }

        // Hair (short styles)
        if (hairOpt.color && !hairOpt.long) {
            ctx.fillStyle = hairOpt.color;
            ctx.beginPath();
            ctx.arc(0, 38, 22, Math.PI, 2 * Math.PI);
            ctx.fill();
            // Side hair
            ctx.fillRect(-22, 32, 6, 18);
            ctx.fillRect(16, 32, 6, 18);
        }

        // Hair (long styles) — top/fringe part (drawn over head)
        if (hairOpt.long && hairOpt.color) {
            ctx.fillStyle = hairOpt.color;
            // Top of head
            ctx.beginPath();
            ctx.arc(0, 38, 23, Math.PI, 2 * Math.PI);
            ctx.fill();
            // Fringe / bangs
            ctx.beginPath();
            ctx.moveTo(-20, 35);
            ctx.bezierCurveTo(-16, 42, -8, 44, 0, 40);
            ctx.bezierCurveTo(8, 44, 16, 42, 20, 35);
            ctx.lineTo(22, 30);
            ctx.arc(0, 30, 22, 0, Math.PI, true);
            ctx.closePath();
            ctx.fill();
        }

        // Hat
        if (hatOpt.color) {
            ctx.fillStyle = hatOpt.color;
            if (hatOpt.id === 'cap') {
                ctx.beginPath();
                ctx.arc(0, 30, 22, Math.PI, 2 * Math.PI);
                ctx.fill();
                ctx.fillRect(-8, 28, 32, 5);
            } else if (hatOpt.id === 'bucket') {
                ctx.beginPath();
                ctx.moveTo(-28, 33);
                ctx.lineTo(-22, 12);
                ctx.lineTo(22, 12);
                ctx.lineTo(28, 33);
                ctx.closePath();
                ctx.fill();
            } else if (hatOpt.id === 'beanie') {
                ctx.beginPath();
                ctx.arc(0, 30, 23, Math.PI, 2 * Math.PI);
                ctx.fill();
                ctx.fillRect(-23, 27, 46, 6);
                ctx.beginPath();
                ctx.arc(0, 10, 6, 0, Math.PI * 2);
                ctx.fill();
            } else if (hatOpt.id === 'cowboy') {
                ctx.beginPath();
                ctx.arc(0, 28, 20, Math.PI, 2 * Math.PI);
                ctx.fill();
                ctx.fillRect(-32, 28, 64, 5);
            } else if (hatOpt.id === 'gold_cap') {
                ctx.beginPath();
                ctx.arc(0, 30, 22, Math.PI, 2 * Math.PI);
                ctx.fill();
                ctx.fillRect(-8, 28, 32, 5);
            } else if (hatOpt.id === 'sunhat') {
                // Wide floppy sun hat
                ctx.beginPath();
                ctx.arc(0, 28, 18, Math.PI, 2 * Math.PI);
                ctx.fill();
                // Wide brim
                ctx.beginPath();
                ctx.ellipse(0, 30, 34, 8, 0, 0, Math.PI * 2);
                ctx.fill();
                // Ribbon
                ctx.fillStyle = '#E891B2';
                ctx.fillRect(-18, 24, 36, 4);
            } else if (hatOpt.id === 'bow') {
                // Hair bow on top
                ctx.beginPath();
                ctx.moveTo(0, 22);
                ctx.bezierCurveTo(-14, 14, -16, 28, 0, 22);
                ctx.fill();
                ctx.beginPath();
                ctx.moveTo(0, 22);
                ctx.bezierCurveTo(14, 14, 16, 28, 0, 22);
                ctx.fill();
                // Center knot
                ctx.beginPath();
                ctx.arc(0, 22, 3, 0, Math.PI * 2);
                ctx.fill();
            } else if (hatOpt.id === 'headband') {
                // Headband across top of head
                ctx.fillRect(-22, 30, 44, 4);
                // Small side accent
                ctx.beginPath();
                ctx.arc(18, 32, 4, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Vest detail (pockets)
        if (av.jacket === 'vest') {
            ctx.strokeStyle = 'rgba(0,0,0,0.2)';
            ctx.lineWidth = 1;
            ctx.strokeRect(-15, 95, 12, 10);
            ctx.strokeRect(3, 95, 12, 10);
        }

        // Puffer jacket quilting
        if (av.jacket === 'puffer') {
            ctx.strokeStyle = 'rgba(0,0,0,0.15)';
            ctx.lineWidth = 1;
            for (let py = 82; py < 130; py += 10) {
                ctx.beginPath();
                ctx.moveTo(-18, py);
                ctx.lineTo(18, py);
                ctx.stroke();
            }
        }

        ctx.restore();
    }
};

// --- Avatar Editor ---
const AvatarEditor = {
    init() {
        // Migrate avatar for existing saves
        if (!Save.data.avatar) {
            Save.data.avatar = { skinTone: 'light', hair: 'brown', hat: 'cap', jacket: 'vest', pants: 'jeans', accessory: 'none' };
            Save.save();
        }

        const container = document.getElementById('avatar-sections');
        container.innerHTML = '';

        const categories = [
            { key: 'skinTone', label: 'Hudtone' },
            { key: 'hair', label: 'Hår' },
            { key: 'hat', label: 'Hodeplagg' },
            { key: 'jacket', label: 'Overdel' },
            { key: 'pants', label: 'Underdel' },
            { key: 'accessory', label: 'Tilbehør' }
        ];

        categories.forEach(cat => {
            const section = document.createElement('div');
            section.className = 'avatar-section';
            section.innerHTML = `<h3>${cat.label}</h3>`;

            const row = document.createElement('div');
            row.className = 'avatar-option-row';

            AVATAR_OPTIONS[cat.key].forEach(opt => {
                const btn = document.createElement('button');
                btn.className = 'avatar-option' + (Save.data.avatar[cat.key] === opt.id ? ' selected' : '');
                btn.innerHTML = (opt.color ? `<span class="avatar-swatch" style="background:${opt.color}"></span>` : '') + opt.name;
                btn.addEventListener('click', () => {
                    Save.data.avatar[cat.key] = opt.id;
                    Save.save();
                    // Update selection highlight
                    row.querySelectorAll('.avatar-option').forEach(b => b.classList.remove('selected'));
                    btn.classList.add('selected');
                    this.updatePreview();
                    SFX.init();
                    SFX.play('uiClick');
                });
                row.appendChild(btn);
            });

            section.appendChild(row);
            container.appendChild(section);
        });

        this.updatePreview();
    },

    updatePreview() {
        const canvas = document.getElementById('avatar-preview-canvas');
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        AvatarRenderer.draw(ctx, canvas.width, canvas.height, Save.data.avatar);
    }
};

// --- Main Game Logic ---
const Game = {
    selectedLocation: 'lake',
    selectedBait: 'worm',
    selectedTime: 'dawn',
    castsLeft: 0,
    castsTotal: 0,
    dayCoins: 0,
    dayCatches: [],
    daySpecies: new Set(),
    dayPoints: 0,

    // Weather
    currentWeather: null,

    // Catch animation
    catchAnimTimer: 0,
    catchAnimDuration: 1500,

    // State machine
    phase: 'idle',  // idle, casting, waiting, bite, fighting, catchAnim
    power: 0,
    powerDir: 1,
    castDistance: 0,
    waitTimer: 0,
    biteTimer: 0,
    tension: 0.45,
    fishProgress: 0,
    reeling: false,
    activeFish: null,
    activeFishWeight: 0,
    activeFishLength: 0,
    fishDifficulty: 0,
    fishPullTimer: 0,
    fishPullStrength: 0,
    fightTime: 0,

    running: false,
    animFrame: null,

    // Knot quality (0-100)
    knotQuality: 50,

    // Get current equipment stats
    getGear() {
        const eq = Save.data.equipment || { rod: 0, line: 0, reel: 0, hook: 0, finder: 0 };
        return {
            rod: EQUIPMENT.rod.tiers[eq.rod] || EQUIPMENT.rod.tiers[0],
            line: EQUIPMENT.line.tiers[eq.line] || EQUIPMENT.line.tiers[0],
            reel: EQUIPMENT.reel.tiers[eq.reel] || EQUIPMENT.reel.tiers[0],
            hook: EQUIPMENT.hook.tiers[eq.hook] || EQUIPMENT.hook.tiers[0],
            finder: EQUIPMENT.finder.tiers[eq.finder] || EQUIPMENT.finder.tiers[0]
        };
    },

    start() {
        Save.load();
        // Ensure equipment exists in save
        if (!Save.data.equipment) {
            Save.data.equipment = { rod: 0, line: 0, reel: 0, hook: 0, finder: 0 };
            Save.save();
        }
        UI.showScreen('screen-setup');
        UI.renderSetup();
    },

    beginFishing() {
        const loc = LOCATIONS.find(l => l.id === this.selectedLocation);
        if (!loc || !Save.data.unlockedLocations.includes(loc.id)) return;

        const bait = BAITS.find(b => b.id === this.selectedBait);
        if (!bait || !Save.data.unlockedBaits.includes(bait.id)) return;

        const time = TIME_OF_DAY.find(t => t.id === this.selectedTime) || TIME_OF_DAY[0];
        const totalCasts = loc.castCount + (time.castMod || 0);
        this.castsTotal = totalCasts;
        this.castsLeft = totalCasts;
        this.dayCoins = 0;
        this.dayCatches = [];
        this.daySpecies = new Set();
        this.dayPoints = 0;
        this.phase = 'idle';

        // Set random weather
        this.currentWeather = WEATHER[Math.floor(Math.random() * WEATHER.length)];

        // Init sound
        SFX.init();

        // Launch knot-tying mini-game before fishing
        KnotGame.start();
    },

    startFishingDay() {
        UI.showScreen('screen-fishing');
        Scene.init();
        this.updateHUD();
        UI.setPrompt('Trykk MELLOMROM for å kaste ut', true);
        this.running = true;
        this.loop();
    },

    loop() {
        if (!this.running) return;

        this.update();
        Scene.render({
            phase: this.phase,
            power: this.power,
            castDistance: this.castDistance,
            tension: this.tension,
            fishProgress: this.fishProgress,
            reeling: this.reeling,
            fishDifficulty: this.fishDifficulty,
            catchAnimProgress: this.catchAnimDuration > 0 ? this.catchAnimTimer / this.catchAnimDuration : 0,
            activeFish: this.activeFish
        });

        this.animFrame = requestAnimationFrame(() => this.loop());
    },

    update() {
        if (this.phase === 'casting') {
            this.power += this.powerDir * 1.8;
            if (this.power >= 100) { this.power = 100; this.powerDir = -1; }
            if (this.power <= 0) { this.power = 0; this.powerDir = 1; }
        }

        if (this.phase === 'waiting') {
            this.waitTimer -= 16;
            if (this.waitTimer <= 0) {
                // Check if fish bites
                if (this.rollForBite()) {
                    this.phase = 'bite';
                    const gear = this.getGear();
                    this.biteTimer = gear.hook.biteWindow;
                    SFX.play('biteBeep');
                    UI.setPrompt('NAPP! Trykk MELLOMROM nå!', true);
                } else {
                    // No bite, wait more
                    this.waitTimer = 1500 + Math.random() * 2500;
                }
            }
        }

        if (this.phase === 'bite') {
            this.biteTimer -= 16;
            if (this.biteTimer <= 0) {
                // Missed the bite
                this.phase = 'idle';
                this.castsLeft--;
                this.updateHUD();
                if (this.castsLeft <= 0) {
                    this.endDay();
                } else {
                    UI.setPrompt('For sent! Fisken spyttet ut kroken. Trykk MELLOMROM for å kaste igjen.', true);
                }
            }
        }

        if (this.phase === 'fighting') {
            this.fightTime += 16;

            // Get equipment stats
            const gear = Game.getGear();

            // Fish pull behavior - varies by difficulty, time of day, and weather
            const timeData = TIME_OF_DAY.find(t => t.id === Game.selectedTime) || TIME_OF_DAY[0];
            const weatherFightMod = this.currentWeather ? this.currentWeather.fightMod : 1.0;
            this.fishPullTimer -= 16;
            if (this.fishPullTimer <= 0) {
                this.fishPullStrength = (0.3 + Math.random() * 0.7) * (this.fishDifficulty / 10) * (timeData.fightMod || 1.0) * weatherFightMod;
                this.fishPullTimer = 400 + Math.random() * 800;

                // Aggressive fish have burst pulls
                if (this.activeFish.aggressive && Math.random() < 0.3) {
                    this.fishPullStrength *= 1.8;
                    this.fishPullTimer = 200;
                }
            }

            // Tension dynamics
            const pullForce = this.fishPullStrength * 0.008;
            const reelForce = this.reeling ? 0.007 : 0;
            // Decay only applies when NOT reeling — reel quality makes recovery faster
            const baseDecay = 0.004;
            const decay = this.reeling ? 0 : baseDecay * gear.reel.tensionDecay;

            this.tension += pullForce + reelForce - decay;

            // Fish progress — rod quality increases reel-in speed
            if (this.reeling) {
                const baseReel = 0.0025;
                this.fishProgress += baseReel * gear.rod.reelSpeed * (1 - this.fishPullStrength * 0.4);
            } else {
                this.fishProgress -= 0.001 * this.fishPullStrength;
            }

            // Clamp
            this.tension = Math.max(0, Math.min(1, this.tension));
            this.fishProgress = Math.max(0, Math.min(1, this.fishProgress));

            // Knot quality modifier
            const knotMod = this.knotQuality / 100;

            // Line snap — line quality raises threshold, bad knot weakens it
            const effectiveSnap = gear.line.snapThreshold - (1 - knotMod) * 0.12;
            if (this.tension > effectiveSnap) {
                this.fishEscaped('Snøret røk! For mye spenning.');
                return;
            }

            // Fish escapes (too loose) — hook quality lowers threshold, bad knot raises it
            const effectiveEscape = gear.hook.escapeThreshold + (1 - knotMod) * 0.04;
            if (this.tension < effectiveEscape && this.fightTime > 1000) {
                this.fishEscaped('Fisken ristet seg løs! Hold spenning på snøret.');
                return;
            }

            // Random knot slip event — bad knot can come undone
            if (Math.random() < (1 - knotMod) * 0.00003) {
                this.fishEscaped('Knuten glapp! Fisken slapp unna.');
                return;
            }

            // Fish caught — transition to catch animation
            if (this.fishProgress >= 1) {
                this.phase = 'catchAnim';
                this.catchAnimTimer = 0;
                // Pre-render fish on offscreen canvas to avoid flicker
                const offscreen = document.createElement('canvas');
                offscreen.width = 160;
                offscreen.height = 80;
                FishRenderer.draw(offscreen.getContext('2d'), this.activeFish, 160, 80, 1.2);
                Scene._catchFishCanvas = offscreen;
                SFX.play('fishCaught');
                UI.setPrompt('', false);
                return;
            }
        }

        if (this.phase === 'catchAnim') {
            this.catchAnimTimer += 16;
            if (this.catchAnimTimer >= this.catchAnimDuration) {
                this.fishCaught();
            }
        }
    },

    rollForBite() {
        const loc = LOCATIONS.find(l => l.id === this.selectedLocation);
        const bait = BAITS.find(b => b.id === this.selectedBait);
        const time = TIME_OF_DAY.find(t => t.id === this.selectedTime);
        if (!loc || !bait || !time) return false;

        // Base bite chance
        const gear = this.getGear();
        const weatherBiteMod = this.currentWeather ? this.currentWeather.biteMultiplier : 1.0;
        let chance = 0.25 * bait.effectiveness[loc.type] * time.multiplier * (1 + gear.finder.biteBonus) * weatherBiteMod;

        // Cast distance bonus: sweet spot around 60-80
        if (this.castDistance > 50 && this.castDistance < 90) chance *= 1.3;

        // Roll
        if (Math.random() < chance) {
            // Determine which fish
            this.selectFish();
            return this.activeFish !== null;
        }
        return false;
    },

    selectFish() {
        const loc = LOCATIONS.find(l => l.id === this.selectedLocation);
        const bait = BAITS.find(b => b.id === this.selectedBait);
        const time = TIME_OF_DAY.find(t => t.id === this.selectedTime);

        const available = FISH_SPECIES.filter(f => f.locations.includes(loc.id));
        if (available.length === 0) { this.activeFish = null; return; }

        // Weight each fish by rarity, bait preference, time bonus
        const weighted = available.map(fish => {
            let w = fish.rarity;
            if (bait.attracts.includes(fish.id)) w *= 2.5;
            if (fish.nightBonus && time.id === 'night') w *= fish.nightBonus;
            if (fish.legendary) w *= 0.5;

            // Cast distance affects what you can reach
            if (this.castDistance < 30 && fish.difficulty > 6) w *= 0.3;
            if (this.castDistance > 70 && fish.rarity < 0.15) w *= 1.5;

            // Weather rare bonus
            if (this.currentWeather && fish.rarity < 0.15) w *= this.currentWeather.rareBonus;

            return { fish, weight: w };
        });

        // Weighted random selection
        const totalW = weighted.reduce((sum, w) => sum + w.weight, 0);
        let roll = Math.random() * totalW;
        for (const { fish, weight } of weighted) {
            roll -= weight;
            if (roll <= 0) {
                this.activeFish = fish;

                // Generate weight and length
                const sizeRoll = Math.random();
                const timeData = TIME_OF_DAY.find(t => t.id === Game.selectedTime) || TIME_OF_DAY[0];
                // Skewed toward smaller fish - bigger specimens are rarer
                // sizeBonus > 1 flattens the curve, giving bigger fish on average
                const weatherSizeBonus = Game.currentWeather ? Game.currentWeather.sizeBonus : 1.0;
                const sizeExponent = 1.5 / ((timeData.sizeBonus || 1.0) * weatherSizeBonus);
                const sizeFactor = Math.pow(sizeRoll, sizeExponent);
                this.activeFishWeight = fish.minWeight + (fish.maxWeight - fish.minWeight) * sizeFactor;
                this.activeFishLength = fish.minLength + (fish.maxLength - fish.minLength) * sizeFactor;
                this.fishDifficulty = fish.difficulty;
                return;
            }
        }
        // Fallback
        this.activeFish = available[0];
        this.activeFishWeight = available[0].minWeight;
        this.activeFishLength = available[0].minLength;
        this.fishDifficulty = available[0].difficulty;
    },

    startFight() {
        this.phase = 'fighting';
        this.tension = 0.45;
        this.fishProgress = 0;
        this.reeling = false;
        this.fishPullTimer = 500;
        this.fishPullStrength = 0.3;
        this.fightTime = 0;
        UI.setPrompt('Hold MELLOMROM for å dra inn! Hold spenningen i grønn sone!', true);
    },

    fishCaught() {
        this.phase = 'idle';
        this.castsLeft--;

        const fish = this.activeFish;
        const weight = this.activeFishWeight;
        const length = this.activeFishLength;
        const points = (weight / fish.recordWeight) * 100;

        // Coins: base + rarity bonus + size bonus
        let coins = Math.round(10 + fish.difficulty * 5 + points * 0.5);
        if (fish.legendary) coins *= 2;

        // Check if new species
        const isNew = !Save.data.caughtSpecies[fish.id];

        // Update save
        if (!Save.data.caughtSpecies[fish.id]) {
            Save.data.caughtSpecies[fish.id] = {
                bestWeight: weight,
                bestLength: length,
                bestPoints: points,
                count: 1,
                firstCaught: Date.now()
            };
            coins += 25; // New species bonus
        } else {
            const data = Save.data.caughtSpecies[fish.id];
            data.count++;
            if (weight > data.bestWeight) {
                data.bestWeight = weight;
                data.bestPoints = points;
            }
            if (length > data.bestLength) data.bestLength = length;
        }

        Save.data.coins += coins;
        Save.data.totalCoins += coins;
        Save.data.totalCatches++;
        Save.data.totalPoints += points;
        Save.data.totalWeight += weight;
        Save.save();

        // Check medal for sound
        const medalName = UI.getMedalName(fish, weight);
        if (medalName) SFX.play('medalFanfare');
        SFX.play('coinDing');

        this.dayCoins += coins;
        this.dayPoints += points;
        this.daySpecies.add(fish.id);
        this.dayCatches.push({ fish, weight, length, points, coins, isNew });

        // Check daily challenge
        if (DailyChallenge.checkProgress(this.dayCatches, this.selectedLocation)) {
            // Challenge just completed — show reward in catch overlay
        }

        // Update highscores - biggest catch
        Save.data.highscores.biggestCatch.push({
            name: fish.name, weight, points
        });
        Save.data.highscores.biggestCatch.sort((a, b) => b.weight - a.weight);
        Save.data.highscores.biggestCatch = Save.data.highscores.biggestCatch.slice(0, 20);
        Save.save();

        // Show catch overlay
        this.showCatchResult(fish, weight, length, points, coins, isNew);
    },

    fishEscaped(reason) {
        this.phase = 'idle';
        this.castsLeft--;
        this.updateHUD();

        if (reason.includes('røk') || reason.includes('glapp')) SFX.play('lineSnap');
        else SFX.play('sadTrombone');

        document.getElementById('escape-title').textContent = 'Fisken slapp!';
        document.getElementById('escape-reason').textContent = reason;
        UI.showOverlay('overlay-escape');
    },

    showCatchResult(fish, weight, length, points, coins, isNew) {
        const formatW = (g) => g >= 1000 ? (g / 1000).toFixed(2) + ' kg' : g.toFixed(0) + ' g';
        const medal = UI.getMedalForFish(fish, weight);
        const medalName = UI.getMedalName(fish, weight);

        document.getElementById('catch-medal').textContent = medal;
        document.getElementById('catch-title').textContent =
            fish.legendary ? 'LEGENDARISK FANGST!' : isNew ? 'Ny art oppdaget!' : 'Fin fangst!';
        document.getElementById('catch-species').textContent = fish.name;
        document.getElementById('catch-weight').textContent = formatW(weight);
        document.getElementById('catch-length').textContent = `${length.toFixed(1)} cm`;
        document.getElementById('catch-points').textContent = `${points.toFixed(2)}`;
        document.getElementById('catch-coins').textContent = `+${coins}`;

        // Medal info
        const medalInfo = document.getElementById('catch-medal-info');
        if (medalName) {
            medalInfo.style.display = 'block';
            medalInfo.innerHTML = `<span class="medal-badge">${medal} ${medalName}medalje!</span>`;
        } else {
            medalInfo.style.display = 'none';
        }

        const newBadge = document.getElementById('catch-new');
        newBadge.style.display = isNew ? 'inline-block' : 'none';

        // Draw fish
        const container = document.getElementById('catch-fish-art');
        container.innerHTML = '<canvas width="200" height="100"></canvas>';
        const canvas = container.querySelector('canvas');
        FishRenderer.draw(canvas.getContext('2d'), fish, 200, 100, 1.2);

        UI.showOverlay('overlay-catch');
    },

    closeCatchOverlay() {
        UI.hideOverlay('overlay-catch');
        this.updateHUD();
        if (this.castsLeft <= 0) {
            this.endDay();
        } else {
            UI.setPrompt('Trykk MELLOMROM for å kaste igjen', true);
        }
    },

    closeEscapeOverlay() {
        UI.hideOverlay('overlay-escape');
        if (this.castsLeft <= 0) {
            this.endDay();
        } else {
            UI.setPrompt('Trykk MELLOMROM for å kaste igjen', true);
        }
    },

    endDay() {
        this.running = false;
        if (this.animFrame) cancelAnimationFrame(this.animFrame);
        UI.setPrompt('', false);

        Save.data.daysPlayed++;

        // Track location history
        if (!Save.data.locationHistory) Save.data.locationHistory = {};
        Save.data.locationHistory[this.selectedLocation] = (Save.data.locationHistory[this.selectedLocation] || 0) + 1;

        // Final daily challenge check
        DailyChallenge.checkProgress(this.dayCatches, this.selectedLocation);

        // Update highscores
        const loc = LOCATIONS.find(l => l.id === this.selectedLocation);
        Save.data.highscores.bestDayPoints.push({
            points: this.dayPoints,
            catches: this.dayCatches.length,
            location: loc ? loc.name : '?'
        });
        Save.data.highscores.bestDayPoints.sort((a, b) => b.points - a.points);
        Save.data.highscores.bestDayPoints = Save.data.highscores.bestDayPoints.slice(0, 20);

        Save.data.highscores.bestDaySpecies.push({
            species: this.daySpecies.size,
            catches: this.dayCatches.length,
            location: loc ? loc.name : '?'
        });
        Save.data.highscores.bestDaySpecies.sort((a, b) => b.species - a.species);
        Save.data.highscores.bestDaySpecies = Save.data.highscores.bestDaySpecies.slice(0, 20);

        Save.save();

        // Vis oppsummering
        const formatW = (g) => g >= 1000 ? (g / 1000).toFixed(2) + ' kg' : g.toFixed(0) + ' g';
        const statsDiv = document.getElementById('summary-stats');
        statsDiv.innerHTML = `
            <div class="summary-stat"><div class="summary-stat-value">${this.dayCatches.length}</div><div class="summary-stat-label">Fisk fanget</div></div>
            <div class="summary-stat"><div class="summary-stat-value">${this.daySpecies.size}</div><div class="summary-stat-label">Unike arter</div></div>
            <div class="summary-stat"><div class="summary-stat-value">${this.dayPoints.toFixed(1)}</div><div class="summary-stat-label">Totale poeng</div></div>
            <div class="summary-stat"><div class="summary-stat-value">${this.dayCoins}</div><div class="summary-stat-label">Mynter tjent</div></div>
        `;

        const catchesDiv = document.getElementById('summary-catches');
        if (this.dayCatches.length > 0) {
            catchesDiv.innerHTML = '<h3>Fangster</h3>' + this.dayCatches.map(c => {
                const medal = UI.getMedalForFish(c.fish, c.weight);
                return `<div class="summary-catch-item">
                    <span>${c.fish.name} — ${formatW(c.weight)}${c.isNew ? ' ✨' : ''}</span>
                    <span>${c.points.toFixed(1)} poeng ${medal}</span>
                </div>`;
            }).join('');
        } else {
            catchesDiv.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:16px;">Ingen fisk fanget i dag. Prøv annet agn eller sted!</p>';
        }

        UI.showOverlay('overlay-summary');
    },

    updateHUD() {
        const loc = LOCATIONS.find(l => l.id === this.selectedLocation);
        const bait = BAITS.find(b => b.id === this.selectedBait);
        document.getElementById('hud-location').textContent = loc ? `${loc.icon} ${loc.name}` : '';
        document.getElementById('hud-bait').textContent = bait ? `${bait.icon} ${bait.name}` : '';
        document.getElementById('hud-casts-left').textContent = this.castsLeft;
        document.getElementById('hud-casts-total').textContent = this.castsTotal;
        document.getElementById('hud-coins').textContent = `${Save.data.coins} mynter`;

        // Knot quality
        const knotEl = document.getElementById('hud-knot');
        if (knotEl) {
            const kq = this.knotQuality;
            let knotColor = kq >= 80 ? '#FFD700' : kq >= 50 ? '#C0C0C0' : '#E74C3C';
            knotEl.innerHTML = `<span style="color:${knotColor}">Knute: ${kq}%</span>`;
        }

        // Weather
        const weatherEl = document.getElementById('hud-weather');
        if (weatherEl && this.currentWeather) {
            weatherEl.textContent = `${this.currentWeather.icon} ${this.currentWeather.name}`;
        }

        // Daily challenge indicator
        const challengeEl = document.getElementById('hud-challenge');
        if (challengeEl && DailyChallenge.current && !DailyChallenge.isCompleted()) {
            const c = DailyChallenge.current;
            const pct = c.target > 0 ? Math.min(100, (c.progress / c.target) * 100).toFixed(0) : 0;
            challengeEl.textContent = `⭐ ${pct}%`;
            challengeEl.title = c.description;
        } else if (challengeEl) {
            challengeEl.textContent = DailyChallenge.isCompleted() ? '⭐ ✓' : '';
        }
    },

    handleKey(e) {
        if (e.code !== 'Space') return;
        e.preventDefault();

        // Ignore input during catch animation
        if (this.phase === 'catchAnim') return;

        if (this.phase === 'idle' && this.castsLeft > 0) {
            this.phase = 'casting';
            this.power = 0;
            this.powerDir = 1;
            SFX.play('castWhoosh');
            UI.setPrompt('Trykk MELLOMROM for å sette kastkraft!', true);
        } else if (this.phase === 'casting') {
            this.castDistance = this.power;
            this.phase = 'waiting';
            this.waitTimer = 2000 + Math.random() * 3000;

            // Splash effect
            const wl = Scene.height * 0.42;
            const bobX = Scene.width * 0.15 + this.castDistance * Scene.width * 0.007;
            Scene.addSplash(bobX, wl);
            SFX.play('splash');

            UI.setPrompt('Venter på napp...', true);
        } else if (this.phase === 'bite') {
            this.startFight();
        }
    },

    handleKeyUp(e) {
        if (e.code === 'Space') {
            this.reeling = false;
        }
    },

    handleKeyDown(e) {
        if (e.code === 'Space' && this.phase === 'fighting') {
            e.preventDefault();
            this.reeling = true;
        }
    }
};

// --- Input Setup ---
let spaceHandled = false;

document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        if (KnotGame.active) {
            if (!spaceHandled) {
                spaceHandled = true;
                KnotGame.handleInput();
            }
            return;
        }
        if (Game.phase === 'fighting') {
            Game.reeling = true;
        } else if (!spaceHandled) {
            spaceHandled = true;
            Game.handleKey(e);
        }
    }
});

document.addEventListener('keyup', (e) => {
    if (e.code === 'Space') {
        spaceHandled = false;
        Game.reeling = false;
    }
});

// Touch support for mobile
let touchActive = false;
document.addEventListener('touchstart', (e) => {
    if (KnotGame.active) {
        KnotGame.handleInput();
        return;
    }
    if (!Game.running) return;
    touchActive = true;
    if (Game.phase === 'fighting') {
        Game.reeling = true;
    } else {
        Game.handleKey({ code: 'Space', preventDefault: () => {} });
    }
});

document.addEventListener('touchend', (e) => {
    touchActive = false;
    Game.reeling = false;
});

// --- Init ---
Save.load();
DailyChallenge.generate();

// Update title screen challenge banner
(function updateChallengeBanner() {
    const banner = document.getElementById('daily-challenge-banner');
    if (!banner) return;
    if (DailyChallenge.isCompleted()) {
        banner.innerHTML = '<span class="challenge-done">⭐ Dagens utfordring fullført!</span>';
    } else if (DailyChallenge.current) {
        banner.innerHTML = `<span class="challenge-active">⭐ ${DailyChallenge.current.description} — Belønning: ${DailyChallenge.current.reward} mynter</span>`;
    }
})();

// Update sound button on load
UI.updateSoundButton();
