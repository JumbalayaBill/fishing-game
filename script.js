// Add this at the top of your script.js
let caughtSpecies = JSON.parse(localStorage.getItem('fishingLog')) || [];

function catchFish() {
    const roll = Math.random();
    let fish;
    
    if (roll < 0.1) fish = FISH_DATA[2]; // Golden Trout
    else if (roll < 0.4) fish = FISH_DATA[1]; // Northern Pike
    else fish = FISH_DATA[0]; // Common Perch

    activeFish = fish;
    gameState = 'CAUGHT';

    // Save to Collection Log
    if (!caughtSpecies.includes(fish.name)) {
        caughtSpecies.push(fish.name);
        localStorage.setItem('fishingLog', JSON.stringify(caughtSpecies));
        updateLogUI();
    }
}

function updateLogUI() {
    // This assumes you add a <div id="log"></div> to your HTML
    const logDiv = document.getElementById('log');
    if(logDiv) {
        logDiv.innerHTML = "<h3>Your Collection:</h3>" + caughtSpecies.join(", ");
    }
}

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');

// Game Settings
canvas.width = 600;
canvas.height = 400;

let gameState = 'IDLE'; // IDLE, CASTING, WAITING, HOOKING, CAUGHT
let power = 0;
let powerDirection = 1;
let activeFish = null;

const FISH_DATA = [
    { name: "Common Perch", color: "#8e44ad", weight: "1-2 lbs", rarity: 0.8 },
    { name: "Northern Pike", color: "#27ae60", weight: "5-10 lbs", rarity: 0.4 },
    { name: "Golden Trout", color: "#f1c40f", weight: "3-5 lbs", rarity: 0.1 }
];

// Main Game Loop
function update() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw Water
    ctx.fillStyle = "#3498db";
    ctx.fillRect(0, 150, canvas.width, 250);

    if (gameState === 'CASTING') {
        // Power bar logic
        power += 2 * powerDirection;
        if (power > 100 || power < 0) powerDirection *= -1;
        
        ctx.fillStyle = "white";
        ctx.fillRect(50, 50, 200, 20);
        ctx.fillStyle = "red";
        ctx.fillRect(50, 50, power * 2, 20);
        ctx.fillStyle = "black";
        ctx.fillText("SPACE to Cast!", 50, 45);
    }

    if (gameState === 'WAITING') {
        ctx.fillStyle = "white";
        ctx.fillText("Waiting for a bite...", canvas.width/2 - 40, 200);
    }

    if (gameState === 'HOOKING') {
        ctx.fillStyle = "#e74c3c";
        ctx.font = "30px Arial";
        ctx.fillText("!!! BITE !!!", canvas.width/2 - 50, 200);
    }

    if (gameState === 'CAUGHT') {
        ctx.fillStyle = "white";
        ctx.font = "20px Arial";
        ctx.fillText(`You caught a ${activeFish.name}!`, canvas.width/2 - 80, 180);
        ctx.fillText("Press SPACE to reset", canvas.width/2 - 80, 210);
    }

    requestAnimationFrame(update);
}

// Input Handling
window.addEventListener('keydown', (e) => {
    if (e.code !== 'Space') return;

    if (gameState === 'IDLE') {
        gameState = 'CASTING';
    } 
    else if (gameState === 'CASTING') {
        gameState = 'WAITING';
        // Random time until a bite (1-3 seconds)
        setTimeout(triggerBite, 1000 + Math.random() * 2000);
    } 
    else if (gameState === 'HOOKING') {
        catchFish();
    }
    else if (gameState === 'CAUGHT') {
        gameState = 'IDLE';
        power = 0;
    }
});

function triggerBite() {
    if (gameState === 'WAITING') {
        gameState = 'HOOKING';
        // You only have 600ms to react!
        setTimeout(() => {
            if (gameState === 'HOOKING') {
                gameState = 'IDLE';
                alert("The fish got away!");
            }
        }, 600);
    }
}

function catchFish() {
    const roll = Math.random();
    // Simple rarity logic
    if (roll < 0.2) activeFish = FISH_DATA[2];
    else if (roll < 0.5) activeFish = FISH_DATA[1];
    else activeFish = FISH_DATA[0];

    gameState = 'CAUGHT';
    scoreElement.innerText = parseInt(scoreElement.innerText) + 1;
}

update();
