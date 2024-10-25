function drawBlackHole(scene, x, y, radius, numRings = 5) {
    // Create a container to hold all black hole components
    const blackHoleContainer = scene.add.container(x, y);
    console.log('Black hole container created.');
  
    // Create the black hole central graphics (black circle)
    const blackHoleGraphics = scene.add.graphics();
    blackHoleGraphics.fillStyle(0x000000, 1);  // Black color for the center
    blackHoleGraphics.beginPath();
    blackHoleGraphics.arc(0, 0, radius, 0, Math.PI * 2);  // Draw the center black circle
    blackHoleGraphics.closePath();
    blackHoleGraphics.fillPath();
    blackHoleContainer.add(blackHoleGraphics);
    console.log('Black hole central circle drawn with radius:', radius);
  
    // Add rotating spiral rings with a "light-sucking" color effect
    for (let i = 0; i < numRings; i++) {
      const ring = scene.add.graphics();
      
      // Define ring properties: dark purple, blue, and red hues with decreasing opacity
      const ringColors = [0x4B0082, 0x00008B, 0x8B0000];  // Indigo, dark blue, and dark red
      const ringColor = ringColors[i % ringColors.length];  // Cycle through colors
      const alpha = 0.15 - (i * 0.02);  // Fade opacity for each ring
      
      // Set the line style for the ring with reduced brightness
      ring.lineStyle(3, ringColor, alpha);
      
      // Draw a circular ring, increasing the radius for each ring
      const ringRadius = radius + (i * 10);  // Each ring is 10px larger than the last
      ring.strokeCircle(0, 0, ringRadius);  // Draw the ring
      blackHoleContainer.add(ring);
  
      console.log(`Ring ${i + 1} drawn with radius:`, ringRadius, 'and color:', ringColor);
  
      // Add a slow, eerie rotating animation for the rings
      scene.tweens.add({
        targets: ring,
        angle: i % 2 === 0 ? 360 : -360,  // Alternate between clockwise and counter-clockwise
        duration: 4000 + (i * 400),  // Slightly slower rotation for each ring
        repeat: -1,  // Infinite rotation
        ease: 'Linear',  // Linear easing for consistent motion
      });
    }
  
  
    return blackHoleContainer;
  }
  

  
function applyGravitationalPull(object, blackHoleCenter) {
    const distance = Phaser.Math.Distance.Between(object.x, object.y, blackHoleCenter.x, blackHoleCenter.y);
    const gravityStrength = 5000;  // Adjust the gravity strength for desired effect
    const eventHorizonRadius = 50;
    if (distance < eventHorizonRadius) {
      console.log(`${object.texture.key} entered the black hole and is being destroyed.`);
      object.destroy();  // Destroy the object
      return;  
    }
    
    if (distance < 200) {
      const angle = Phaser.Math.Angle.Between(object.x, object.y, blackHoleCenter.x, blackHoleCenter.y);
      
      // Apply velocity towards the black hole
      object.body.velocity.x += Math.cos(angle) * gravityStrength / distance;
      object.body.velocity.y += Math.sin(angle) * gravityStrength / distance;
    }
  }
  