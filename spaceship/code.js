// Game variables
const gameArea = document.getElementById('game-area');
const player = document.getElementById('player');
const livesDisplay = document.querySelector('#lives span');
const scoreDisplay = document.querySelector('#score span');
const highScoreDisplay = document.querySelector('#high-score span');
const levelDisplay = document.querySelector('#level span');
const gameOverMessage = document.getElementById('game-over');
const restartButton = document.getElementById('restart-button');
const highscoreContainer = document.getElementById('highscore-container');
const highscoreList = document.getElementById('highscore-list');
const initialInput = document.getElementById('initial-input');
const finalScoreDisplay = document.querySelector('#final-score span');
const initialsInput = document.getElementById('initials-input');
const submitScoreButton = document.getElementById('submit-score');

// Initialize highscore manager
const highscoreManager = new HighscoreManager();

// Game settings
const gameHeight = gameArea.clientHeight;
const gameWidth = gameArea.clientWidth;
const playerEdgeSize = Math.floor(gameHeight * 0.2); // 20% of screen height
const playerHeight = playerEdgeSize;
const playerWidth = Math.floor(playerEdgeSize * 1.5); // Assuming 3:2 aspect ratio for ship image
const enemyHeight = Math.floor(gameHeight * 0.1); // 10% of screen height
const enemyWidth = Math.floor(enemyHeight * 1.5); // aspect ratio 3:2
const playerSpeed = 8;
const enemySpeed = 4;
const shotSpeed = 10;
const enemySpawnRate = 1500; // milliseconds
const levelIncreaseInterval = 30000; // 30 seconds
const bossFightTimeOffset = 25000; // Spawn boss 5 seconds before level ends
const initialLevel = 1;

// Game state
let playerPosition = gameHeight / 2 - playerHeight / 2;
let lives = 3;
let score = 0;
let highScore = localStorage.getItem('highScore') ? parseInt(localStorage.getItem('highScore')) : 0;
let currentLevel = initialLevel;
let gameIsOver = false;
let gameIsPlaying = false;
let keys = {};
let enemies = [];
let shot = null;
let enemyShots = []; // Array to track enemy shots
let enemySpawnInterval;
let levelInterval;
let gameStartTime;
let boss = null; // Boss variable
let bossShots = []; // Boss shots array
const bossFightLevelInterval = 2; // Boss fight every 2 levels
let levelStartTime;
let bossSpawnedForCurrentLevel = false;

// Initialize the game
function init() {
    // Force hide all non-game UI elements
    highscoreContainer.classList.add('hidden');
    initialInput.classList.add('hidden');
    gameOverMessage.classList.add('hidden');
    restartButton.classList.add('hidden');
    
    // Set player size
    player.width = playerWidth;
    player.height = playerHeight;
    player.style.top = playerPosition + 'px';
    
    // Reset game state
    lives = 3;
    score = 0;
    currentLevel = initialLevel;
    livesDisplay.textContent = lives;
    scoreDisplay.textContent = score;
    highScoreDisplay.textContent = highScore;
    levelDisplay.textContent = currentLevel;
    gameIsOver = false;
    gameIsPlaying = true;
    enemies = [];
    shot = null;
    enemyShots = [];
    boss = null;
    bossShots = [];
    gameStartTime = Date.now();
    levelStartTime = gameStartTime;
    bossSpawnedForCurrentLevel = false;
    
    // Clear game area of any previous enemies/shots
    document.querySelectorAll('.enemy, .shot, .enemy-shot').forEach(el => el.remove());
    
    // Hide game over elements
    gameOverMessage.classList.add('hidden');
    restartButton.classList.add('hidden');
    
    // Start enemy spawn interval
    enemySpawnInterval = setInterval(spawnEnemy, enemySpawnRate);
    
    // Start level increase interval
    levelInterval = setInterval(increaseLevel, levelIncreaseInterval);
    
    // Start game loop
    requestAnimationFrame(gameLoop);
    
    // Don't spawn boss immediately at game start
    // spawnBoss(); // Call spawnBoss at the end of init to spawn boss at level 1
}

// Count the current number of corvettes on screen
function countCorvettesOnScreen() {
    return enemies.filter(enemy => enemy.type === 'corvette').length;
}

// Calculate maximum allowed corvettes based on current level
function getMaxAllowedCorvettes() {
    // Start with 1, add another corvette for every 5 levels
    return Math.floor(1 + Math.floor((currentLevel - 1) / 5));
}

