class Sprite {
  constructor({
    position,
    imageSrc,
    scale = 1,
    framesMax = 1,
    offset = { x: 0, y: 0 }
  }) {
    this.position = position
    this.width = 50
    this.height = 150
    this.image = new Image()
    this.image.src = imageSrc
    this.scale = scale
    this.framesMax = framesMax
    this.framesCurrent = 0
    this.framesElapsed = 0
    this.framesHold = 5
    this.offset = offset
  }

  draw() {
    c.drawImage(
      this.image,
      this.framesCurrent * (this.image.width / this.framesMax),
      0,
      this.image.width / this.framesMax,
      this.image.height,
      this.position.x - this.offset.x,
      this.position.y - this.offset.y,
      (this.image.width / this.framesMax) * this.scale,
      this.image.height * this.scale
    )
  }

  animateFrames() {
    this.framesElapsed++

    if (this.framesElapsed % this.framesHold === 0) {
      if (this.framesCurrent < this.framesMax - 1) {
        this.framesCurrent++
      } else {
        this.framesCurrent = 0
      }
    }
  }

  update() {
    this.draw()
    this.animateFrames()
  }
}

class Fighter extends Sprite {
  constructor({
    position,
    velocity,
    color = 'red',
    imageSrc,
    scale = 1,
    framesMax = 1,
    offset = { x: 0, y: 0 },
    sprites,
    attackBox = { offset: {}, width: undefined, height: undefined }
    , maxHealth = 100
  }) {
    super({
      position,
      imageSrc,
      scale,
      framesMax,
      offset
    })

    this.velocity = velocity
    this.width = 50
    this.height = 150
    this.lastKey
    this.attackBox = {
      position: {
        x: this.position.x,
        y: this.position.y
      },
      offset: attackBox.offset,
      width: attackBox.width,
      height: attackBox.height
    }
    this.color = color
    this.isAttacking
    this.maxHealth = maxHealth
    this.health = this.maxHealth
    this.framesCurrent = 0
    this.framesElapsed = 0
    this.framesHold = 5
    this.sprites = sprites
    this.dead = false
    this.currentSprite = 'idle'

    for (const sprite in this.sprites) {
      sprites[sprite].image = new Image()
      sprites[sprite].image.src = sprites[sprite].imageSrc
    }
  }

  update() {
    this.draw()
    if (!this.dead) this.animateFrames()

    // attack boxes
    this.attackBox.position.x = this.position.x + this.attackBox.offset.x
    this.attackBox.position.y = this.position.y + this.attackBox.offset.y

    // draw the attack box
    // c.fillRect(
    //   this.attackBox.position.x,
    //   this.attackBox.position.y,
    //   this.attackBox.width,
    //   this.attackBox.height
    // )

    this.position.x += this.velocity.x
    this.position.y += this.velocity.y

    // Keep fighter within canvas horizontal bounds so they don't exceed the background
    // Use the fighter's approximate width scaled to clamp the position.
    const fighterRenderWidth = (this.width || 50) * (this.scale || 1)
    if (this.position.x < 0) this.position.x = 0
    if (this.position.x + fighterRenderWidth > canvas.width)
      this.position.x = canvas.width - fighterRenderWidth

    // gravity function
    if (this.position.y + this.height + this.velocity.y >= canvas.height - 96) {
      this.velocity.y = 0
      this.position.y = 330
    } else this.velocity.y += gravity
  }

  // Override animateFrames to clear attacking state when attack animation ends
  animateFrames() {
    this.framesElapsed++

    if (this.framesElapsed % this.framesHold === 0) {
      if (this.framesCurrent < this.framesMax - 1) {
        this.framesCurrent++
      } else {
        // If an attack animation finished, clear the attacking flag so
        // movement slow effect ends when the attack completes.
        if (this.currentSprite === 'attack1' || this.currentSprite === 'attack2') {
          this.isAttacking = false
        }
        this.framesCurrent = 0
      }
    }
  }

