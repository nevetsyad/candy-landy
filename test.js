// Simple test script to check canvas and game initialization
console.log('Starting Candy Landy test...');

try {
  // Check if canvas exists
  const canvas = document.getElementById('gameCanvas');
  if (!canvas) {
    console.error('Canvas element not found');
  } else {
    console.log('Canvas element found:', canvas);
    
    // Check if canvas context can be created
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('Failed to create canvas context');
    } else {
      console.log('Canvas context created successfully');
      
      // Test basic drawing
      ctx.fillStyle = '#FF69B4';
      ctx.fillRect(10, 10, 100, 100);
      console.log('Basic drawing test completed');
    }
  }
  
  // Check if game.js variables are accessible
  if (typeof canvas !== 'undefined') {
    console.log('Canvas variable exists');
  } else {
    console.log('Canvas variable not accessible');
  }
  
  console.log('Test completed');
} catch (error) {
  console.error('Error during test:', error);
}