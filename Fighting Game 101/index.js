window.addEventListener('DOMContentLoaded', () => {
  const homeScreen = document.getElementById('homeScreen')
  const startButton = document.getElementById('startButton')
  const gameContainer = document.querySelector('.game-container')

  // Wait until sprite images for fighters are loaded before starting the match.
  function waitForSpritesLoaded(fighters, timeout = 5000) {
    return new Promise((resolve) => {
      const start = Date.now()
      function check() {
        const allLoaded = fighters.every((f) => {
          if (!f || !f.sprites) return true
          return Object.values(f.sprites).every((s) => s.image && s.image.complete)
        })
        if (allLoaded) return resolve()
        if (Date.now() - start > timeout) return resolve()
        setTimeout(check, 100)
      }
      check()
    })
  }

  startButton.addEventListener('click', () => {
    console.log('Fight button clicked') // Debug
    homeScreen.classList.add('fade-out')
    setTimeout(async () => {
      await waitForSpritesLoaded([player, enemy], 5000)
      homeScreen.style.display = 'none'
      gameContainer.style.display = 'block'
      resetRound()
      animate()
    }, 1000)
  })
})
  
const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')
canvas.width = 1024
canvas.height = 576
c.fillRect(0, 0, canvas.width, canvas.height)
const gravity = 0.7
const background = new Sprite({
  position: {
    x: 0,
    y: 0
  },
  imageSrc: './img/background.png'
})
const player = new Fighter({
  position: {
    x: 100,
    y: 0
  },
  velocity: {
    x: 0,
    y: 0
  },
  offset: { // Drawing offset (remove the duplicate/conflicting one if present)
    x: 215,
    y: 157
  },
  imageSrc: './img/samuraiMack/Idle.png',
  framesMax: 8,
  scale: 2.5,
  sprites: {
    idle: {
      imageSrc: './img/samuraiMack/Idle.png',
      framesMax: 8,
      framesHold: 12 // Slower for smooth idle
    },
    run: {
      imageSrc: './img/samuraiMack/Run.png',
      framesMax: 8,
      framesHold: 6 // Medium-fast
    },
    jump: {
      imageSrc: './img/samuraiMack/Jump.png',
      framesMax: 2,
      framesHold: 10
    },
    fall: {
      imageSrc: './img/samuraiMack/Fall.png',
      framesMax: 2,
      framesHold: 10
    },
    attack1: {
      imageSrc: './img/samuraiMack/Attack1.png',
      framesMax: 6,
      framesHold: 12 // Slower so opponent can dodge
    },
    attack2: {
      imageSrc: './img/samuraiMack/Attack2.png',
      framesMax: 6,
      framesHold: 12 // Slower so opponent can dodge
    },
    takeHit: {
      imageSrc: './img/samuraiMack/Take Hit - white silhouette.png',
      framesMax: 4,
      framesHold: 4
    },
    death: {
      imageSrc: './img/samuraiMack/Death.png',
      framesMax: 6,
      framesHold: 12
    }
  },
  attackBox: {
    offset: {
      x: 100,
      y: 50
    },
    width: 160,
    height: 50
  },
  maxHealth: 250
})
const enemy = new Fighter({
  position: {
    x: 824,
    y: 0,
  },
  velocity: {
    x: 0,
    y: 0
  },
  offset: {
    x: 215,
    y: 167
  },
  imageSrc: './img/kenji/Idle.png',
  framesMax: 4,
  scale: 2.5,
  sprites: {
    idle: {
      imageSrc: './img/kenji/Idle.png',
      framesMax: 4,
      framesHold: 13 // Slower idle
    },
    run: {
      imageSrc: './img/kenji/Run.png',
      framesMax: 8,
      framesHold: 6
    },
    jump: {
      imageSrc: './img/kenji/Jump.png',
      framesMax: 2,
      framesHold: 13
    },
    fall: {
      imageSrc: './img/kenji/Fall.png',
      framesMax: 2,
      framesHold: 10
    },
    attack1: {
      imageSrc: './img/kenji/Attack1.png',
      framesMax: 4,
      framesHold: 4 // Slower so opponent can dodge
    },
    attack2: {
      imageSrc: './img/kenji/Attack2.png',
      framesMax: 4,
      framesHold: 10 // Slower so opponent can dodge
    },
    takeHit: {
      imageSrc: './img/kenji/Take hit.png',
      framesMax: 3,
      framesHold: 4
    },
    death: {
      imageSrc: './img/kenji/Death.png',
      framesMax: 7,
      framesHold: 12
    }
  },
  attackBox: {
    offset: {
      x: -170,
      y: 50
    },
    width: 170,
    height: 50
  },
  maxHealth: 250
})
const keys = {
  a: {
    pressed: false
  },
  d: {
    pressed: false
  },
  ArrowRight: {
    pressed: false
  },
  ArrowLeft: {
    pressed: false
  }
}