// Increase level
function increaseLevel() {
    currentLevel++;
    levelDisplay.textContent = currentLevel;
    console.log(`Level increased to ${currentLevel}!`);
    console.log(`Max corvettes allowed: ${getMaxAllowedCorvettes()}`);
    
    // Reset boss spawned flag for new level
    bossSpawnedForCurrentLevel = false;
    levelStartTime = Date.now();
    
    // Spawn enemies to match the new minimum required
    checkMinimumEnemies();
}

// Check if we need to spawn more enemies to meet minimum requirement
function checkMinimumEnemies() {
    const minEnemies = currentLevel;
    const maxEnemies = currentLevel + 2;
    
    // If we have fewer than minimum enemies, spawn more
    if (enemies.length < minEnemies) {
        const enemiesToSpawn = minEnemies - enemies.length;
        
        // Spawn multiple enemies if needed
        for (let i = 0; i < enemiesToSpawn && enemies.length < maxEnemies; i++) {
            spawnEnemy(true); // Force spawn even if already at max
        }
    }
}

// Game loop
function gameLoop() {
    if (!gameIsOver) {
        // Ensure highscore list stays hidden during gameplay
        if (!highscoreContainer.classList.contains('hidden')) {
            highscoreContainer.classList.add('hidden');
        }
        if (!initialInput.classList.contains('hidden')) {
            initialInput.classList.add('hidden');
        }
        
        updatePlayer();
        updateEnemies();
        updateShot();
        updateEnemyShots();
        checkCollisions();
        
        // Check if we need to maintain minimum enemies
        if (Math.random() < 0.01) { // Only check occasionally for performance
            checkMinimumEnemies();
        }
        
        // Check if it's time to spawn a boss at the end of the level
        const currentTime = Date.now();
        const timeInCurrentLevel = currentTime - levelStartTime;
        const timeUntilNextLevel = levelIncreaseInterval - timeInCurrentLevel;

        if (!bossSpawnedForCurrentLevel && 
            timeUntilNextLevel <= bossFightTimeOffset && 
            timeInCurrentLevel >= bossFightTimeOffset && 
            boss === null) {
            console.log("Time for boss fight!");
            bossSpawnedForCurrentLevel = true;
            spawnBoss();
        }
        
        requestAnimationFrame(gameLoop);
    }
}

// Update player position based on key presses
function updatePlayer() {
    if (keys['ArrowUp'] && playerPosition > 0) {
        playerPosition -= playerSpeed;
    }
    if (keys['ArrowDown'] && playerPosition < gameHeight - playerHeight) {
        playerPosition += playerSpeed;
    }
    player.style.top = playerPosition + 'px';
}

// Create a new enemy
function spawnEnemy(forceSpawn = false) {
    if (gameIsOver) return;
    
    const maxEnemies = currentLevel + 2;
    
    // Don't spawn if we already have max enemies, unless forced
    if (!forceSpawn && enemies.length >= maxEnemies) return;
    
    // Check corvette limit and adjust random selection if needed
    const currentCorvettes = countCorvettesOnScreen();
    const maxCorvettes = getMaxAllowedCorvettes();
    
    // Create enemy image element
    const enemy = document.createElement('img');
    enemy.className = 'enemy';
    
    // Randomly decide enemy type
    let rand = Math.random();
    let type, hitPoints, points, imageSrc;
    
    // If we're at or over the corvette limit, don't create more corvettes
    if (currentCorvettes >= maxCorvettes && rand >= 0.3 && rand < 0.6) {
        // Redistribute probability between destroyer and frigate
        rand = rand < 0.45 ? 0.2 : 0.7; // 50/50 chance between destroyer and frigate
    }
    
    if (rand < 0.3) { // 30% chance for destroyer
        enemy.classList.add('destroyer');
        type = 'destroyer';
        hitPoints = 2;
        points = 2;
        imageSrc = 'images/Destroyer.png'; // Note: spec says 'Destroer.png' but that's likely a typo
    } else if (rand < 0.6) { // 30% chance for corvette
        // Only create corvette if we haven't reached the limit
        if (currentCorvettes < maxCorvettes) {
            enemy.classList.add('corvette');
            type = 'corvette';
            hitPoints = 1;
            points = 1;
            imageSrc = 'images/Corvette.png';
        } else {
            // Default to frigate if corvette limit reached
            enemy.classList.add('frigate');
            type = 'frigate';
            hitPoints = 1;
            points = 1;
            imageSrc = 'images/Frigate.png';
        }
    } else { // 40% chance for frigate
        enemy.classList.add('frigate');
        type = 'frigate';
        hitPoints = 1;
        points = 1;
        imageSrc = 'images/Frigate.png';
    }
    
    // Set enemy image source
    enemy.src = imageSrc;
    enemy.alt = type;
    
    // Set enemy dimensions
    enemy.width = enemyWidth;
    enemy.height = enemyHeight;
    
    // Debug log to confirm enemy types
    console.log(`Spawned enemy type: ${type} (corvettes: ${currentCorvettes}/${maxCorvettes})`);
    
    // Position enemy at random height on the right edge
    const enemyPosition = Math.random() * (gameHeight - enemyHeight);
    enemy.style.top = enemyPosition + 'px';
    enemy.style.left = gameWidth + 'px'; // Start outside the game area
    
    gameArea.appendChild(enemy);
    
    // Add enemy to our array with all properties
    const newEnemy = { 
        element: enemy, 
        position: { 
            x: gameWidth, 
            y: enemyPosition 
        },
        type: type,
        hitPoints: hitPoints,
        points: points,
        lastShotTime: 0, // Track when corvette last fired
        canShoot: type === 'corvette' // Only corvettes can shoot
    };
    
    enemies.push(newEnemy);
}

