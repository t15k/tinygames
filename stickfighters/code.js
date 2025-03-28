// Game state
const gameState = {
    playerTeam: [
        {
            name: "Hektor",
            damage: 2,
            reaction: 5,
            stamina: 10,
            maxStamina: 10,
            health: 10,
            maxHealth: 10,
            team: "player",
            defeated: false,
            image: "images/Hektor_Stick.png" // Added image path
        },
        {
            name: "Osvald",
            damage: 3,
            reaction: 3,
            stamina: 10,
            maxStamina: 10,
            health: 12,
            maxHealth: 12,
            team: "player",
            defeated: false,
            image: "images/Osvald_Stick.png" // Added image path
        }
    ],
    computerTeam: [
        {
            name: "Angry guy",
            damage: 4,
            reaction: 6,
            stamina: 10,
            maxStamina: 10,
            health: 15,
            maxHealth: 15,
            team: "computer",
            defeated: false,
            image: "images/Angry_Stick.png" // Added image path
        }
    ],
    turnOrder: [],
    currentTurnIndex: 0,
    currentCombatant: null,
    selectedAction: "attack",
    selectedTarget: null,
    gameOver: false
};

// DOM references
const playerCombatantsEl = document.getElementById("player-combatants");
const computerCombatantsEl = document.getElementById("computer-combatants");
const statusMessageEl = document.getElementById("status-message");
const actionMenuEl = document.getElementById("action-menu");
const targetSelectionEl = document.getElementById("target-selection");
const targetsEl = document.getElementById("targets");
const cancelTargetBtn = document.getElementById("cancel-target");

// Debug function to help troubleshoot
function debug(message) {
    console.log(message);
    const debugEl = document.getElementById('debug-output');
    if (debugEl) {
        debugEl.style.display = 'block';
        const p = document.createElement('p');
        p.textContent = typeof message === 'object' 
            ? JSON.stringify(message) 
            : message;
        debugEl.appendChild(p);
    }
}

// Initialize the game
function initGame() {
    console.log("Game initializing...");
    console.log("Player team:", gameState.playerTeam);
    console.log("Computer team:", gameState.computerTeam);
    
    renderCombatants();
    determineTurnOrder();
    console.log("Turn order:", gameState.turnOrder.map(c => c.name));
    
    startNextTurn();
    
    // Set up event listeners
    setupEventListeners();
}

// Render all combatants to the screen
function renderCombatants() {
    renderTeam(gameState.playerTeam, playerCombatantsEl);
    renderTeam(gameState.computerTeam, computerCombatantsEl);
}

// Render a team of combatants
function renderTeam(team, containerElement) {
    // Ensure all combatants are rendered without replacing existing elements
    team.forEach(combatant => {
        if (!combatant) return;

        // Find existing combatant element
        let combatantEl = containerElement.querySelector(`.combatant[data-name="${combatant.name}"]`);
        
        if (!combatantEl) {
            // Create a new combatant element if it doesn't exist
            combatantEl = document.createElement("div");
            combatantEl.className = `combatant`;
            combatantEl.dataset.name = combatant.name;
            containerElement.appendChild(combatantEl);
        }

        // Update combatant's classes
        combatantEl.className = `combatant ${combatant.defeated ? 'defeated' : ''}`;
        if (gameState.currentCombatant === combatant) {
            combatantEl.classList.add("active");
        }

        // Update combatant's content
        combatantEl.innerHTML = `
            <h3>${combatant.name}</h3>
            <div class="combatant-image">
                <img src="${combatant.image}" alt="${combatant.name}">
            </div>
            <div class="stats">
                <div class="stat-label">Health:</div>
                <div>${combatant.health}/${combatant.maxHealth}</div>
                <div class="stat-label">Stamina:</div>
                <div>${combatant.stamina}/${combatant.maxStamina}</div>
                <div class="stat-label">Damage:</div>
                <div>${combatant.damage}</div>
                <div class="stat-label">Reaction:</div>
                <div>${combatant.reaction}</div>
            </div>
        `;

        // Handle image loading errors
        const img = combatantEl.querySelector('.combatant-image img');
        img.onerror = () => {
            console.error(`Failed to load image for ${combatant.name} at ${combatant.image}`);
        };

        // Store original background color as a data attribute
        if (!combatantEl.dataset.originalBackgroundColor) {
            const originalBackgroundColor = window.getComputedStyle(combatantEl).backgroundColor;
            combatantEl.dataset.originalBackgroundColor = originalBackgroundColor;
        }
    });
}