// Add scoring variables
let playerWins = 0
let enemyWins = 0
const maxWins = 3 // Best of 5 means first to 3
let roundEnded = false // Track if round has ended
let matchEnded = false // Track if the match is over

// Function to reset for a new round
function resetRound() {
  roundEnded = false // Reset the round-ended flag
  player.health = player.maxHealth
  enemy.health = enemy.maxHealth
  player.position = { x: 100, y: 0 }
  enemy.position = { x: 824, y: 0 }
  player.velocity = { x: 0, y: 0 }
  enemy.velocity = { x: 0, y: 0 }
  player.dead = false
  enemy.dead = false
  player.isAttacking = false
  enemy.isAttacking = false
  player.framesCurrent = 0
  enemy.framesCurrent = 0
  // Force-reset sprite/image/frame to idle in case fighter was left on death
  if (player.sprites && player.sprites.idle) {
    player.image = player.sprites.idle.image
    player.framesMax = player.sprites.idle.framesMax
    player.framesHold = player.sprites.idle.framesHold || 5
    player.framesCurrent = 0
  } else {
    player.switchSprite && player.switchSprite('idle')
  }

  if (enemy.sprites && enemy.sprites.idle) {
    enemy.image = enemy.sprites.idle.image
    enemy.framesMax = enemy.sprites.idle.framesMax
    enemy.framesHold = enemy.sprites.idle.framesHold || 5
    enemy.framesCurrent = 0
  } else {
    enemy.switchSprite && enemy.switchSprite('idle')
  }
  gsap.to('#playerHealth', { width: '100%' })
  gsap.to('#enemyHealth', { width: '100%' })
  // Update numeric HUD — show `current / max` on the bar and small HUD number
  const playerHealthNum = document.getElementById('playerHealthNumber')
  const enemyHealthNum = document.getElementById('enemyHealthNumber')
  const playerHealthSmall = document.getElementById('playerHealthSmall')
  const enemyHealthSmall = document.getElementById('enemyHealthSmall')
  if (playerHealthNum) playerHealthNum.innerText = `${formatHealthDisplay(player.health)} / ${formatHealthDisplay(player.maxHealth)}`
  if (enemyHealthNum) enemyHealthNum.innerText = `${formatHealthDisplay(enemy.health)} / ${formatHealthDisplay(enemy.maxHealth)}`
  if (playerHealthSmall) playerHealthSmall.innerText = `${formatHealthDisplay(player.health)}`
  if (enemyHealthSmall) enemyHealthSmall.innerText = `${formatHealthDisplay(enemy.health)}`
  // animate reset so it doesn't look static
  animateHealthChange(playerHealthNum, playerHealthSmall)
  animateHealthChange(enemyHealthNum, enemyHealthSmall)
}

// Format health for display: remove `.0` when the value is an integer, otherwise show 1 decimal
function formatHealthDisplay(value) {
  if (Math.abs(value - Math.round(value)) < 1e-6) return String(Math.round(value))
  return value.toFixed(1)
}