// Create a new boss
function spawnBoss() {
    if (gameIsOver || boss !== null) return;

    // Remove any existing boss element just to be safe
    const existingBoss = document.querySelector('.enemy.boss');
    if (existingBoss) {
        existingBoss.remove();
    }

    const bossElement = document.createElement('img');
    bossElement.className = 'enemy boss destroyer'; // Boss is a destroyer
    bossElement.src = 'images/Destroyer.png';
    bossElement.alt = 'Boss';
    bossElement.width = enemyWidth * 2; // Make boss bigger
    bossElement.height = enemyHeight * 2;
    
    // Position boss at the right edge, but fully visible
    const bossPosition = gameHeight / 2 - enemyHeight;
    bossElement.style.top = bossPosition + 'px';
    // Position the boss fully visible on the right side of the screen
    bossElement.style.left = (gameWidth - bossElement.width - 20) + 'px'; 
    
    // Ensure these styles are applied to make boss visible
    bossElement.style.border = '5px solid yellow';
    bossElement.style.boxShadow = '0 0 10px 5px rgba(255, 255, 0, 0.5)';
    bossElement.style.zIndex = '50';

    gameArea.appendChild(bossElement);

    boss = {
        element: bossElement,
        position: { 
            x: gameWidth - bossElement.width - 20, 
            y: bossPosition 
        },
        hitPoints: 5,
        canShoot: true,
        lastShotTime: 0,
        direction: 'up', // Initialize direction
        shots: [] // Array to hold boss shots
    };
    
    console.log("%c BOSS SPAWNED! ", "background: yellow; color: black; font-size: 20px; font-weight: bold;");
    // Remove the alert as it interrupts gameplay
    // alert("Boss has appeared!"); 
    
    // Flash the boss for visibility
    let flashCount = 0;
    const flashInterval = setInterval(() => {
        if (boss && boss.element) {
            boss.element.style.opacity = boss.element.style.opacity === '0.5' ? '1' : '0.5';
            flashCount++;
            
            if (flashCount >= 6) { // Flash 3 times (6 state changes)
                clearInterval(flashInterval);
                if (boss && boss.element) {
                    boss.element.style.opacity = '1';
                }
            }
        } else {
            clearInterval(flashInterval);
        }
    }, 200);
}