// Determine turn order based on reaction attribute
function determineTurnOrder() {
    const allCombatants = [...gameState.playerTeam, ...gameState.computerTeam];
    gameState.turnOrder = allCombatants.sort((a, b) => b.reaction - a.reaction);
    gameState.currentTurnIndex = 0;
}

// Start the next turn in sequence
function startNextTurn() {
    // Check if game is over
    if (checkGameOver()) return;
    
    // Find next alive combatant
    do {
        gameState.currentTurnIndex = (gameState.currentTurnIndex) % gameState.turnOrder.length;
        gameState.currentCombatant = gameState.turnOrder[gameState.currentTurnIndex];
        gameState.currentTurnIndex++;
    } while (gameState.currentCombatant.defeated);
    
    renderCombatants();
    
    if (gameState.currentCombatant.team === "player") {
        statusMessageEl.textContent = `${gameState.currentCombatant.name}'s turn. Choose an action.`;
        actionMenuEl.style.display = "flex";
    } else {
        statusMessageEl.textContent = `${gameState.currentCombatant.name}'s turn. Computer is thinking...`;
        actionMenuEl.style.display = "none";
        
        // Simulate computer thinking
        setTimeout(() => {
            computerTurn();
        }, 1500);
    }
}

// Check if the game is over
function checkGameOver() {
    const playerAlive = gameState.playerTeam.some(combatant => !combatant.defeated);
    const computerAlive = gameState.computerTeam.some(combatant => !combatant.defeated);
    
    if (!playerAlive) {
        endGame("Computer wins! All your combatants are defeated.");
        return true;
    } else if (!computerAlive) {
        endGame("You win! All enemy combatants are defeated.");
        return true;
    }
    
    return false;
}

// End the game with a message
function endGame(message) {
    gameState.gameOver = true;
    statusMessageEl.textContent = message;
    actionMenuEl.style.display = "none";
    targetSelectionEl.style.display = "none";
}

// Set up event listeners
function setupEventListeners() {
    // Action selection
    actionMenuEl.addEventListener("click", (e) => {
        const actionEl = e.target.closest("[data-action]");
        if (!actionEl) return;
        
        debug("Action clicked: " + actionEl.dataset.action);
        
        // Update selection
        document.querySelectorAll("[data-action]").forEach(el => el.classList.remove("selected"));
        actionEl.classList.add("selected");
        
        gameState.selectedAction = actionEl.dataset.action;
        
        // For attack action, show targets
        if (gameState.selectedAction === "attack") {
            if (gameState.currentCombatant.stamina < 2) {
                statusMessageEl.textContent = "Not enough stamina to attack. Try Recover instead.";
                return;
            }
            showTargetSelection();
        } else if (gameState.selectedAction === "recover") {
            performRecover();
        }
    });
    
    // Target selection
    targetsEl.addEventListener("click", handleTargetClick);
    
    // Cancel target selection
    cancelTargetBtn.addEventListener("click", () => {
        targetSelectionEl.classList.remove("active");
    });
    
    // Keyboard controls
    document.addEventListener("keydown", handleKeyboardInput);
}

// Handle target click
function handleTargetClick(e) {
    debug("Target clicked");
    const targetEl = e.target.closest(".target");
    if (!targetEl) return;
    
    debug(`Selected target: ${targetEl.dataset.name}`);
    
    // Update visual selection
    document.querySelectorAll(".target").forEach(el => el.classList.remove("selected"));
    targetEl.classList.add("selected");
    
    const targetName = targetEl.dataset.name;
    const targetTeam = targetEl.dataset.team === "player" ? gameState.playerTeam : gameState.computerTeam;
    gameState.selectedTarget = targetTeam.find(c => c.name === targetName);
    
    if (gameState.selectedTarget) {
        debug(`Found target object: ${gameState.selectedTarget.name}`);
        performAttack();
    } else {
        debug("Target not found in team array");
    }
}

// Handle keyboard input
function handleKeyboardInput(e) {
    if (gameState.gameOver || gameState.currentCombatant.team !== "player") return;
    
    debug(`Key pressed: ${e.key}`);
    
    // Menu navigation with arrow keys
    if (targetSelectionEl.classList.contains("active")) {
        handleTargetMenuKeyboard(e);
    } else {
        handleActionMenuKeyboard(e);
    }
}