// Function to restart the match
function restartMatch() {
  matchEnded = false
  playerWins = 0
  enemyWins = 0
  document.querySelector('#playerScore').innerHTML = playerWins
  document.querySelector('#enemyScore').innerHTML = enemyWins
  // Hide restart button and controls if visible
  const restartBtn = document.getElementById('restartButton')
  const roundControls = document.getElementById('roundControls')
  if (restartBtn) {
    restartBtn.style.display = 'none'
    restartBtn.classList.remove('restart-anim')
    // remove color classes if present
    restartBtn.classList.remove('restart-color-gold', 'restart-color-red', 'restart-color-green', 'restart-color-blue')
  }
  // removed particle effects: no clearConfetti call
  if (roundControls) roundControls.style.display = 'none'
  document.querySelector('#displayText').style.display = 'none'
  resetRound()
}

// Position the round controls centered over the canvas (fixes top-gap issue)
function positionRoundControls() {
  const roundControls = document.getElementById('roundControls')
  const container = document.querySelector('.game-container')
  const canvasEl = document.querySelector('canvas')
  if (!roundControls || !container || !canvasEl) return

  const containerRect = container.getBoundingClientRect()
  const canvasRect = canvasEl.getBoundingClientRect()

  const left = canvasRect.left - containerRect.left + canvasRect.width / 2
  const top = canvasRect.top - containerRect.top + canvasRect.height / 2

  roundControls.style.left = `${left}px`
  roundControls.style.top = `${top}px`
  roundControls.style.transform = 'translate(-50%, -50%)'
  roundControls.style.pointerEvents = 'auto'
}

// Reposition on resize so the button stays centered over the canvas
window.addEventListener('resize', () => {
  positionRoundControls()
})


// Modified determineWinner to handle rounds
function determineWinner({ player, enemy }) {
  // If a round is already ended, do nothing (prevents double-scoring)
  if (roundEnded) return
  roundEnded = true // Set flag to prevent more damage
  document.querySelector('#displayText').style.display = 'flex'
  // Helper to force a fighter to play an animation even if switchSprite early-returns
  function forcePlayAnimation(fighter, name) {
    if (!fighter || !fighter.sprites || !fighter.sprites[name]) return
    const sprite = fighter.sprites[name]
    // set image and frame properties directly
    if (sprite.image) fighter.image = sprite.image
    fighter.framesMax = sprite.framesMax
    fighter.framesHold = sprite.framesHold || fighter.framesHold || 5
    fighter.framesCurrent = 0
    // ensure dead state isn't blocking animation (it will be set once death completes)
    fighter.dead = false
    // clear attacking flag to avoid conflicts
    fighter.isAttacking = false
  }
  if (player.health === enemy.health) {
    document.querySelector('#displayText').innerHTML = 'Tie'
  } else if (player.health > enemy.health) {
    document.querySelector('#displayText').innerHTML = 'Player 1 Wins Round'
    playerWins++
    document.querySelector('#playerScore').innerHTML = playerWins // Update score display
    // Ensure the enemy's losing animation plays. If enemy's health is 0, play death,
    // otherwise play a takeHit animation to show they lost the round.
    if (enemy.health <= 0) {
      // force death animation so it always shows
      forcePlayAnimation(enemy, 'death')
    } else {
      forcePlayAnimation(enemy, 'takeHit')
    }
  } else if (player.health < enemy.health) {
    document.querySelector('#displayText').innerHTML = 'Player 2 Wins Round'
    // Ensure the player's losing animation plays. If player's health is 0, play death,
    // otherwise play a takeHit animation to show they lost the round.
    if (player.health <= 0) {
      forcePlayAnimation(player, 'death')
    } else {
      forcePlayAnimation(player, 'takeHit')
    }
    enemyWins++
    document.querySelector('#enemyScore').innerHTML = enemyWins // Update score display
  }

  // Check for overall winner
  if (playerWins >= maxWins || enemyWins >= maxWins) {
    // Game over - Match ended
    matchEnded = true
    document.querySelector('#displayText').innerHTML = (playerWins >= maxWins ? 'Player 1' : 'Player 2') + ' Wins the Match!<br><br>Press SPACE or click the button below to Restart'
    // Show restart button
    const restartBtn = document.getElementById('restartButton')
    const roundControls = document.getElementById('roundControls')
    if (roundControls) roundControls.style.display = 'block'
    if (restartBtn) {
      restartBtn.style.display = 'inline-block'
      restartBtn.classList.add('restart-anim')
      // Cycle color classes (gold -> red -> green -> blue)
      const colorClasses = ['restart-color-gold', 'restart-color-red', 'restart-color-green', 'restart-color-blue']
      if (typeof window.restartColorIndex === 'undefined') window.restartColorIndex = 0
      // Remove any existing color classes
      colorClasses.forEach((cc) => restartBtn.classList.remove(cc))
      const pick = colorClasses[window.restartColorIndex % colorClasses.length]
      restartBtn.classList.add(pick)
      window.restartColorIndex++
      try {
        if (typeof gsap !== 'undefined') gsap.fromTo(restartBtn, { scale: 0.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.25, ease: 'back.out(1.7)' })
      } catch (e) {}
    }
  } else {
    // Next round after a delay
    setTimeout(() => {
      document.querySelector('#displayText').style.display = 'none'
      resetRound()
    }, 3000) // 3 second delay before next round
  }
}

