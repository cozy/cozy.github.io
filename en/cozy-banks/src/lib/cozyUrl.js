const protocolRegex = '(https?):/{2}'
const cozyRegex = '([^.-]+)(-([^.]+))?.([^.]*.[^./:]*)'

export const getProtocol = url => {
  const r = new RegExp(`^${protocolRegex}`)

  if (url.match(r)) {
    return url.match(r)[1]
  }
}

export const getSlug = url => {
  const r = new RegExp(`^(${protocolRegex})?(${cozyRegex})`)

  if (url.match(r)) {
    return url.match(r)[4]
  }
}

export const getApp = url => {
  const r = new RegExp(`^(${protocolRegex})?(${cozyRegex})`)

  if (url.match(r)) {
    return url.match(r)[6]
  }
}

export const getDomain = url => {
  const r = new RegExp(`^(${protocolRegex})?(${cozyRegex})`)

  if (url.match(r)) {
    return url.match(r)[7]
  }
}
