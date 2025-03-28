// Direct popup solution to handle target selection display issues

(function() {
    // Create a totally standalone popup solution
    function createStandalonePopup() {
        // First, create a new div for the standalone popup
        const popupContainer = document.createElement('div');
        popupContainer.id = 'standalone-popup';
        popupContainer.style.cssText = `
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.7);
            z-index: 9999;
            justify-content: center;
            align-items: center;
        `;
        
        // Create the popup content
        const popupContent = document.createElement('div');
        popupContent.style.cssText = `
            background-color: #222;
            border: 2px solid #ffcc00;
            padding: 20px;
            border-radius: 5px;
            width: 300px;
            box-shadow: 0 0 20px rgba(255, 204, 0, 0.7);
        `;
        
        // Add heading
        const heading = document.createElement('h3');
        heading.textContent = 'Select Target to Attack';
        heading.style.cssText = `
            color: #ffcc00;
            margin-bottom: 15px;
            text-align: center;
            font-size: 18px;
        `;
        popupContent.appendChild(heading);
        
        // Add targets container
        const targetsContainer = document.createElement('div');
        targetsContainer.id = 'standalone-targets';
        targetsContainer.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 10px;
            margin: 15px 0;
        `;
        popupContent.appendChild(targetsContainer);
        
        // Add cancel button
        const cancelButton = document.createElement('button');
        cancelButton.textContent = 'Cancel Attack';
        cancelButton.style.cssText = `
            padding: 10px 15px;
            background-color: #444;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-weight: bold;
            margin-top: 10px;
            display: block;
            width: 100%;
        `;
        cancelButton.addEventListener('click', () => {
            hideStandalonePopup();
        });
        popupContent.appendChild(cancelButton);
        
        // Add popup content to container
        popupContainer.appendChild(popupContent);
        
        // Add container to body
        document.body.appendChild(popupContainer);
        
        console.log('Standalone popup created');
    }
    
    // Function to show standalone popup with targets
    window.showStandaloneTargetPopup = function(targets, onSelectCallback) {
        const popup = document.getElementById('standalone-popup');
        const targetsContainer = document.getElementById('standalone-targets');
        
        if (!popup || !targetsContainer) {
            console.error('Standalone popup elements not found');
            return;
        }
        
        // Clear existing targets
        targetsContainer.innerHTML = '';
        
        // Add targets
        targets.forEach(target => {
            const targetEl = document.createElement('div');
            targetEl.style.cssText = `
                padding: 12px 15px;
                border-radius: 5px;
                background-color: #333;
                cursor: pointer;
                border: 1px solid #555;
                font-weight: bold;
                text-align: center;
                font-size: 16px;
                color: white;
                transition: background-color 0.2s;
            `;
            targetEl.textContent = target.name;
            
            targetEl.addEventListener('click', () => {
                if (onSelectCallback) {
                    onSelectCallback(target);
                }
                hideStandalonePopup();
            });
            
            targetEl.addEventListener('mouseover', () => {
                targetEl.style.backgroundColor = '#444';
            });
            
            targetEl.addEventListener('mouseout', () => {
                targetEl.style.backgroundColor = '#333';
            });
            
            targetsContainer.appendChild(targetEl);
        });
        
        // Show popup
        popup.style.display = 'flex';
    };
    
    // Function to hide standalone popup
    function hideStandalonePopup() {
        const popup = document.getElementById('standalone-popup');
        if (popup) {
            popup.style.display = 'none';
        }
    }
    
    // Initialize on page load
    window.addEventListener('DOMContentLoaded', createStandalonePopup);
    
    // Override the original showTargetSelection function
    const originalInitGame = window.initGame;
    window.initGame = function() {
        if (originalInitGame) {
            originalInitGame();
        }
        
        // Override the showTargetSelection function to use our standalone popup
        window.originalShowTargetSelection = window.showTargetSelection;
        window.showTargetSelection = function() {
            const targets = gameState.computerTeam.filter(combatant => !combatant.defeated);
            
            if (targets.length === 0) {
                document.getElementById('status-message').textContent = "No targets available to attack.";
                return;
            }
            
            window.showStandaloneTargetPopup(targets, (target) => {
                gameState.selectedTarget = target;
                performAttack();
            });
        };
        
        console.log('Game initialization extended with popup override');
    };
})();