function animate() {
  window.requestAnimationFrame(animate)
  c.fillStyle = 'black'
  c.fillRect(0, 0, canvas.width, canvas.height)
  background.update()
  c.fillStyle = 'rgba(255, 255, 255, 0.15)'
  c.fillRect(0, 0, canvas.width, canvas.height)
  player.update()
  enemy.update()
  player.velocity.x = 0
  enemy.velocity.x = 0
  // player movement (only when not dead)
  if (!player.dead) {
    const pSpeed = player.isAttacking ? ATTACK_MOVE_SPEED : MOVE_SPEED
    if (keys.a.pressed && player.lastKey === 'a') {
      player.velocity.x = -pSpeed
      player.switchSprite('run')
    } else if (keys.d.pressed && player.lastKey === 'd') {
      player.velocity.x = pSpeed
      player.switchSprite('run')
    } else {
      player.switchSprite('idle')
    }

    // jumping
    if (player.velocity.y < 0) {
      player.switchSprite('jump')
    } else if (player.velocity.y > 0) {
      player.switchSprite('fall')
    }
  }

  // Enemy movement (only when not dead)
  if (!enemy.dead) {
    const eSpeed = enemy.isAttacking ? ATTACK_MOVE_SPEED : MOVE_SPEED
    if (keys.ArrowLeft.pressed && enemy.lastKey === 'ArrowLeft') {
      enemy.velocity.x = -eSpeed
      enemy.switchSprite('run')
    } else if (keys.ArrowRight.pressed && enemy.lastKey === 'ArrowRight') {
      enemy.velocity.x = eSpeed
      enemy.switchSprite('run')
    } else {
      enemy.switchSprite('idle')
    }

    // jumping
    if (enemy.velocity.y < 0) {
      enemy.switchSprite('jump')
    } else if (enemy.velocity.y > 0) {
      enemy.switchSprite('fall')
    }
  }
  // detect for collision & enemy gets hit
  if (
    !roundEnded &&
    rectangularCollision({
      rectangle1: player,
      rectangle2: enemy
    }) &&
    player.isAttacking &&
    (player.framesCurrent === 4 || player.framesCurrent === player.framesMax - 3)
  ) {
    enemy.takeHit()
    player.isAttacking = false
    gsap.to('#enemyHealth', {
      width: ((enemy.health / enemy.maxHealth) * 100) + '%'
    })
    const enemyHealthNumEl = document.getElementById('enemyHealthNumber')
    const enemyHealthSmallEl = document.getElementById('enemyHealthSmall')
    if (enemyHealthNumEl) enemyHealthNumEl.innerText = `${formatHealthDisplay(enemy.health)} / ${formatHealthDisplay(enemy.maxHealth)}`
    if (enemyHealthSmallEl) enemyHealthSmallEl.innerText = formatHealthDisplay(enemy.health)
    animateHealthChange(enemyHealthNumEl, enemyHealthSmallEl)
  }
  // if player misses
  if (player.isAttacking && player.framesCurrent === player.framesMax - 1) {
    player.isAttacking = false
  }
  // this is where our player gets hit
  if (
    !roundEnded &&
    rectangularCollision({
      rectangle1: enemy,
      rectangle2: player
    }) &&
    enemy.isAttacking &&
    (enemy.framesCurrent === 2 || enemy.framesCurrent === enemy.framesMax - 2)
  ) {
    player.takeHit()
    enemy.isAttacking = false
    gsap.to('#playerHealth', {
      width: ((player.health / player.maxHealth) * 100) + '%'
    })
    const playerHealthNumEl = document.getElementById('playerHealthNumber')
    const playerHealthSmallEl = document.getElementById('playerHealthSmall')
    if (playerHealthNumEl) playerHealthNumEl.innerText = `${formatHealthDisplay(player.health)} / ${formatHealthDisplay(player.maxHealth)}`
    if (playerHealthSmallEl) playerHealthSmallEl.innerText = formatHealthDisplay(player.health)
    animateHealthChange(playerHealthNumEl, playerHealthSmallEl)
  }
  // if player misses
  if (enemy.isAttacking && enemy.framesCurrent === enemy.framesMax - 1) {
    enemy.isAttacking = false
  }
  // end round based on health
  if (!roundEnded && (enemy.health <= 0 || player.health <= 0)) {
    determineWinner({ player, enemy })
  }
}
// Movement speeds (must be declared before starting the game loop)
const MOVE_SPEED = 5
const ATTACK_MOVE_SPEED = 2 // slower speed while attacking