  // Return true when fighter is standing on the ground (not airborne)
  isOnGround() {
    // ground Y for position is canvas.height - 96 - this.height (matches update())
    const groundY = canvas.height - 96 - this.height
    // allow a small epsilon for float math
    return this.position.y >= groundY - 0.5
  }

  attack() {
    this.switchSprite('attack1')
    this.isAttacking = true
  }

  attack2() {
    this.switchSprite('attack2')
    this.isAttacking = true
  }

  takeHit() {
    // Prevent taking additional damage after health reaches 0
    if (this.health > 0) {
      // Damage scales to 10% of max health; allow decimals so we can show precision
      const damage = Math.max(0.01, this.maxHealth * 0.1)
      this.health -= damage

      if (this.health <= 0) {
        this.health = 0
        this.switchSprite('death')
      } else this.switchSprite('takeHit')
    }
  }

  switchSprite(sprite) {
    if (this.image === this.sprites.death.image) {
      if (this.framesCurrent === this.sprites.death.framesMax - 1)
        this.dead = true;
      return;
    }

    // overriding all other animations with the attack animation
    if (
      (this.image === this.sprites.attack1.image ||
        this.image === this.sprites.attack2.image) &&
      this.framesCurrent < this.framesMax - 1
    )
      return;

    // override when fighter gets hit
    if (
      this.image === this.sprites.takeHit.image &&
      this.framesCurrent < this.sprites.takeHit.framesMax - 1
    )
      return;

    switch (sprite) {
      case 'idle':
        if (this.image !== this.sprites.idle.image) {
          this.image = this.sprites.idle.image;
          this.framesMax = this.sprites.idle.framesMax;
          this.framesHold = this.sprites.idle.framesHold;  // Add this line
          this.framesCurrent = 0;
          this.currentSprite = 'idle';
        }
        break;
      case 'run':
        if (this.image !== this.sprites.run.image) {
          this.image = this.sprites.run.image;
          this.framesMax = this.sprites.run.framesMax;
          this.framesHold = this.sprites.run.framesHold;  // Add this line
          this.framesCurrent = 0;
          this.currentSprite = 'run';
        }
        break;
      case 'jump':
        if (this.image !== this.sprites.jump.image) {
          this.image = this.sprites.jump.image;
          this.framesMax = this.sprites.jump.framesMax;
          this.framesHold = this.sprites.jump.framesHold;  // Add this line
          this.framesCurrent = 0;
          this.currentSprite = 'jump';
        }
        break;
      case 'fall':
        if (this.image !== this.sprites.fall.image) {
          this.image = this.sprites.fall.image;
          this.framesMax = this.sprites.fall.framesMax;
          this.framesHold = this.sprites.fall.framesHold;  // Add this line
          this.framesCurrent = 0;
          this.currentSprite = 'fall';
        }
        break;
      case 'attack1':
        if (this.image !== this.sprites.attack1.image) {
          this.image = this.sprites.attack1.image;
          this.framesMax = this.sprites.attack1.framesMax;
          this.framesHold = this.sprites.attack1.framesHold;  // Add this line
          this.framesCurrent = 0;
          this.currentSprite = 'attack1';
        }
        break;
      case 'attack2':
        if (this.image !== this.sprites.attack2.image) {
          this.image = this.sprites.attack2.image;
          this.framesMax = this.sprites.attack2.framesMax;
          this.framesHold = this.sprites.attack2.framesHold;  // Add this line
          this.framesCurrent = 0;
          this.currentSprite = 'attack2';
        }
        break;
      case 'takeHit':
        if (this.image !== this.sprites.takeHit.image) {
          this.image = this.sprites.takeHit.image;
          this.framesMax = this.sprites.takeHit.framesMax;
          this.framesHold = this.sprites.takeHit.framesHold;  // Add this line
          this.framesCurrent = 0;
          this.currentSprite = 'takeHit';
        }
        break;
      case 'death':
        if (this.image !== this.sprites.death.image) {
          this.image = this.sprites.death.image;
          this.framesMax = this.sprites.death.framesMax;
          this.framesHold = this.sprites.death.framesHold;  // Add this line
          this.framesCurrent = 0;
          this.currentSprite = 'death';
        }
        break;
    }
  }
}