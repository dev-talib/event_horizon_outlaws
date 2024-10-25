function drawStars(scene, starCount){
    stars = scene.add.group();
  
    for (let i = 0; i < starCount; i++) {
      const x = Phaser.Math.Between(zoneCenter.x - initialRadius, zoneCenter.x + initialRadius);
      const y = Phaser.Math.Between(zoneCenter.y - initialRadius, zoneCenter.y + initialRadius);
      const distanceToCenter = Phaser.Math.Distance.Between(x, y, zoneCenter.x, zoneCenter.y);
      
      // Only create stars within the zone
      if (distanceToCenter <= initialRadius) {
        const star = scene.add.circle(x, y, 1, 0xffffff, 0.5); // Dimmer white stars
        stars.add(star);
      }
    }
  
    for (let i = 0; i < starCount; i++) {
      const x = Phaser.Math.Between(zoneCenter.x - initialRadius, zoneCenter.x + initialRadius);
      const y = Phaser.Math.Between(zoneCenter.y - initialRadius, zoneCenter.y + initialRadius);
      const distanceToCenter = Phaser.Math.Distance.Between(x, y, zoneCenter.x, zoneCenter.y);
      
      // Only create stars within the zone
      if (distanceToCenter <= initialRadius) {
        const star = scene.add.circle(x, y, 1, 0xffffff, 0.5); // Dimmer white stars
        stars.add(star);
      }
    }
  
}

function destroyStarsOutsideZone(){
    stars.getChildren().forEach((star) => {
        var distanceToCenter = Phaser.Math.Distance.Between(star.x, star.y, zoneCenter.x, zoneCenter.y);
        if (distanceToCenter > initialRadius) {
          star.destroy();
        }
    });
}
