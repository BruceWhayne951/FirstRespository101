function rectangularCollision({ rectangle1, rectangle2 }) {
  return (
    rectangle1.attackBox.position.x + rectangle1.attackBox.width >=
      rectangle2.position.x &&
    rectangle1.attackBox.position.x <=
      rectangle2.position.x + rectangle2.width &&
    rectangle1.attackBox.position.y + rectangle1.attackBox.height >=
      rectangle2.position.y &&
    rectangle1.attackBox.position.y <= rectangle2.position.y + rectangle2.height
  )
}

// NOTE: `determineWinner` is implemented in `index.js` to handle rounds, scoring
// and match state. Removing the duplicate here prevents collisions where
// multiple determineWinner implementations interfere with scoring.

// Use window-scoped timer variables so `index.js` can set/reset them.
if (typeof window.timer === 'undefined') window.timer = 60
if (typeof window.timerId === 'undefined') window.timerId = null
function decreaseTimer() {
  if (window.timer > 0) {
    window.timerId = setTimeout(decreaseTimer, 1000)
    window.timer--
    document.querySelector('#timer').innerHTML = window.timer
  }

  if (window.timer === 0) {
    // call determineWinner implemented in index.js
    if (typeof determineWinner === 'function') {
      determineWinner({ player, enemy, timerId: window.timerId })
    }
  }
}