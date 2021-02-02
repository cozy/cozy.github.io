// Copied from ui/react/AppLinker/native
// getUniversalLinkDomain was changed
// TODO Remove this file if a solution is found for
// https://github.com/cozy/cozy-ui/issues/1173

const getUniversalLinkDomain = cozyUrl => {
  const url = new URL(cozyUrl)
  if (url.host.includes('.mycozy.cloud')) {
    return 'https://links.mycozy.cloud'
  } else {
    throw new Error('Unknown universal domain for ' + url.host)
  }
}

export const generateWebLink = ({
  cozyUrl,
  nativePath: nativePathArg,
  slug
}) => {
  const nativePath = ensureFirstSlash(nativePathArg)
  const url = new URL(cozyUrl)
  url.host = url.host
    .split('.')
    .map((x, i) => (i === 0 ? x + '-' + slug : x))
    .join('.')
  url.hash = nativePath
  return url.toString()
}

const ensureFirstSlash = path => {
  if (!path) {
    return '/'
  } else {
    return path.startsWith('/') ? path : '/' + path
  }
}

/**
 * Returns a universal link for an app + native path
 *
 * @param  {string} options.slug        - eg: drive
 * @param  {string} options.nativePath  - /path/to/view
 * @param  {string} options.fallbackUrl - https://...mycozy.cloud, optional if cozyUrl is passed
 * @param  {string} options.cozyUrl     - https://name.mycozy.cloud, optional if fallbackUrl is passed
 * @param  {string} options.universalLinkDomain
 * @return {string}                     - https://links.cozy.cloud/drive/?fallback...
 */
export const generateUniversalLink = options => {
  const { slug, cozyUrl } = options
  let { fallbackUrl, nativePath } = options
  nativePath = ensureFirstSlash(nativePath)
  if (!cozyUrl && !fallbackUrl) {
    throw new Error(
      'Must have either cozyUrl or fallbackUrl to generate universal link.'
    )
  }
  if (cozyUrl && !fallbackUrl) {
    fallbackUrl = generateWebLink({ cozyUrl, nativePath, slug })
  }
  let url = getUniversalLinkDomain(cozyUrl) + '/' + slug + nativePath
  const urlObj = new URL(url)
  urlObj.searchParams.append('fallback', fallbackUrl)
  return urlObj.toString()
}
