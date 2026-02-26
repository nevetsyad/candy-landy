// Simple validation script for Candy Landy
console.log('=== Candy Landy Validation ===');

try {
  // Check if the game.js file can be loaded
  console.log('✓ Game.js file exists');
  
  // Check if all required functions exist
  const requiredFunctions = [
    'initGame', 'resetGame', 'gameLoop', 'update', 'draw',
    'handleKeyDown', 'handleKeyUp', 'drawStartScreen', 
    'drawWinScreen', 'drawLoseScreen', 'drawUI'
  ];
  
  requiredFunctions.forEach(funcName => {
    if (typeof window[funcName] === 'function') {
      console.log(`✓ Function ${funcName} exists`);
    } else {
      console.log(`✗ Function ${funcName} missing`);
    }
  });
  
  // Check if game classes exist
  const requiredClasses = ['Emmaline', 'Level'];
  requiredClasses.forEach(className => {
    if (typeof window[className] === 'function') {
      console.log(`✓ Class ${className} exists`);
    } else {
      console.log(`✗ Class ${className} missing`);
    }
  });
  
  // Test canvas initialization
  if (typeof window.canvas !== 'undefined') {
    console.log('✓ Canvas variable exists');
  } else {
    console.log('✗ Canvas variable missing');
  }
  
  if (typeof window.ctx !== 'undefined') {
    console.log('✓ Canvas context variable exists');
  } else {
    console.log('✗ Canvas context variable missing');
  }
  
  console.log('=== Validation Complete ===');
  
  // Try to initialize the game
  console.log('Attempting to initialize game...');
  if (typeof initGame === 'function') {
    initGame();
    console.log('✓ Game initialized successfully');
    
    // Check if game objects were created
    if (typeof emmaline !== 'undefined') {
      console.log('✓ Emmaline character created');
    } else {
      console.log('✗ Emmaline character not created');
    }
    
    if (typeof level !== 'undefined') {
      console.log('✓ Level created');
    } else {
      console.log('✗ Level not created');
    }
    
    // Check game state
    console.log('Game state:', gameState);
    console.log('Score:', score);
    
  } else {
    console.log('✗ initGame function not available');
  }
  
} catch (error) {
  console.error('Validation error:', error);
}