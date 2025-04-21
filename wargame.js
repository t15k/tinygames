// Game state
const gameState = {
    board: [],
    currentPlayer: 'blue',
    selectedUnit: null,
    possibleMoves: [],
    blueUnits: [],
    redUnits: [],
    gameOver: false
};

// Terrain types
const terrainTypes = ['field', 'mountain', 'woods'];
const terrainEffects = {
    field: { tankMovable: true, tankStop: false },
    mountain: { tankMovable: false, tankStop: true },
    woods: { tankMovable: true, tankStop: true }
};

// Unit data
const unitTypes = {
    tank: { moveRange: 2, diceSides: 8 },
    infantry: { moveRange: 1, diceSides: 6 }
};

// Initialize the game
function initGame() {
    createBoard();
    placeInitialUnits();
    addEventListeners();
    updateStatusMessage('Select a unit to move');
    setupDice();
}

// Create the game board
function createBoard() {
    const board = document.getElementById('game-board');
    board.innerHTML = '';
    gameState.board = [];
    
    for (let row = 0; row < 6; row++) {
        gameState.board[row] = [];
        
        for (let col = 0; col < 6; col++) {
            const tile = document.createElement('div');
            // Randomly select terrain, with 60% fields, 20% mountains, 20% woods
            const rand = Math.random();
            let terrain;
            if (rand < 0.6) {
                terrain = 'field';
            } else if (rand < 0.8) {
                terrain = 'mountain';
            } else {
                terrain = 'woods';
            }
            
            tile.className = `tile terrain-${terrain}`;
            tile.dataset.row = row;
            tile.dataset.col = col;
            tile.dataset.terrain = terrain;
            tile.addEventListener('click', handleTileClick);
            
            board.appendChild(tile);
            gameState.board[row][col] = {
                element: tile,
                unit: null,
                terrain: terrain
            };
        }
    }
}

// Place initial units
function placeInitialUnits() {
    // Clear previous units
    gameState.blueUnits = [];
    gameState.redUnits = [];
    
    // Place blue tank
    createUnit('tank', 'blue', 5, 2);
    
    // Place blue infantry
    createUnit('infantry', 'blue', 5, 1);
    createUnit('infantry', 'blue', 5, 3);
    createUnit('infantry', 'blue', 5, 4);
    
    // Place red tank
    createUnit('tank', 'red', 0, 3);
    
    // Place red infantry
    createUnit('infantry', 'red', 0, 2);
    createUnit('infantry', 'red', 0, 4);
    createUnit('infantry', 'red', 0, 5);
}

// Create a unit at specified position
function createUnit(type, player, row, col) {
    const unit = {
        type: type,
        player: player,
        element: document.createElement('div')
    };
    
    unit.element.className = `unit ${player}-player ${type}`;
    gameState.board[row][col].element.appendChild(unit.element);
    gameState.board[row][col].unit = unit;
    
    if (player === 'blue') {
        gameState.blueUnits.push({ unit, row, col });
    } else {
        gameState.redUnits.push({ unit, row, col });
    }
}

// Add event listeners
function addEventListeners() {
    document.getElementById('reset-game').addEventListener('click', resetGame);
}

// Handle tile click
function handleTileClick(event) {
    if (gameState.gameOver) return;
    
    const row = parseInt(event.currentTarget.dataset.row);
    const col = parseInt(event.currentTarget.dataset.col);
    
    // If a unit is already selected, try to move it
    if (gameState.selectedUnit) {
        const isValidMove = gameState.possibleMoves.some(move => 
            move.row === row && move.col === col
        );
        
        if (isValidMove) {
            moveUnit(gameState.selectedUnit, row, col);
        } else {
            // Cancel selection if clicking elsewhere
            clearHighlights();
            gameState.selectedUnit = null;
            gameState.possibleMoves = [];
        }
        return;
    }
    
    // Select a unit if it belongs to the current player
    const tile = gameState.board[row][col];
    if (tile.unit && tile.unit.player === gameState.currentPlayer) {
        selectUnit(row, col);
    }
}

// Select a unit
function selectUnit(row, col) {
    clearHighlights();
    
    gameState.selectedUnit = { row, col };
    const unit = gameState.board[row][col].unit;
    
    // Highlight the selected unit
    gameState.board[row][col].element.classList.add('highlight-selected');
    
    // Calculate and highlight possible moves
    gameState.possibleMoves = calculatePossibleMoves(unit, row, col);
    gameState.possibleMoves.forEach(move => {
        gameState.board[move.row][move.col].element.classList.add('highlight-move');
    });
}

