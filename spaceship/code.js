// Game variables
const gameArea = document.getElementById('game-area');
const player = document.getElementById('player');
const livesDisplay = document.querySelector('#lives span');
const scoreDisplay = document.querySelector('#score span');
const levelDisplay = document.querySelector('#level span');
const gameOverMessage = document.getElementById('game-over');
const restartButton = document.getElementById('restart-button');

// Game settings
const gameHeight = gameArea.clientHeight;
const gameWidth = gameArea.clientWidth;
const playerEdgeSize = Math.floor(gameHeight * 0.2); // 20% of screen height as triangle edge size
const playerHeight = playerEdgeSize;
const playerWidth = Math.floor(playerEdgeSize * 0.866); // height of equilateral triangle (sqrt(3)/2 * edge)
const enemyHeight = Math.floor(gameHeight * 0.1); // 10% of screen height
const enemyWidth = Math.floor(enemyHeight * 1.5); // aspect ratio 3:2
const playerSpeed = 8;
const enemySpeed = 4;
const shotSpeed = 10;
const enemySpawnRate = 1500; // milliseconds
const levelIncreaseInterval = 30000; // 30 seconds
const initialLevel = 1;

// Game state
let playerPosition = gameHeight / 2 - playerHeight / 2;
let lives = 3;
let score = 0;
let currentLevel = initialLevel;
let gameIsOver = false;
let keys = {};
let enemies = [];
let shot = null;
let enemyShots = []; // Array to track enemy shots
let enemySpawnInterval;
let levelInterval;
let gameStartTime;

// Initialize the game
function init() {
    // Set player size (triangle)
    player.style.borderTopWidth = (playerEdgeSize / 2) + 'px';
    player.style.borderBottomWidth = (playerEdgeSize / 2) + 'px';
    player.style.borderLeftWidth = playerWidth + 'px';
    player.style.top = playerPosition + 'px';
    
    // Reset game state
    lives = 3;
    score = 0;
    currentLevel = initialLevel;
    livesDisplay.textContent = lives;
    scoreDisplay.textContent = score;
    levelDisplay.textContent = currentLevel;
    gameIsOver = false;
    enemies = [];
    shot = null;
    enemyShots = [];
    gameStartTime = Date.now();
    
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
    
    // Force spawn a corvette for testing
    setTimeout(() => {
        if (!gameIsOver) {
            console.log("Forcing corvette spawn for testing");
            const enemy = document.createElement('div');
            enemy.className = 'enemy corvette';
            enemy.style.width = enemyWidth + 'px';
            enemy.style.height = enemyHeight + 'px';
            const enemyPosition = Math.random() * (gameHeight - enemyHeight);
            enemy.style.top = enemyPosition + 'px';
            enemy.style.left = gameWidth + 'px';
            gameArea.appendChild(enemy);
            enemies.push({ 
                element: enemy, 
                position: { x: gameWidth, y: enemyPosition },
                type: 'corvette',
                hitPoints: 1,
                points: 1,
                lastShotTime: 0,
                canShoot: true
            });
        }
    }, 2000); // 2 seconds after game start
}

// Increase level
function increaseLevel() {
    currentLevel++;
    levelDisplay.textContent = currentLevel;
    console.log(`Level increased to ${currentLevel}!`);
    
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
        updatePlayer();
        updateEnemies();
        updateShot();
        updateEnemyShots();
        checkCollisions();
        
        // Check if we need to maintain minimum enemies
        if (Math.random() < 0.01) { // Only check occasionally for performance
            checkMinimumEnemies();
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
    
    const enemy = document.createElement('div');
    enemy.className = 'enemy';
    
    // Randomly decide enemy type
    const rand = Math.random();
    let type, hitPoints, points;
    
    if (rand < 0.3) { // 30% chance for destroyer
        enemy.classList.add('destroyer');
        type = 'destroyer';
        hitPoints = 2;
        points = 2;
    } else if (rand < 0.6) { // 30% chance for corvette
        enemy.classList.add('corvette');
        type = 'corvette';
        hitPoints = 1;
        points = 1;
    } else { // 40% chance for frigate
        enemy.classList.add('frigate');
        type = 'frigate';
        hitPoints = 1;
        points = 1;
    }
    
    // Debug log to confirm enemy types
    console.log(`Spawned enemy type: ${type}`);
    
    enemy.style.width = enemyWidth + 'px';
    enemy.style.height = enemyHeight + 'px';
    
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
}

// Fire a shot
function fireShot() {
    // Only one shot at a time
    if (shot !== null) return;
    
    const shotElement = document.createElement('div');
    shotElement.className = 'shot';
    
    // Position shot to come from the tip of the triangle
    const shotY = playerPosition + playerHeight / 2 - 2.5; // Center vertically
    const shotX = 20 + playerWidth; // Left position + triangle width
    
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
    const shotX = enemy.position.x; // From left side of enemy
    
    shotElement.style.top = shotY + 'px';
    shotElement.style.left = shotX + 'px';
    
    gameArea.appendChild(shotElement);
    
    enemyShots.push({
        element: shotElement,
        position: { x: shotX, y: shotY },
        sourceEnemy: enemy
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
    
    // Check for enemies hitting player
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        const playerObj = {
            position: { x: 20, y: playerPosition },
            width: playerWidth,
            height: playerHeight,
            isTriangle: true
        };
        
        if (isColliding(playerObj, enemy)) {
            // Remove enemy and reduce lives
            gameArea.removeChild(enemy.element);
            enemies.splice(i, 1);
            decreaseLives();
        }
    }
}

// Update score
function updateScore(points) {
    score += points;
    scoreDisplay.textContent = score;
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
            obj2Width = enemyWidth;
            obj2Height = enemyHeight;
        }
    } else {
        obj2Width = obj2.width;
        obj2Height = obj2.height;
    }
    
    // For simplicity, we'll use rectangle collision even for the triangle player
    // In a more advanced game, we could implement more accurate triangle collision
    
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
    clearInterval(enemySpawnInterval);
    clearInterval(levelInterval);
    gameOverMessage.classList.remove('hidden');
    restartButton.classList.remove('hidden');
}

// Event listeners
document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    
    // Space bar to shoot
    if (e.key === ' ') {
        fireShot();
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

restartButton.addEventListener('click', init);

// Start the game when the page loads
window.addEventListener('load', init);