// Handle keyboard input for action menu
function handleActionMenuKeyboard(e) {
    const actions = ["attack", "recover"];
    const currentIndex = actions.indexOf(gameState.selectedAction);
    let newIndex = currentIndex;
    
    switch (e.key) {
        case "ArrowLeft":
            newIndex = Math.max(0, currentIndex - 1);
            break;
        case "ArrowRight":
            newIndex = Math.min(actions.length - 1, currentIndex + 1);
            break;
        case "Enter":
            debug(`Enter pressed on action: ${actions[currentIndex]}`);
            const selectedAction = actions[currentIndex];
            
            if (selectedAction === "attack") {
                if (gameState.currentCombatant.stamina < 2) {
                    statusMessageEl.textContent = "Not enough stamina to attack. Try Recover instead.";
                    return;
                }
                showTargetSelection();
            } else if (selectedAction === "recover") {
                performRecover();
            }
            return;
    }
    
    if (newIndex !== currentIndex) {
        gameState.selectedAction = actions[newIndex];
        document.querySelectorAll("[data-action]").forEach(el => el.classList.remove("selected"));
        document.querySelector(`[data-action="${actions[newIndex]}"]`).classList.add("selected");
    }
}

// Show target selection UI
function showTargetSelection() {
    debug("Showing target selection");
    targetsEl.innerHTML = "";
    
    const targets = gameState.computerTeam.filter(combatant => !combatant.defeated);
    
    if (targets.length === 0) {
        statusMessageEl.textContent = "No targets available to attack.";
        return;
    }
    
    targets.forEach(target => {
        const targetEl = document.createElement("div");
        targetEl.className = "target";
        targetEl.dataset.name = target.name;
        targetEl.dataset.team = "computer";
        targetEl.textContent = target.name;
        targetsEl.appendChild(targetEl);
    });
    
    if (targets.length > 0) {
        targets[0].classList.add("selected");
    }
    
    // Show overlay
    document.getElementById('overlay').style.display = 'block';
    
    // Show target selection - using direct style changes
    targetSelectionEl.style.cssText = `
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
        z-index: 2000 !important;
    `;
    targetSelectionEl.classList.add('active');
    
    debug(`Target selection element display: ${targetSelectionEl.style.display}`);
    debug(`Target selection element visibility: ${targetSelectionEl.style.visibility}`);
    debug(`Target selection element opacity: ${targetSelectionEl.style.opacity}`);
    debug(`Target selection element dimensions: ${targetSelectionEl.offsetWidth}x${targetSelectionEl.offsetHeight}`);
    
    // Double check that we're showing the right one
    debug(`Target selector ID: ${targetSelectionEl.id}`);
    
    statusMessageEl.textContent = "Select a target to attack.";
}

// Handle keyboard input for target selection
function handleTargetMenuKeyboard(e) {
    const targets = Array.from(document.querySelectorAll(".target"));
    const currentIndex = targets.findIndex(t => t.classList.contains("selected"));
    let newIndex = currentIndex;
    
    debug(`Target menu keyboard: ${e.key}, current index: ${currentIndex}`);
    
    switch (e.key) {
        case "ArrowUp":
            newIndex = Math.max(0, currentIndex - 1);
            break;
        case "ArrowDown":
            newIndex = Math.min(targets.length - 1, currentIndex + 1);
            break;
        case "Enter":
            debug(`Enter pressed on target selection, index: ${currentIndex}`);
            if (currentIndex >= 0) {
                const selectedTarget = targets[currentIndex];
                const targetName = selectedTarget.dataset.name;
                const targetTeam = selectedTarget.dataset.team === "player" ? gameState.playerTeam : gameState.computerTeam;
                gameState.selectedTarget = targetTeam.find(c => c.name === targetName);
                
                debug(`Selected target using keyboard: ${targetName}`);
                if (gameState.selectedTarget) {
                    performAttack();
                }
            }
            return;
        case "Escape":
            debug("Escape pressed, canceling target selection");
            targetSelectionEl.classList.remove("active");
            targetSelectionEl.style.display = "none";
            return;
    }
    
    if (newIndex !== currentIndex && newIndex >= 0) {
        targets.forEach(t => t.classList.remove("selected"));
        targets[newIndex].classList.add("selected");
    }
}