// Update enemies positions
function updateEnemies() {
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        enemy.position.x -= enemySpeed;
        enemy.element.style.left = enemy.position.x + 'px';
        
        // Check if corvette should fire
        if (enemy.canShoot && !gameIsOver) {
            const now = Date.now();
            // Fire approximately every 2-4 seconds
            if (now - enemy.lastShotTime > 2000 + Math.random() * 2000) {
                // Only fire if no other shot from this corvette is active
                if (!enemyShots.some(shot => shot.sourceEnemy === enemy)) {
                    console.log("Corvette firing a shot!");
                    fireEnemyShot(enemy);
                    enemy.lastShotTime = now;
                }
            }
        }
        
        // Remove enemies that have gone off screen
        if (enemy.position.x < -enemyWidth) {
            gameArea.removeChild(enemy.element);
            enemies.splice(i, 1);
        }
    }
    
    // Update boss position and behavior
    if (boss) {
        // Make boss more visible for debugging
        if (!boss.element.style.border) {
            boss.element.style.border = '5px solid yellow';
            boss.element.style.boxShadow = '0 0 10px 5px rgba(255, 255, 0, 0.5)';
        }
        
        // Basic boss AI: Move up and down
        const bossSpeed = 2;
        const bossTop = parseInt(boss.element.style.top);
        
        if (bossTop <= 0) {
            boss.direction = 'down';
        } else if (bossTop >= gameHeight - boss.element.height) {
            boss.direction = 'up';
        }
        
        if (boss.direction === 'up') {
            boss.position.y -= bossSpeed;
        } else {
            boss.position.y += bossSpeed;
        }
        
        boss.element.style.top = boss.position.y + 'px';
        
        // Boss shooting logic
        if (boss.canShoot && !gameIsOver) {
            const now = Date.now();
            if (now - boss.lastShotTime > 1500 + Math.random() * 1500) {
                fireBossShot(boss);
                boss.lastShotTime = now;
            }
        }
    }
}

// Fire a shot
function fireShot() {
    // Only one shot at a time
    if (shot !== null) return;
    
    const shotElement = document.createElement('div');
    shotElement.className = 'shot';
    
    // Position shot to come from the tip of the player ship
    const shotY = playerPosition + playerHeight / 2 - 2.5; // Center vertically
    const shotX = 20 + playerWidth; // Left position + player width
    
    shotElement.style.top = shotY + 'px';
    shotElement.style.left = shotX + 'px';
    
    gameArea.appendChild(shotElement);
    shot = {
        element: shotElement,
        position: { x: shotX, y: shotY }
    };
}

// Fire shot from corvette enemy
function fireEnemyShot(enemy) {
    const shotElement = document.createElement('div');
    shotElement.className = 'enemy-shot';
    
    // Position shot to come from the enemy
    const shotY = enemy.position.y + enemyHeight / 2 - 2.5;
    const shotX = enemy.position.x; // Shot from front of ship
    
    shotElement.style.top = shotY + 'px';
    shotElement.style.left = shotX + 'px';
    
    gameArea.appendChild(shotElement);
    
    enemyShots.push({
        element: shotElement,
        position: { x: shotX, y: shotY },
        sourceEnemy: enemy
    });
}

// Fire shot from boss
function fireBossShot(boss) {
    const shotElement = document.createElement('div');
    shotElement.className = 'enemy-shot boss-shot'; // Different class for boss shots
    
    // Position shot to come from the boss
    const shotY = boss.position.y + boss.element.height / 2 - 2.5;
    const shotX = boss.position.x; // Shot from front of ship
    
    shotElement.style.top = shotY + 'px';
    shotElement.style.left = shotX + 'px';
    
    gameArea.appendChild(shotElement);
    
    bossShots.push({
        element: shotElement,
        position: { x: shotX, y: shotY },
        sourceBoss: boss
    });
}

// Update shot position
function updateShot() {
    if (!shot) return;
    
    shot.position.x += shotSpeed;
    shot.element.style.left = shot.position.x + 'px';
    
    // Remove shot if it goes off screen
    if (shot.position.x > gameWidth) {
        gameArea.removeChild(shot.element);
        shot = null;
    }
}

// Update enemy shots position
function updateEnemyShots() {
    for (let i = enemyShots.length - 1; i >= 0; i--) {
        const shot = enemyShots[i];
        shot.position.x -= shotSpeed; // Moving leftward
        shot.element.style.left = shot.position.x + 'px';
        
        // Remove shot if it goes off screen
        if (shot.position.x < 0) {
            if (shot.element.parentNode) {
                gameArea.removeChild(shot.element);
            }
            enemyShots.splice(i, 1);
        }
    }
    
    // Update boss shots
    for (let i = bossShots.length - 1; i >= 0; i--) {
        const shot = bossShots[i];
        shot.position.x -= shotSpeed;
        shot.element.style.left = shot.position.x + 'px';
        
        // Remove shot if it goes off screen
        if (shot.position.x < 0) {
            if (shot.element.parentNode) {
                gameArea.removeChild(shot.element);
            }
            bossShots.splice(i, 1);
        }
    }
}