// Calculate possible moves for a unit
function calculatePossibleMoves(unit, row, col) {
    const moves = [];
    const range = unitTypes[unit.type].moveRange;
    
    // Check all tiles within movement range
    for (let r = Math.max(0, row - range); r <= Math.min(5, row + range); r++) {
        for (let c = Math.max(0, col - range); c <= Math.min(5, col + range); c++) {
            // Skip if it's the current position
            if (r === row && c === col) continue;
            
            // Check if within movement range (Manhattan distance)
            const distance = Math.abs(r - row) + Math.abs(c - col);
            if (distance <= range) {
                const targetTile = gameState.board[r][c];
                const terrain = targetTile.terrain;
                
                // Check terrain restrictions for tanks
                if (unit.type === 'tank' && !terrainEffects[terrain].tankMovable) {
                    continue;
                }
                
                // Add as possible move if empty or has enemy unit
                if (!targetTile.unit || targetTile.unit.player !== unit.player) {
                    moves.push({ row: r, col: c });
                }
            }
        }
    }
    
    return moves;
}

// Move unit to the target location
function moveUnit(source, targetRow, targetCol) {
    const sourceRow = source.row;
    const sourceCol = source.col;
    
    const unit = gameState.board[sourceRow][sourceCol].unit;
    const targetTile = gameState.board[targetRow][targetCol];
    
    // Check if there's combat
    if (targetTile.unit) {
        // Combat occurs
        resolveCombat(unit, sourceRow, sourceCol, targetTile.unit, targetRow, targetCol);
    } else {
        // No combat, just move
        completeMove(sourceRow, sourceCol, targetRow, targetCol);
        
        // Check if tank entered woods (ends movement)
        if (unit.type === 'tank' && terrainEffects[targetTile.terrain].tankStop) {
            updateStatusMessage(`Tank entered ${targetTile.terrain} and ends its movement.`);
        }
        
        endTurn();
    }
    
    // Clear selection state
    clearHighlights();
    gameState.selectedUnit = null;
    gameState.possibleMoves = [];
}

// Setup dice visuals
function setupDice() {
    // Get dice elements
    const attackerDice = document.getElementById('attacker-dice');
    const defenderDice = document.getElementById('defender-dice');
    
    // Clear previous pips
    attackerDice.querySelector('.dice-face').innerHTML = '';
    defenderDice.querySelector('.dice-face').innerHTML = '';
    
    // Initialize with a question mark or default value
    attackerDice.setAttribute('data-value', '-');
    defenderDice.setAttribute('data-value', '-');
    
    // Add a single centered pip (representing unknown value)
    attackerDice.querySelector('.dice-face').appendChild(createPip());
    defenderDice.querySelector('.dice-face').appendChild(createPip());
    
    // Style dice based on current player
    updateDiceColors();
}

// Create a pip element for dice
function createPip() {
    const pip = document.createElement('div');
    pip.className = 'pip';
    return pip;
}

// Update dice colors based on current player
function updateDiceColors() {
    const attackerDice = document.getElementById('attacker-dice');
    const playerColor = gameState.currentPlayer === 'blue' ? 'blue-player-dice' : 'red-player-dice';
    
    // Remove any previous player color classes
    attackerDice.classList.remove('blue-player-dice', 'red-player-dice');
    
    // Add current player's color class to attacker dice
    attackerDice.classList.add(playerColor);
}

// Roll and update dice visuals
function rollDiceVisual(diceElement, value) {
    // Clear previous dice face
    const diceFace = diceElement.querySelector('.dice-face');
    diceFace.innerHTML = '';
    
    // Add rolling animation
    diceElement.classList.add('rolling');
    
    setTimeout(() => {
        // Set the data attribute for CSS styling
        diceElement.setAttribute('data-value', value);
        
        // Add the correct number of pips
        for (let i = 0; i < value; i++) {
            diceFace.appendChild(createPip());
        }
        
        // Remove rolling animation
        diceElement.classList.remove('rolling');
    }, 500); // Match animation duration
}