animate()

// Helper to animate health text changes
function animateHealthChange(el, smallEl) {
  try {
    if (el) {
      gsap.fromTo(el, { scale: 1.3 }, { scale: 1, duration: 0.12, ease: 'power1.out' })
      gsap.fromTo(el, { color: '#fff' }, { color: '#ffef00', duration: 0.08, yoyo: true, repeat: 1 })
    }
    if (smallEl) {
      gsap.fromTo(smallEl, { x: -6 }, { x: 0, duration: 0.12, ease: 'power1.out', yoyo: true, repeat: 1 })
      gsap.fromTo(smallEl, { scale: 1.15 }, { scale: 1, duration: 0.12 })
    }
  } catch (e) {
    // GSAP not present or minor failure, ignore
  }
}

// No confetti functions - particle effects disabled
window.addEventListener('keydown', (event) => {
  // Allow restarting match if it's over
  if (matchEnded && event.key === ' ') {
    restartMatch()
    return
  }

  if (!player.dead) {
    switch (event.key) {
      case 'd':
        keys.d.pressed = true
        player.lastKey = 'd'
        break
      case 'a':
        keys.a.pressed = true
        player.lastKey = 'a'
        break
      case 'w':
        // only allow jump if on ground
        if (player.isOnGround && player.isOnGround()) player.velocity.y = -20
        break
      case 's':
        player.attack()
        break
      case 'e':
      case 'E':
        player.attack2()
        break
    }
  }
  if (!enemy.dead) {
    switch (event.key) {
      case 'ArrowRight':
        keys.ArrowRight.pressed = true
        enemy.lastKey = 'ArrowRight'
        break
      case 'ArrowLeft':
        keys.ArrowLeft.pressed = true
        enemy.lastKey = 'ArrowLeft'
        break
      case 'ArrowUp':
        // only allow enemy jump if on ground
        if (enemy.isOnGround && enemy.isOnGround()) enemy.velocity.y = -20
        break
      case 'ArrowDown':
        enemy.attack()
        break
      case 'k':
      case 'K':
        enemy.attack2()
        break
    }
  }
})
window.addEventListener('keyup', (event) => {
  switch (event.key) {
    case 'd':
      keys.d.pressed = false
      break
    case 'a':
      keys.a.pressed = false
      break
  }
  // enemy keys
  switch (event.key) {
    case 'ArrowRight':
      keys.ArrowRight.pressed = false
      break
    case 'ArrowLeft':
      keys.ArrowLeft.pressed = false
      break
  }
})

document.getElementById('moveLeft').addEventListener('touchstart', () => {
  keys.a.pressed = true
  player.lastKey = 'a'
})
document.getElementById('moveLeft').addEventListener('touchend', () => {
  keys.a.pressed = false
})

document.getElementById('moveRight').addEventListener('touchstart', () => {
  keys.d.pressed = true
  player.lastKey = 'd'
})
document.getElementById('moveRight').addEventListener('touchend', () => {
  keys.d.pressed = false
})

