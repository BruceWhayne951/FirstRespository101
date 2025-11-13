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
        if (Date.now() - start > timeout) return resolve() // give up after timeout
        setTimeout(check, 100)
      }
      check()
    })
  }

  startButton.addEventListener('click', () => {
    console.log('Fight button clicked') // Debug
    homeScreen.classList.add('fade-out')
    // Keep the 1s fade-out, but ensure sprites are loaded before showing the game and starting round
    setTimeout(async () => {
      // Wait for player and enemy sprite images to finish loading (max 5s)
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
      framesHold: 5 // Snappy
    },
    takeHit: {
      imageSrc: './img/samuraiMack/Take Hit - white silhouette.png',
      framesMax: 4,
      framesHold: 4
    },
    death: {
      imageSrc: './img/samuraiMack/Death.png',
      framesMax: 6,
      framesHold: 8
    }
  },
  attackBox: {
    offset: {
      x: 100,
      y: 50
    },
    width: 160,
    height: 50
  }
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
      framesHold: 12 // Slower idle
    },
    run: {
      imageSrc: './img/kenji/Run.png',
      framesMax: 8,
      framesHold: 6
    },
    jump: {
      imageSrc: './img/kenji/Jump.png',
      framesMax: 2,
      framesHold: 10
    },
    fall: {
      imageSrc: './img/kenji/Fall.png',
      framesMax: 2,
      framesHold: 10
    },
    attack1: {
      imageSrc: './img/kenji/Attack1.png',
      framesMax: 4,
      framesHold: 7
    },
    takeHit: {
      imageSrc: './img/kenji/Take hit.png',
      framesMax: 3,
      framesHold: 4
    },
    death: {
      imageSrc: './img/kenji/Death.png',
      framesMax: 7,
      framesHold: 8
    }
  },
  attackBox: {
    offset: {
      x: -170,
      y: 50
    },
    width: 170,
    height: 50
  }
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
  player.health = 100
  enemy.health = 100
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

  // Use the window-scoped timer variables from utils.js
  window.timer = 60
  document.querySelector('#timer').innerHTML = window.timer
  clearTimeout(window.timerId)
  decreaseTimer() // start the timer (decreaseTimer sets window.timerId)
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
  if (restartBtn) restartBtn.style.display = 'none'
  if (roundControls) roundControls.style.display = 'none'
  document.querySelector('#displayText').style.display = 'none'
  resetRound()
}


// Modified determineWinner to handle rounds
function determineWinner({ player, enemy, timerId }) {
  // If a round is already ended, do nothing (prevents double-scoring)
  if (roundEnded) return
  roundEnded = true // Set flag to prevent more damage
  // clear the active timer (use window.timerId if provided)
  clearTimeout(typeof timerId !== 'undefined' ? timerId : window.timerId)
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
    if (restartBtn) restartBtn.style.display = 'inline-block'
  } else {
    // Next round after a delay
    setTimeout(() => {
      document.querySelector('#displayText').style.display = 'none'
      resetRound()
    }, 3000) // 3 second delay before next round
  }
}

// Timer is started by resetRound() when a round begins


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
    if (keys.a.pressed && player.lastKey === 'a') {
      player.velocity.x = -5
      player.switchSprite('run')
    } else if (keys.d.pressed && player.lastKey === 'd') {
      player.velocity.x = 5
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
    if (keys.ArrowLeft.pressed && enemy.lastKey === 'ArrowLeft') {
      enemy.velocity.x = -5
      enemy.switchSprite('run')
    } else if (keys.ArrowRight.pressed && enemy.lastKey === 'ArrowRight') {
      enemy.velocity.x = 5
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
    player.framesCurrent === 4
  ) {
    enemy.takeHit()
    player.isAttacking = false
    gsap.to('#enemyHealth', {
      width: enemy.health + '%'
    })
  }
  // if player misses
  if (player.isAttacking && player.framesCurrent === 4) {
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
    enemy.framesCurrent === 2
  ) {
    player.takeHit()
    enemy.isAttacking = false
    gsap.to('#playerHealth', {
      width: player.health + '%'
    })
  }
  // if player misses
  if (enemy.isAttacking && enemy.framesCurrent === 2) {
    enemy.isAttacking = false
  }
  // end round based on health
  if (!roundEnded && (enemy.health <= 0 || player.health <= 0)) {
    determineWinner({ player, enemy, timerId })
  }
}
animate()
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
        player.velocity.y = -20
        break
      case ' ':
        player.attack()
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
        enemy.velocity.y = -20
        break
      case 'ArrowDown':
        enemy.attack()
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
  if (!player.dead) player.velocity.y = -20
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
}