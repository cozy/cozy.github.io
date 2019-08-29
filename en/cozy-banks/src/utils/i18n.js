const interlace = function(arr, delimiter) {
  const out = []
  const l = arr.length
  for (let i = 0; i < l; i++) {
    out.push(arr[i])
    if (i < l - 1) {
      out.push(delimiter)
    }
  }
  return out
}

const splitKeepingDelimiters = function(s, subs) {
  subs.forEach(function(sub) {
    s = s.split(sub)
    s = interlace(s, sub)
  })
  return s
}

const mapKeys = (original, fn) => {
  const out = {}
  Object.keys(original).forEach(k => {
    out[fn(k)] = original[k]
  })
  return out
}

/**
 * Custom translation function that supports interpolation
 * of any objects
 *
 * @example
 * ```
 * en.json: { welcome: 'Salut %{person} !'}
 *
 * customT(t, 'welcome', { person: <Person /> })
 * => ['Salut ', <Person />, ' !']
 * ```
 *
 * @param  {function} t    The original t function
 * @param  {string} key    The key to translate
 * @param  {object} subs   The substitutions
 * @return {array}         An array that you can insert into a render()
 */
export const objectT = (t, key, subs) => {
  subs = mapKeys(subs, x => `%{${x}}`)
  const subKeys = Object.keys(subs)
  const translated = t(key)
  const splitted = splitKeepingDelimiters(translated, subKeys)
  for (let i = 0; i < splitted.length; i++) {
    const item = splitted[i]
    if (subs[item]) {
      splitted[i] = subs[item]
    } else {
      splitted[i] = item
    }
  }
  return splitted
}