// Perform attack action
function performAttack() {
    debug("Performing attack");
    if (!gameState.selectedTarget) {
        debug("Attack failed - no target selected");
        return;
    }
    
    if (gameState.currentCombatant.stamina < 2) {
        debug("Attack failed - not enough stamina");
        statusMessageEl.textContent = "Not enough stamina to attack. Try Recover instead.";
        return;
    }
    
    // 50% chance to hit
    const hitChance = Math.random() < 0.5;
    if (!hitChance) {
        statusMessageEl.textContent = `${gameState.currentCombatant.name} missed the attack on ${gameState.selectedTarget.name}!`;
        endTurnAfterDelay();
        return;
    }
    
    debug(`Attacking ${gameState.selectedTarget.name} with ${gameState.currentCombatant.name}`);
    
    gameState.currentCombatant.stamina -= 2;
    gameState.selectedTarget.health -= gameState.currentCombatant.damage;
    
    if (gameState.selectedTarget.health <= 0) {
        gameState.selectedTarget.health = 0;
        gameState.selectedTarget.defeated = true;
    }
    
    // Flash effect for being hit
    debug(`Calling flashCombatant for ${gameState.selectedTarget.name}`);
    flashCombatant(gameState.selectedTarget);
    
    statusMessageEl.textContent = `${gameState.currentCombatant.name} attacks ${gameState.selectedTarget.name} for ${gameState.currentCombatant.damage} damage!`;
    
    // Hide target selection and overlay
    targetSelectionEl.style.display = 'none';
    targetSelectionEl.classList.remove('active');
    document.getElementById('overlay').style.display = 'none';
    
    renderCombatants();
    
    // Move to next turn after a delay
    setTimeout(() => {
        startNextTurn();
    }, 1500);
}

// Flash effect for a combatant being hit
function flashCombatant(combatant) {
    const combatantEl = document.querySelector(`.combatant[data-name="${combatant.name}"]`);
    if (combatantEl) {
        debug(`Flashing combatant: ${combatant.name}`);
        
        // Add the flash class to bring the combatant to the front
        combatantEl.classList.add("flash");
        
        // Temporarily change the background color to red
        combatantEl.style.backgroundColor = "red";
        
        setTimeout(() => {
            // Reset the background color and remove the flash class
            combatantEl.style.backgroundColor = combatantEl.dataset.originalBackgroundColor;
            combatantEl.classList.remove("flash");
            debug(`Flash ended for combatant: ${combatant.name}`);
        }, 500); // Flash duration
    } else {
        console.error(`Combatant element not found for ${combatant.name}`);
    }
}

// Delay before ending the turn after a missed attack
function endTurnAfterDelay() {
    setTimeout(() => {
        startNextTurn();
    }, 1500);
}

// Perform recover action
function performRecover() {
    gameState.currentCombatant.stamina = Math.min(
        gameState.currentCombatant.maxStamina, 
        gameState.currentCombatant.stamina + 4
    );
    
    statusMessageEl.textContent = `${gameState.currentCombatant.name} recovers 4 stamina points.`;
    renderCombatants();
    
    // Move to next turn after a delay
    setTimeout(() => {
        startNextTurn();
    }, 1500);
}

// Computer AI turn
function computerTurn() {
    const computer = gameState.currentCombatant;
    const playerTargets = gameState.playerTeam.filter(p => !p.defeated);
    
    // Decision logic: attack if enough stamina and targets exist, otherwise recover
    if (computer.stamina >= 2 && playerTargets.length > 0) {
        // Select a random target
        const randomIndex = Math.floor(Math.random() * playerTargets.length);
        gameState.selectedTarget = playerTargets[randomIndex];
        
        performAttack();
    } else {
        performRecover();
    }
}

// After page loads, check if the DOM elements exist and initialize game
window.addEventListener("DOMContentLoaded", () => {
    debug("DOM loaded");
    debug(`Target selection element exists: ${!!document.getElementById("target-selection")}`);
    debug(`Player combatants element exists: ${!!document.getElementById("player-combatants")}`);
    debug(`Computer combatants element exists: ${!!document.getElementById("computer-combatants")}`);
    
    // Fix the duplicate function definitions by removing them
    // We'll use a clean event listener setup
    
    // Test target selection popup directly to verify it works
    document.getElementById("debug-output").insertAdjacentHTML(
        'beforeend',
        '<button id="test-popup" style="margin: 10px 0; padding: 5px;">Test Target Selection Popup</button>'
    );
    
    document.getElementById("test-popup").addEventListener("click", () => {
        showTargetSelection();
    });
    
    // Initialize game after a brief delay to ensure DOM is fully loaded
    setTimeout(initGame, 100);
});
