export default (pred, msg) => {
  if (!pred) {
    throw new Error(msg)
  }
}
