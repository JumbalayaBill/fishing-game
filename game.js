// ============================================================
// ArtsFiske: Specimen Hunter - Game Engine
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
            const raw = localStorage.getItem('artsfiske_specimen_hunter');
            this.data = raw ? { ...DEFAULT_SAVE, ...JSON.parse(raw) } : { ...DEFAULT_SAVE };
        } catch { this.data = { ...DEFAULT_SAVE }; }
        // Ensure nested objects
        if (!this.data.highscores) this.data.highscores = { bestDayPoints: [], bestDaySpecies: [], biggestCatch: [] };
        if (!this.data.caughtSpecies) this.data.caughtSpecies = {};
    },
    save() {
        localStorage.setItem('artsfiske_specimen_hunter', JSON.stringify(this.data));
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
        // Locations
        const locGrid = document.getElementById('location-options');
        locGrid.innerHTML = LOCATIONS.map(loc => {
            const unlocked = Save.data.unlockedLocations.includes(loc.id);
            const canUnlock = !unlocked && Save.data.coins >= (loc.unlockCost || 0) &&
                Object.keys(Save.data.caughtSpecies).length >= (loc.unlockSpecies || 0);
            return `<div class="option-card ${!unlocked ? 'locked' : ''}" data-type="location" data-id="${loc.id}"
                onclick="UI.selectOption('location', '${loc.id}', ${unlocked}, ${!unlocked && canUnlock})">
                <div class="option-icon">${loc.icon}</div>
                <div class="option-name">${loc.name}</div>
                <div class="option-sub">${loc.nameEn}</div>
                ${!unlocked ? `<div class="option-cost">${loc.unlockCost} coins + ${loc.unlockSpecies} species</div>` : ''}
            </div>`;
        }).join('');

        // Baits
        const baitGrid = document.getElementById('bait-options');
        baitGrid.innerHTML = BAITS.map(b => {
            const unlocked = Save.data.unlockedBaits.includes(b.id);
            const canBuy = !unlocked && Save.data.coins >= b.cost;
            return `<div class="option-card ${!unlocked ? 'locked' : ''}" data-type="bait" data-id="${b.id}"
                onclick="UI.selectOption('bait', '${b.id}', ${unlocked}, ${canBuy})">
                <div class="option-icon">${b.icon}</div>
                <div class="option-name">${b.name}</div>
                <div class="option-sub">${b.nameEn}</div>
                ${!unlocked ? `<div class="option-cost">${b.cost} coins</div>` : ''}
            </div>`;
        }).join('');

        // Time
        const timeGrid = document.getElementById('time-options');
        timeGrid.innerHTML = TIME_OF_DAY.map(t => {
            return `<div class="option-card" data-type="time" data-id="${t.id}"
                onclick="UI.selectOption('time', '${t.id}', true, false)">
                <div class="option-icon">${t.icon}</div>
                <div class="option-name">${t.name}</div>
                <div class="option-sub">${t.nameEn}</div>
            </div>`;
        }).join('');

        // Stats
        document.getElementById('player-coins').textContent = Save.data.coins;
        document.getElementById('player-species').textContent = Object.keys(Save.data.caughtSpecies).length;

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
        const attracted = fishHere.filter(f => bait.attracts.includes(f.id));
        const eff = bait.effectiveness[loc.type] * 100;

        document.getElementById('setup-info-text').innerHTML =
            `<strong>${loc.name}</strong> — ${loc.description}<br>` +
            `<span style="color:var(--text-muted)">${fishHere.length} species available. ` +
            `Bait effectiveness: <span style="color:${eff > 60 ? 'var(--success)' : eff > 30 ? 'var(--warning)' : 'var(--danger)'}">${eff.toFixed(0)}%</span>. ` +
            `${time.description}</span>`;
    },

    renderCollection(filter = 'all') {
        const grid = document.getElementById('collection-grid');
        const caught = Save.data.caughtSpecies;
        const caughtCount = Object.keys(caught).length;
        const total = FISH_SPECIES.length;

        document.getElementById('collection-stats').innerHTML =
            `<strong>${caughtCount}</strong> / ${total} species discovered &nbsp;|&nbsp; ` +
            `Total catches: <strong>${Save.data.totalCatches}</strong> &nbsp;|&nbsp; ` +
            `Total points: <strong>${Save.data.totalPoints.toFixed(2)}</strong>`;

        let species = [...FISH_SPECIES];
        if (filter === 'caught') species = species.filter(f => caught[f.id]);
        if (filter === 'uncaught') species = species.filter(f => !caught[f.id]);
        if (filter === 'fw') species = species.filter(f => f.type === 'fw');
        if (filter === 'sw') species = species.filter(f => f.type === 'sw');

        grid.innerHTML = species.map(fish => {
            const data = caught[fish.id];
            const isCaught = !!data;
            const medal = data ? this.getMedalEmoji(data.bestPoints) : '';

            return `<div class="collection-card ${isCaught ? '' : 'uncaught'}">
                <div class="fish-preview"><canvas data-fish-id="${fish.id}" width="180" height="60"></canvas></div>
                <div class="fish-name">${isCaught ? fish.name : '???'}</div>
                <div class="fish-name-en">${isCaught ? fish.nameEn : 'Undiscovered'}</div>
                <div class="fish-type">${fish.type === 'fw' ? 'Freshwater' : 'Saltwater'} — ${fish.locations.map(l => LOCATIONS.find(lo => lo.id === l).name).join(', ')}</div>
                ${isCaught ? `
                    <div class="fish-best">Best: <strong>${data.bestWeight.toFixed(2)} kg</strong> — <strong>${data.bestPoints.toFixed(2)} pts</strong></div>
                    <div class="fish-count">Caught ${data.count}x. Record: ${fish.recordWeight} kg</div>
                    ${medal ? `<div class="fish-medal">${medal}</div>` : ''}
                ` : `<div class="fish-best">Record: ${fish.recordWeight} kg</div>`}
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

    getMedalEmoji(points) {
        if (points >= MEDALS.gold) return '🥇';
        if (points >= MEDALS.silver) return '🥈';
        if (points >= MEDALS.bronze) return '🥉';
        return '';
    },

    showHighscoreTab(tab, btn) {
        document.querySelectorAll('.highscore-tabs .btn-filter').forEach(b => b.classList.remove('active'));
        if (btn) btn.classList.add('active');
        else document.querySelector('.highscore-tabs .btn-filter')?.classList.add('active');

        const list = document.getElementById('highscore-list');
        const hs = Save.data.highscores;

        let items = [];
        if (tab === 'points') {
            items = (hs.bestDayPoints || []).slice(0, 10).map((entry, i) => ({
                rank: i + 1,
                value: entry.points.toFixed(2) + ' pts',
                label: `${entry.location} — ${entry.catches} catches`
            }));
        } else if (tab === 'species') {
            items = (hs.bestDaySpecies || []).slice(0, 10).map((entry, i) => ({
                rank: i + 1,
                value: entry.species + ' species',
                label: `${entry.location} — ${entry.catches} catches`
            }));
        } else if (tab === 'biggest') {
            items = (hs.biggestCatch || []).slice(0, 10).map((entry, i) => ({
                rank: i + 1,
                value: entry.weight.toFixed(2) + ' kg',
                label: `${entry.name} (${entry.nameEn}) — ${entry.points.toFixed(2)} pts`
            }));
        }

        if (items.length === 0) {
            list.innerHTML = '<div class="highscore-empty">No records yet. Go fishing!</div>';
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

    drawRodIdle(ctx, w, h, wl) {
        const baseX = w * 0.15;
        const baseY = h * 0.92;
        const tipX = w * 0.35;
        const tipY = wl - 10;

        ctx.strokeStyle = '#5D4E37';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(baseX, baseY);
        ctx.quadraticCurveTo(w * 0.2, h * 0.6, tipX, tipY);
        ctx.stroke();

        // Rod handle
        ctx.strokeStyle = '#3A2F1E';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(baseX, baseY);
        ctx.lineTo(baseX + 15, baseY - 20);
        ctx.stroke();

        // Reel
        ctx.fillStyle = '#888';
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

        ctx.strokeStyle = '#5D4E37';
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

        ctx.strokeStyle = '#5D4E37';
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

        ctx.strokeStyle = '#5D4E37';
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

        ctx.strokeStyle = 'rgba(200,200,200,0.5)';
        ctx.lineWidth = 1;
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
        ctx.fillText('BITE! Press SPACE!', w / 2, h * 0.3);
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
        ctx.strokeStyle = `rgba(200,200,200,${0.3 + state.tension * 0.7})`;
        ctx.lineWidth = 1.5;
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

        // Danger zones
        const greenStart = 0.2;
        const greenEnd = 0.7;

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
        ctx.fillText('SNAP', meterX + meterW / 2, meterY - 8);
        ctx.fillText('LOOSE', meterX + meterW / 2, meterY + meterH + 14);
        ctx.textAlign = 'start';

        // "TENSION" label
        ctx.save();
        ctx.translate(meterX - 12, meterY + meterH / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.font = '11px sans-serif';
        ctx.fillStyle = '#999';
        ctx.textAlign = 'center';
        ctx.fillText('TENSION', 0, 0);
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
        ctx.fillText(`Reeling in... ${(progress * 100).toFixed(0)}%`, w / 2, barY + 12);
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
        ctx.fillText('CAST POWER', w / 2, barY - 10);
        ctx.textAlign = 'start';
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

    // State machine
    phase: 'idle',  // idle, casting, waiting, bite, fighting
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

    start() {
        Save.load();
        UI.showScreen('screen-setup');
        UI.renderSetup();
    },

    beginFishing() {
        const loc = LOCATIONS.find(l => l.id === this.selectedLocation);
        if (!loc || !Save.data.unlockedLocations.includes(loc.id)) return;

        const bait = BAITS.find(b => b.id === this.selectedBait);
        if (!bait || !Save.data.unlockedBaits.includes(bait.id)) return;

        this.castsTotal = loc.castCount;
        this.castsLeft = loc.castCount;
        this.dayCoins = 0;
        this.dayCatches = [];
        this.daySpecies = new Set();
        this.dayPoints = 0;
        this.phase = 'idle';

        UI.showScreen('screen-fishing');
        Scene.init();
        this.updateHUD();
        UI.setPrompt('Press SPACE to cast your line', true);
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
            fishDifficulty: this.fishDifficulty
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
                    this.biteTimer = 1200; // ms to react
                    UI.setPrompt('BITE! Press SPACE now!', true);
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
                    UI.setPrompt('Too slow! The fish spat the hook. Press SPACE to cast again.', true);
                }
            }
        }

        if (this.phase === 'fighting') {
            this.fightTime += 16;

            // Fish pull behavior - varies by difficulty
            this.fishPullTimer -= 16;
            if (this.fishPullTimer <= 0) {
                // New pull pattern
                this.fishPullStrength = (0.3 + Math.random() * 0.7) * (this.fishDifficulty / 10);
                this.fishPullTimer = 400 + Math.random() * 800;

                // Aggressive fish have burst pulls
                if (this.activeFish.aggressive && Math.random() < 0.3) {
                    this.fishPullStrength *= 1.8;
                    this.fishPullTimer = 200;
                }
            }

            // Tension dynamics
            const rod = RODS.find(r => r.id === Save.data.currentRod) || RODS[0];
            const pullForce = this.fishPullStrength * 0.008;
            const reelForce = this.reeling ? 0.008 * (1 + rod.fightBonus) : 0;
            const decay = 0.004;

            this.tension += pullForce + reelForce - decay;

            // Fish progress
            if (this.reeling) {
                this.fishProgress += (0.002 + rod.fightBonus * 0.001) * (1 - this.fishPullStrength * 0.5);
            } else {
                this.fishProgress -= 0.001 * this.fishPullStrength;
            }

            // Clamp
            this.tension = Math.max(0, Math.min(1, this.tension));
            this.fishProgress = Math.max(0, Math.min(1, this.fishProgress));

            // Line snap — stronger rods allow higher tension
            const snapThreshold = 0.75 + (rod.lineStrength - 1) * 0.15;
            if (this.tension > snapThreshold) {
                this.fishEscaped('Line snapped! Too much tension.');
                return;
            }

            // Fish escapes (too loose)
            if (this.tension < 0.08 && this.fightTime > 1000) {
                this.fishEscaped('The fish shook the hook! Keep tension on the line.');
                return;
            }

            // Fish caught!
            if (this.fishProgress >= 1) {
                this.fishCaught();
                return;
            }
        }
    },

    rollForBite() {
        const loc = LOCATIONS.find(l => l.id === this.selectedLocation);
        const bait = BAITS.find(b => b.id === this.selectedBait);
        const time = TIME_OF_DAY.find(t => t.id === this.selectedTime);
        if (!loc || !bait || !time) return false;

        // Base bite chance
        let chance = 0.25 * bait.effectiveness[loc.type] * time.multiplier;

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
                // Skewed toward smaller fish - bigger specimens are rarer
                const sizeFactor = Math.pow(sizeRoll, 1.5);
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
        UI.setPrompt('Hold SPACE to reel in! Keep tension in the green zone!', true);
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
        Save.save();

        this.dayCoins += coins;
        this.dayPoints += points;
        this.daySpecies.add(fish.id);
        this.dayCatches.push({ fish, weight, length, points, coins, isNew });

        // Update highscores - biggest catch
        Save.data.highscores.biggestCatch.push({
            name: fish.name, nameEn: fish.nameEn, weight, points
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

        document.getElementById('escape-title').textContent = 'The fish got away!';
        document.getElementById('escape-reason').textContent = reason;
        UI.showOverlay('overlay-escape');
    },

    showCatchResult(fish, weight, length, points, coins, isNew) {
        // Medal
        let medal = '';
        if (points >= MEDALS.gold) medal = '🥇';
        else if (points >= MEDALS.silver) medal = '🥈';
        else if (points >= MEDALS.bronze) medal = '🥉';

        document.getElementById('catch-medal').textContent = medal;
        document.getElementById('catch-title').textContent =
            fish.legendary ? 'LEGENDARY CATCH!' : isNew ? 'New Species Discovered!' : 'Nice Catch!';
        document.getElementById('catch-species').textContent = `${fish.name} (${fish.nameEn})`;
        document.getElementById('catch-weight').textContent = `${weight.toFixed(2)} kg`;
        document.getElementById('catch-length').textContent = `${length.toFixed(1)} cm`;
        document.getElementById('catch-points').textContent = `${points.toFixed(2)}`;
        document.getElementById('catch-coins').textContent = `+${coins}`;

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
            UI.setPrompt('Press SPACE to cast again', true);
        }
    },

    closeEscapeOverlay() {
        UI.hideOverlay('overlay-escape');
        if (this.castsLeft <= 0) {
            this.endDay();
        } else {
            UI.setPrompt('Press SPACE to cast again', true);
        }
    },

    endDay() {
        this.running = false;
        if (this.animFrame) cancelAnimationFrame(this.animFrame);
        UI.setPrompt('', false);

        Save.data.daysPlayed++;

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

        // Show summary
        const statsDiv = document.getElementById('summary-stats');
        statsDiv.innerHTML = `
            <div class="summary-stat"><div class="summary-stat-value">${this.dayCatches.length}</div><div class="summary-stat-label">Fish Caught</div></div>
            <div class="summary-stat"><div class="summary-stat-value">${this.daySpecies.size}</div><div class="summary-stat-label">Unique Species</div></div>
            <div class="summary-stat"><div class="summary-stat-value">${this.dayPoints.toFixed(1)}</div><div class="summary-stat-label">Total Points</div></div>
            <div class="summary-stat"><div class="summary-stat-value">${this.dayCoins}</div><div class="summary-stat-label">Coins Earned</div></div>
        `;

        const catchesDiv = document.getElementById('summary-catches');
        if (this.dayCatches.length > 0) {
            catchesDiv.innerHTML = '<h3>Catches</h3>' + this.dayCatches.map(c => {
                const medal = UI.getMedalEmoji(c.points);
                return `<div class="summary-catch-item">
                    <span>${c.fish.name} — ${c.weight.toFixed(2)} kg${c.isNew ? ' ✨' : ''}</span>
                    <span>${c.points.toFixed(1)} pts ${medal}</span>
                </div>`;
            }).join('');
        } else {
            catchesDiv.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:16px;">No fish caught today. Try different bait or location!</p>';
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
        document.getElementById('hud-coins').textContent = `${Save.data.coins} coins`;
    },

    handleKey(e) {
        if (e.code !== 'Space') return;
        e.preventDefault();

        if (this.phase === 'idle' && this.castsLeft > 0) {
            this.phase = 'casting';
            this.power = 0;
            this.powerDir = 1;
            UI.setPrompt('Press SPACE to set cast power!', true);
        } else if (this.phase === 'casting') {
            this.castDistance = this.power;
            this.phase = 'waiting';
            this.waitTimer = 2000 + Math.random() * 3000;

            // Splash effect
            const wl = Scene.height * 0.42;
            const bobX = Scene.width * 0.15 + this.castDistance * Scene.width * 0.007;
            Scene.addSplash(bobX, wl);

            UI.setPrompt('Waiting for a bite...', true);
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
