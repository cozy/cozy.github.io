import Velocity from 'velocity-animate'
import styles from 'ducks/flash/style.styl'

// Temporary to show Coming soon

const flash = (type, msg, opts = {}) => {
  if (!msg) {
    msg = type
    type = 'info'
  }
  const node = document.createElement('div')
  node.classList.add(styles.flash, styles[`flash--${type}`])
  node.innerHTML = msg
  document.body.appendChild(node)
  Velocity(node, { opacity: [1, 0], translateY: [0, -200] }, { duration: 300 })
  setTimeout(() => {
    Velocity(
      node,
      { translateY: -200, opacity: 0 },
      {
        duration: 300,
        complete: () => {
          document.body.removeChild(node)
        }
      }
    )
  }, opts.duration || 3000)
}

export default flash