// Check for collisions
function checkCollisions() {
    // Check for shot hitting enemies
    if (shot) {
        for (let i = enemies.length - 1; i >= 0; i--) {
            const enemy = enemies[i];
            if (isColliding(shot, enemy)) {
                // Reduce enemy hitpoints
                enemy.hitPoints--;
                
                // Remove enemy if hitpoints are zero
                if (enemy.hitPoints <= 0) {
                    // Add points to score
                    updateScore(enemy.points);
                    
                    gameArea.removeChild(enemy.element);
                    enemies.splice(i, 1);
                    
                    // Check if we need to spawn more enemies to maintain minimum
                    checkMinimumEnemies();
                } else {
                    // Visual feedback for hit
                    enemy.element.style.opacity = '0.7';
                    setTimeout(() => {
                        if (enemy.element && enemy.element.style) {
                            enemy.element.style.opacity = '1';
                        }
                    }, 100);
                }
                
                // Remove shot in any case
                gameArea.removeChild(shot.element);
                shot = null;
                break; // Shot can only hit one enemy
            }
        }
        
        // Check for shot hitting boss
        if (boss && isColliding(shot, boss)) {
            boss.hitPoints--;
            
            // Remove shot
            gameArea.removeChild(shot.element);
            shot = null;
            
            if (boss.hitPoints <= 0) {
                // Boss defeated
                gameArea.removeChild(boss.element);
                boss = null;
                updateScore(5); // Award more points for defeating the boss
            } else {
                // Visual feedback for hit
                boss.element.style.opacity = '0.7';
                setTimeout(() => {
                    if (boss.element && boss.element.style) {
                        boss.element.style.opacity = '1';
                    }
                }, 100);
            }
        }
    }
    
    // Check for enemy shots hitting player
    const playerObj = {
        position: { x: 20, y: playerPosition },
        width: playerWidth,
        height: playerHeight
    };
    
    for (let i = enemyShots.length - 1; i >= 0; i--) {
        const enemyShot = enemyShots[i];
        
        if (isColliding(enemyShot, playerObj)) {
            // Remove shot and reduce player life
            gameArea.removeChild(enemyShot.element);
            enemyShots.splice(i, 1);
            decreaseLives();
        }
    }
    
    // Check for boss shots hitting player
    for (let i = bossShots.length - 1; i >= 0; i--) {
        const bossShot = bossShots[i];
        
        if (isColliding(bossShot, playerObj)) {
            // Remove shot and reduce player life
            gameArea.removeChild(bossShot.element);
            bossShots.splice(i, 1);
            decreaseLives();
        }
    }
    
    // Check for enemies hitting player
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        
        if (isColliding(playerObj, enemy)) {
            // Remove enemy and reduce lives
            gameArea.removeChild(enemy.element);
            enemies.splice(i, 1);
            decreaseLives();
        }
    }
    
    // Check for boss hitting player
    if (boss && isColliding(playerObj, boss)) {
        // Remove boss and reduce lives
        gameArea.removeChild(boss.element);
        boss = null;
        decreaseLives();
    }
}

// Update score
function updateScore(points) {
    score += points;
    scoreDisplay.textContent = score;
    
    // Check and update high score if needed
    if (score > highScore) {
        highScore = score;
        highScoreDisplay.textContent = highScore;
        localStorage.setItem('highScore', highScore);
    }
}

// Collision detection helper
function isColliding(obj1, obj2) {
    // Get object dimensions
    let obj1Width, obj1Height, obj2Width, obj2Height;
    
    if (obj1.element) {
        if (obj1.element.className.includes('shot')) {
            obj1Width = 10; // Fixed width for shots
            obj1Height = 5; // Fixed height for shots
        } else {
            // For enemies
            obj1Width = enemyWidth;
            obj1Height = enemyHeight;
        }
    } else {
        // For the player object
        obj1Width = obj1.width;
        obj1Height = obj1.height;
    }
    
    if (obj2.element) {
        if (obj2.element.className.includes('shot')) {
            obj2Width = 10;
            obj2Height = 5;
        } else {
            obj2Width = obj2.element.width; // Use boss width
            obj2Height = obj2.element.height; // Use boss height
        }
    } else {
        obj2Width = obj2.width;
        obj2Height = obj2.height;
    }
    
    return (
        obj1.position.x < obj2.position.x + obj2Width &&
        obj1.position.x + obj1Width > obj2.position.x &&
        obj1.position.y < obj2.position.y + obj2Height &&
        obj1.position.y + obj1Height > obj2.position.y
    );
}

// Decrease lives and check for game over
function decreaseLives() {
    lives -= 1;
    livesDisplay.textContent = lives;
    
    if (lives <= 0) {
        gameOver();
    }
}

