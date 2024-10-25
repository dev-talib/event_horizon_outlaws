function setupMiniMap(scene) {
  // Create mini-map camera
  const miniCam = scene.cameras.add(window.innerWidth - 210, 10, 200, 150)
      .setZoom(0.2)
      .setName('miniCam')
      .setBackgroundColor(0x000000);

  // Attach miniCam to the scene object for later access
  scene.miniCam = miniCam;

  // Draw the mini-map background rectangle
  scene.add.rectangle(window.innerWidth - 210, 10, 200, 150, 0x000000)
      .setOrigin(0)
      .setDepth(0);

  // Key listener for expanding/collapsing the mini-map
  const mapKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M);
  mapKey.on('down', () => toggleMapSize(scene));

  return miniCam; // Return the mini-map camera if needed elsewhere
}

function toggleMapSize(scene) {
  miniMapExpanded = !miniMapExpanded;

  if (miniMapExpanded) {
      // Expand mini-map to cover half the screen
      const halfScreenWidth = window.innerWidth / 2;
      const halfScreenHeight = window.innerHeight;
      scene.miniCam.setSize(halfScreenWidth, halfScreenHeight); // Cover half the screen width
      scene.miniCam.setPosition(0, 0); // Move to the top-left corner

      // Calculate zoom level to show the entire map
      const worldWidth = 3200; // Replace with your actual world width
      const worldHeight = 3200; // Replace with your actual world height
      const zoomX = halfScreenWidth / worldWidth; // Calculate zoom for width
      const zoomY = halfScreenHeight / worldHeight; // Calculate zoom for height
      scene.miniCam.setZoom(Math.min(zoomX, zoomY)); // Set zoom to show the whole map
      
      scene.miniCam.setBounds(0, 0, worldWidth, worldHeight); // Ensure it follows the same bounds as the main camera
  } else {
      // Collapse mini-map back to its original size
      scene.miniCam.setSize(200, 150);
      scene.miniCam.setPosition(window.innerWidth - 210, 10); // Move back to its original position
      scene.miniCam.setZoom(0.2); // Reset zoom to original value
      scene.miniCam.setBounds(0, 0, 3200, 3200); // Maintain the same bounds
  }
}