document.getElementById('jump').addEventListener('touchstart', () => {
  if (!player.dead && player.isOnGround && player.isOnGround()) player.velocity.y = -15
})

document.getElementById('attack').addEventListener('touchstart', () => {
  if (!player.dead) player.attack()
})

// Restart button handler (also available via SPACE key)
const restartBtnEl = document.getElementById('restartButton')
if (restartBtnEl) {
  restartBtnEl.addEventListener('click', () => {
    restartMatch()
  })
  // Visual press animation for quick feedback (mousedown/touchstart)
  restartBtnEl.addEventListener('mousedown', () => {
    restartBtnEl.classList.add('restart-pressed')
    setTimeout(() => restartBtnEl.classList.remove('restart-pressed'), 140)
  })
  restartBtnEl.addEventListener('touchstart', () => {
    restartBtnEl.classList.add('restart-pressed')
    setTimeout(() => restartBtnEl.classList.remove('restart-pressed'), 140)
  }, { passive: true })
  // Keyboard accessibility: space/enter
  restartBtnEl.addEventListener('keydown', (ev) => {
    if (ev.key === ' ' || ev.key === 'Enter') {
      restartBtnEl.classList.add('restart-pressed')
      setTimeout(() => restartBtnEl.classList.remove('restart-pressed'), 140)
    }
  })
  // particle effects removed (no spawnConfetti)
}

// WebAudio SFX helper (global), supports 'restart','hit','heavy','death'
function playSfx(kind = 'beep') {
  try {
    if (!window.__audioCtx) window.__audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    const ctx = window.__audioCtx
    switch (kind) {
      case 'restart': {
        const o = ctx.createOscillator(); const g = ctx.createGain();
        o.type = 'square'; o.frequency.value = 880; g.gain.value = 0.12; o.connect(g); g.connect(ctx.destination);
        o.start(); g.gain.setValueAtTime(0.12, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08); o.stop(ctx.currentTime + 0.1);
        break;
      }
      case 'hit': {
        const o = ctx.createOscillator(); const g = ctx.createGain();
        o.type = 'triangle'; o.frequency.value = 240; g.gain.value = 0.08; o.connect(g); g.connect(ctx.destination);
        o.start(); g.gain.setValueAtTime(0.08, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06); o.stop(ctx.currentTime + 0.08);
        break;
      }
      case 'heavy': {
        const o = ctx.createOscillator(); const g = ctx.createGain();
        o.type = 'sawtooth'; o.frequency.value = 180; g.gain.value = 0.12; o.connect(g); g.connect(ctx.destination);
        o.start(); g.gain.setValueAtTime(0.12, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12); o.stop(ctx.currentTime + 0.14);
        break;
      }
      case 'death': {
        const o = ctx.createOscillator(); const g = ctx.createGain();
        o.type = 'sine'; o.frequency.value = 400; g.gain.value = 0.14; o.connect(g); g.connect(ctx.destination);
        o.start(); o.frequency.setValueAtTime(400, ctx.currentTime); o.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.6);
        g.gain.setValueAtTime(0.14, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
        o.stop(ctx.currentTime + 0.65);
        break;
      }
      default: {
        const o = ctx.createOscillator(); const g = ctx.createGain();
        o.type = 'square'; o.frequency.value = 880; g.gain.value = 0.08; o.connect(g); g.connect(ctx.destination);
        o.start(); g.gain.setValueAtTime(0.08, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06); o.stop(ctx.currentTime + 0.08);
      }
    }
  } catch (err) { /* ignore error */ }
}
// Play sound on mouse/touch/keyboard press (use playSfx to match the helper defined above)
  if (restartBtnEl) {
    restartBtnEl.addEventListener('mousedown', () => playSfx('restart'))
    restartBtnEl.addEventListener('touchstart', () => playSfx('restart'), { passive: true })
    restartBtnEl.addEventListener('keydown', (ev) => { if (ev.key === ' ' || ev.key === 'Enter') playSfx('restart') })
  }
  // No confetti: removed falling confetti spawn on press

// (movement speed constants are declared earlier)