// Game over function
function gameOver() {
    gameIsOver = true;
    gameIsPlaying = false;
    clearInterval(enemySpawnInterval);
    clearInterval(levelInterval);
    
    // Clear boss if it exists
    if (boss) {
        gameArea.removeChild(boss.element);
        boss = null;
    }
    
    // Clear boss shots
    bossShots.forEach(shot => {
        if (shot.element && shot.element.parentNode) {
            gameArea.removeChild(shot.element);
        }
    });
    bossShots = [];
    
    // Final check for high score
    if (score > highScore) {
        highScore = score;
        highScoreDisplay.textContent = highScore;
        localStorage.setItem('highScore', highScore);
    }
    
    gameOverMessage.classList.remove('hidden');
    restartButton.classList.remove('hidden');
    
    // Check if score qualifies for highscore list
    if (highscoreManager.qualifiesForHighscore(score)) {
        // Show input for player initials
        finalScoreDisplay.textContent = score;
        initialInput.classList.remove('hidden');
        initialsInput.value = '';
        initialsInput.focus();
    } else {
        // If no highscore, show the highscore list after a delay
        setTimeout(showHighscores, 2000);
    }
}

// Show highscores
function showHighscores() {
    // Don't show highscores if game is currently playing
    if (gameIsPlaying || !gameIsOver) {
        console.log("Attempted to show highscores during gameplay - prevented");
        return;
    }
    
    // Clear previous entries
    highscoreList.innerHTML = '';
    
    // Get highscores and create entries
    const scores = highscoreManager.getScores();
    scores.forEach((entry, index) => {
        const entryElement = document.createElement('div');
        entryElement.className = 'highscore-entry';
        
        const rankElement = document.createElement('div');
        rankElement.className = 'rank';
        rankElement.textContent = `${index + 1}.`;
        
        const initialsElement = document.createElement('div');
        initialsElement.className = 'initials';
        initialsElement.textContent = entry.initials;
        
        const scoreElement = document.createElement('div');
        scoreElement.className = 'score';
        scoreElement.textContent = entry.score;
        
        entryElement.appendChild(rankElement);
        entryElement.appendChild(initialsElement);
        entryElement.appendChild(scoreElement);
        
        highscoreList.appendChild(entryElement);
    });
    
    // Show highscore container
    highscoreContainer.classList.remove('hidden');
}

// Submit score
function submitScore() {
    const initials = initialsInput.value.trim();
    if (initials) {
        // Add score to highscore list
        highscoreManager.addScore(initials, score);
        
        // Hide input form
        initialInput.classList.add('hidden');
        
        // Show highscore list
        showHighscores();
    }
}

// Event listeners
document.addEventListener('keydown', (e) => {
    // If game is playing, only handle game controls
    if (gameIsPlaying) {
        keys[e.key] = true;
        
        // Space bar to shoot only when playing
        if (e.key === ' ') {
            fireShot();
        }
        
        // Ensure highscore elements are hidden during gameplay
        highscoreContainer.classList.add('hidden');
        initialInput.classList.add('hidden');
        
        return;
    }
    
    // When not playing, handle menu controls
    keys[e.key] = true;
    
    // Space bar functions when not playing
    if (e.key === ' ') {
        if (!initialInput.classList.contains('hidden')) {
            // If showing highscore input, space should submit
            submitScore();
        } else {
            // Start game (whether showing highscores or not)
            highscoreContainer.classList.add('hidden');
            init();
        }
    }
    
    // Enter key to submit initials
    if (e.key === 'Enter' && !initialInput.classList.contains('hidden')) {
        submitScore();
    }
    
    // Escape key to skip highscore input
    if (e.key === 'Escape' && !initialInput.classList.contains('hidden')) {
        initialInput.classList.add('hidden');
        showHighscores();
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Submit score button event
submitScoreButton.addEventListener('click', submitScore);

// Restart button event to override
restartButton.addEventListener('click', () => {
    // If showing highscore input, hide it
    initialInput.classList.add('hidden');
    // If showing highscores, hide them
    highscoreContainer.classList.add('hidden');
    // Start the game
    init();
});

// Load high score when page loads
window.addEventListener('DOMContentLoaded', () => {
    highScoreDisplay.textContent = highScore;
    gameIsPlaying = false; // Ensure we're not in playing state initially
    showHighscores(); // Show highscores initially
});

// Start the game when the page loads or show highscores
window.addEventListener('load', () => {
    // Initially show highscores instead of starting the game
    if (!gameIsPlaying) {
        showHighscores();
    }
});
