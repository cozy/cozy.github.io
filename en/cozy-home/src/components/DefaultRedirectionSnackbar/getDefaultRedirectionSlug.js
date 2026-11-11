import { deconstructRedirectLink } from 'cozy-client'

export const getDefaultRedirectionSlug = defaultRedirection => {
  try {
    return deconstructRedirectLink(defaultRedirection).slug
  } catch {
    return null
  }
}
