window.addEventListener('DOMContentLoaded', () => {
  const homeScreen = document.getElementById('homeScreen')
  const startButton = document.getElementById('startButton')
  const gameContainer = document.querySelector('.game-container')

  startButton.addEventListener('click', () => {
    console.log('Fight button clicked') // Debug
    homeScreen.classList.add('fade-out')
    setTimeout(() => {
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
const shop = new Sprite({
  position: {
    x: 600,
    y: 128
  },
  imageSrc: './img/shop.png',
  scale: 2.75,
  framesMax: 6
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

// Function to reset for a new round
function resetRound() {
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
  player.switchSprite('idle')
  enemy.switchSprite('idle')
  gsap.to('#playerHealth', { width: '100%' })
  gsap.to('#enemyHealth', { width: '100%' })

  timer = 60
  document.querySelector('#timer').innerHTML = timer
  clearTimeout(timerId)
  timerId = decreaseTimer() // Assign the timeout ID here
}


// Modified determineWinner to handle rounds
function determineWinner({ player, enemy, timerId }) {
  clearTimeout(timerId)
  document.querySelector('#displayText').style.display = 'flex'
  if (player.health === enemy.health) {
    document.querySelector('#displayText').innerHTML = 'Tie'
  } else if (player.health > enemy.health) {
    document.querySelector('#displayText').innerHTML = 'Player 1 Wins Round'
    playerWins++
    document.querySelector('#playerScore').innerHTML = playerWins // Update score display
  } else if (player.health < enemy.health) {
    document.querySelector('#displayText').innerHTML = 'Player 2 Wins Round'
    enemyWins++
    document.querySelector('#enemyScore').innerHTML = enemyWins // Update score display
  }

  // Check for overall winner
  if (playerWins >= maxWins || enemyWins >= maxWins) {
    // Game over
    document.querySelector('#displayText').innerHTML = (playerWins >= maxWins ? 'Player 1' : 'Player 2') + ' Wins the Match!'
    // Optionally, disable further input or show restart button
  } else {
    // Next round after a delay
    setTimeout(() => {
      document.querySelector('#displayText').style.display = 'none'
      resetRound()
    }, 3000) // 3 second delay before next round
  }
}

decreaseTimer() // This might need to be moved inside resetRound if it's per round, but assuming it's called initially


function animate() {
  window.requestAnimationFrame(animate)
  c.fillStyle = 'black'
  c.fillRect(0, 0, canvas.width, canvas.height)
  background.update()
  shop.update()
  c.fillStyle = 'rgba(255, 255, 255, 0.15)'
  c.fillRect(0, 0, canvas.width, canvas.height)
  player.update()
  enemy.update()
  player.velocity.x = 0
  enemy.velocity.x = 0
  // player movement
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
  // Enemy movement
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
  // detect for collision & enemy gets hit
  if (
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
  if (enemy.health <= 0 || player.health <= 0) {
    determineWinner({ player, enemy, timerId })
  }
}
animate()
window.addEventListener('keydown', (event) => {
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