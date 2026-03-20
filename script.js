const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const logDiv = document.getElementById('log');

canvas.width = 600;
canvas.height = 400;

let gameState = 'IDLE'; 
let power = 0;
let powerDirection = 1;
let activeFish = null;
let caughtSpecies = JSON.parse(localStorage.getItem('fishingLog')) || [];

const FISH_DATA = [
    { name: "Common Perch", color: "#cd7f32", rarity: 0.8 },
    { name: "Northern Pike", color: "#7f8c8d", rarity: 0.4 },
    { name: "Golden Trout", color: "#f1c40f", rarity: 0.1 }
];

function update() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw Water
    ctx.fillStyle = "#2980b9";
    ctx.fillRect(0, 200, canvas.width, 200);

    if (gameState === 'IDLE') {
        ctx.fillStyle = "white";
        ctx.font = "20px Arial";
        ctx.fillText("Ready to fish? Press SPACE", 180, 180);
    }

    if (gameState === 'CASTING') {
        power += 2 * powerDirection;
        if (power > 100 || power < 0) powerDirection *= -1;
        
        ctx.fillStyle = "#ecf0f1";
        ctx.fillRect(200, 100, 200, 20);
        ctx.fillStyle = "#e67e22";
        ctx.fillRect(200, 100, power * 2, 20);
        ctx.fillStyle = "white";
        ctx.fillText("Power", 270, 90);
    }

    if (gameState === 'WAITING') {
        ctx.fillStyle = "white";
        ctx.fillText("Waiting for a bite...", 220, 300);
    }

    if (gameState === 'HOOKING') {
        ctx.fillStyle = "#e74c3c";
        ctx.font = "bold 40px Arial";
        ctx.fillText("BITING! PRESS SPACE!", 100, 180);
    }

    if (gameState === 'CAUGHT') {
        ctx.fillStyle = activeFish.color;
        ctx.font = "bold 25px Arial";
        ctx.fillText(`Cought: ${activeFish.name}!`, 180, 150);
        ctx.fillStyle = "white";
        ctx.font = "16px Arial";
        ctx.fillText("Press SPACE to cast again", 200, 190);
    }

    requestAnimationFrame(update);
}

window.addEventListener('keydown', (e) => {
    if (e.code !== 'Space') return;
    e.preventDefault(); // Stop page from scrolling

    if (gameState === 'IDLE') gameState = 'CASTING';
    else if (gameState === 'CASTING') {
        gameState = 'WAITING';
        setTimeout(triggerBite, 1000 + Math.random() * 2000);
    } 
    else if (gameState === 'HOOKING') catchFish();
    else if (gameState === 'CAUGHT') gameState = 'IDLE';
});

function triggerBite() {
    if (gameState === 'WAITING') {
        gameState = 'HOOKING';
        setTimeout(() => {
            if (gameState === 'HOOKING') {
                gameState = 'IDLE';
                alert("The fish spat the hook!");
            }
        }, 700); // 0.7 seconds to react
    }
}

function catchFish() {
    const roll = Math.random();
    let fish = roll < 0.1 ? FISH_DATA[2] : (roll < 0.4 ? FISH_DATA[1] : FISH_DATA[0]);
    activeFish = fish;
    gameState = 'CAUGHT';
    scoreElement.innerText = parseInt(scoreElement.innerText) + 1;

    if (!caughtSpecies.includes(fish.name)) {
        caughtSpecies.push(fish.name);
        localStorage.setItem('fishingLog', JSON.stringify(caughtSpecies));
        updateLogUI();
    }
}

function updateLogUI() {
    if (caughtSpecies.length === 0) return;
    logDiv.innerHTML = caughtSpecies.map(f => `<span class="fish-tag">${f}</span>`).join("");
}

// Initialize
updateLogUI();
update();
