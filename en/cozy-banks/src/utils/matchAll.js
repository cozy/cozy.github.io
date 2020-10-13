// String.prototype.matchAll only available for node > 12
const matchAll = (str, regex) => {
  // Need to have the "g" flag
  const gRegex = new RegExp(regex, 'g')
  let matches
  const res = []
  while ((matches = gRegex.exec(str)) !== null) {
    res.push(matches[0])
  }
  return res
}

export default matchAll
