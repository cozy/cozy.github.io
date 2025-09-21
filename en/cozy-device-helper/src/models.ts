import { FlagshipMetadata } from './flagship'

declare global {
  interface Window {
    cozy?: {
      flagship?: FlagshipMetadata
      isFlagshipApp?: boolean
    }
  }
}