// Resolve combat between units
function resolveCombat(attackingUnit, attackerRow, attackerCol, defendingUnit, defenderRow, defenderCol) {
    // Roll dice for both units
    const attackerDice = unitTypes[attackingUnit.type].diceSides;
    const defenderDice = unitTypes[defendingUnit.type].diceSides;
    
    let attackerRoll = rollDice(attackerDice);
    let defenderRoll = rollDice(defenderDice);
    
    // Update visual dice
    rollDiceVisual(document.getElementById('attacker-dice'), attackerRoll);
    
    // Apply terrain bonuses
    const defenderTerrain = gameState.board[defenderRow][defenderCol].terrain;
    let defenderBonus = 0;
    
    // Infantry gets +1 when defending in woods
    if (defendingUnit.type === 'infantry' && defenderTerrain === 'woods') {
        defenderBonus = 1;
        defenderRoll += defenderBonus;
    }
    
    // Only show base roll in visual dice, but add bonus in text
    rollDiceVisual(document.getElementById('defender-dice'), defenderRoll - defenderBonus);
    
    // Update UI with dice rolls
    document.getElementById('attacker-roll').textContent = attackerRoll;
    document.getElementById('defender-roll').textContent = `${defenderRoll - defenderBonus} ${defenderBonus > 0 ? '(+' + defenderBonus + ' woods)' : ''}`;
    
    // Determine winner
    if (attackerRoll > defenderRoll) {
        // Attacker wins
        updateStatusMessage(`${gameState.currentPlayer.toUpperCase()} wins the combat!`);
        removeUnit(defenderRow, defenderCol);
        completeMove(attackerRow, attackerCol, defenderRow, defenderCol);
    } else if (defenderRoll > attackerRoll) {
        // Defender wins
        updateStatusMessage(`${gameState.currentPlayer === 'blue' ? 'RED' : 'BLUE'} wins the combat!`);
        removeUnit(attackerRow, attackerCol);
    } else {
        // Draw
        updateStatusMessage("Combat ends in a draw!");
    }
    
    // Check if game is over after combat
    checkGameOver();
    
    if (!gameState.gameOver) {
        endTurn();
    }
}

// Roll a dice with the given number of sides
function rollDice(sides) {
    return Math.floor(Math.random() * sides) + 1;
}

// Complete the movement of a unit
function completeMove(fromRow, fromCol, toRow, toCol) {
    const unit = gameState.board[fromRow][fromCol].unit;
    
    // Update the board
    gameState.board[fromRow][fromCol].unit = null;
    gameState.board[fromRow][fromCol].element.innerHTML = '';
    
    gameState.board[toRow][toCol].unit = unit;
    gameState.board[toRow][toCol].element.appendChild(unit.element);
    
    // Update unit positions in arrays
    updateUnitPosition(unit.player, fromRow, fromCol, toRow, toCol);
}

// Update unit position in the player's units array
function updateUnitPosition(player, fromRow, fromCol, toRow, toCol) {
    const units = player === 'blue' ? gameState.blueUnits : gameState.redUnits;
    
    for (let i = 0; i < units.length; i++) {
        if (units[i].row === fromRow && units[i].col === fromCol) {
            units[i].row = toRow;
            units[i].col = toCol;
            break;
        }
    }
}

// Remove a unit from the board
function removeUnit(row, col) {
    const unit = gameState.board[row][col].unit;
    
    if (!unit) return;
    
    // Remove from the DOM
    gameState.board[row][col].element.innerHTML = '';
    gameState.board[row][col].unit = null;
    
    // Remove from the player's units array
    const units = unit.player === 'blue' ? gameState.blueUnits : gameState.redUnits;
    const index = units.findIndex(u => u.row === row && u.col === col);
    
    if (index !== -1) {
        units.splice(index, 1);
    }
}

// Clear all highlights on the board
function clearHighlights() {
    for (let row = 0; row < 6; row++) {
        for (let col = 0; col < 6; col++) {
            const element = gameState.board[row][col].element;
            element.classList.remove('highlight-selected', 'highlight-move');
        }
    }
}

// End the current player's turn
function endTurn() {
    gameState.currentPlayer = gameState.currentPlayer === 'blue' ? 'red' : 'blue';
    document.getElementById('current-player').textContent = gameState.currentPlayer.charAt(0).toUpperCase() + gameState.currentPlayer.slice(1);
    updateStatusMessage('Select a unit to move');
    updateDiceColors(); // Update dice colors when player changes
}

// Check if the game is over
function checkGameOver() {
    if (gameState.blueUnits.length === 0) {
        gameState.gameOver = true;
        updateStatusMessage('Game over! Red player wins!');
    } else if (gameState.redUnits.length === 0) {
        gameState.gameOver = true;
        updateStatusMessage('Game over! Blue player wins!');
    }
}

// Update the status message
function updateStatusMessage(message) {
    document.getElementById('status-message').textContent = message;
}

// Reset the game
function resetGame() {
    gameState.selectedUnit = null;
    gameState.possibleMoves = [];
    gameState.currentPlayer = 'blue';
    gameState.gameOver = false;
    
    document.getElementById('current-player').textContent = 'Blue';
    document.getElementById('attacker-roll').textContent = '-';
    document.getElementById('defender-roll').textContent = '-';
    
    initGame();
}

// Initialize the game when the page loads
window.addEventListener('load', initGame);
