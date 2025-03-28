// Popup fix to ensure proper display of target selection

// Wait for page to load
document.addEventListener('DOMContentLoaded', function() {
    // Get the overlay and target selection elements
    const overlay = document.getElementById('overlay');
    const targetSelection = document.getElementById('target-selection');
    
    if (!targetSelection || !overlay) {
        console.error("Target selection or overlay elements not found!");
        return;
    }
    
    console.log("Found target selection:", targetSelection);
    console.log("Found overlay:", overlay);
    
    // Fix any CSS issues with a dedicated style tag
    const styleTag = document.createElement('style');
    styleTag.textContent = `
        .target-selection {
            display: none;
            position: fixed !important;
            left: 50% !important;
            top: 50% !important;
            transform: translate(-50%, -50%) !important;
            z-index: 2000 !important;
            background-color: rgba(0, 0, 0, 0.9) !important;
            border: 2px solid #ffcc00 !important;
            width: 300px !important;
            padding: 20px !important;
            border-radius: 5px !important;
            box-shadow: 0 0 20px rgba(255, 204, 0, 0.7) !important;
        }
        
        .target-selection.active {
            display: block !important;
        }
        
        #overlay {
            display: none;
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 100% !important;
            background: rgba(0,0,0,0.5) !important;
            z-index: 1500 !important;
        }
    `;
    document.head.appendChild(styleTag);
    
    // Add event listener to cancel button
    const cancelTargetBtn = document.getElementById('cancel-target');
    if (cancelTargetBtn) {
        cancelTargetBtn.addEventListener('click', function() {
            // Hide everything
            targetSelection.style.display = 'none';
            targetSelection.classList.remove('active');
            overlay.style.display = 'none';
        });
    }
    
    // Add direct test button to body
    const testButton = document.createElement('button');
    testButton.textContent = 'EMERGENCY TEST: Show Target Selection';
    testButton.style.cssText = 'position: fixed; bottom: 10px; right: 10px; z-index: 9999; background: red; color: white; padding: 10px;';
    testButton.onclick = function() {
        overlay.style.display = 'block';
        targetSelection.style.display = 'block';
        targetSelection.classList.add('active');
        console.log("Emergency test button clicked!");
    };
    document.body.appendChild(testButton);
    
    console.log("Enhanced popup fix initialized");
});
