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
