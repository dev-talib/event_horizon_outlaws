function drawZone(scene, background) {
    zoneGraphics.clear();
  
    // Draw the shrinking zone as a circular mask
    zoneGraphics.fillStyle(0xffffff, 1); // White for the visible zone
    zoneGraphics.beginPath();
    zoneGraphics.arc(zoneCenter.x, zoneCenter.y, initialRadius, 0, Math.PI * 2);
    zoneGraphics.closePath();
    zoneGraphics.fillPath();
  
    // Optionally, draw a red border around the zone
    zoneGraphics.lineStyle(4, 0xff0000, 1); // Red border
    zoneGraphics.strokeCircle(zoneCenter.x, zoneCenter.y, initialRadius);
  
    // Apply the zoneGraphics as a mask to the background
    background.setMask(zoneGraphics.createGeometryMask());
}

function shrinkZoneOverTime(delta){
    if (initialRadius > minZoneRadius) {
        initialRadius -= shrinkRate * delta / 1000; // Shrink over time
        drawZone(this, background);
    }
}


